const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

class GroupRepository extends BaseRepository {
  constructor() {
    super('group');
  }

  /**
   * Найти все группы преподавателя
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<Array>}
   */
  async findByTeacher(teacherId) {
    return prisma.group.findMany({
      where: { teacherId },
      include: {
        _count: {
          select: {
            members: true,
            homeworks: true,
            courseAssignments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Найти группу с деталями
   * @param {string} id - ID группы
   * @returns {Promise<object>}
   */
  async findByIdWithDetails(id) {
    return prisma.group.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        members: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        homeworks: {
          include: {
            _count: {
              select: {
                submissions: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        courseAssignments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true
              },
              include: {
                tests: {
                  where: {
                    isActive: true
                  },
                  include: {
                    _count: {
                      select: {
                        questions: true,
                        attempts: true
                      }
                    }
                  },
                  orderBy: {
                    createdAt: 'desc'
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            members: true,
            homeworks: true,
            courseAssignments: true
          }
        }
      }
    });
  }

  /**
   * Найти группы студента
   * @param {string} studentId - ID студента
   * @returns {Promise<Array>}
   */
  async findByStudent(studentId) {
    return prisma.group.findMany({
      where: {
        members: {
          some: {
            studentId
          }
        }
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true,
            homeworks: true,
            courseAssignments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Добавить студента в группу
   * @param {string} groupId - ID группы
   * @param {string} studentId - ID студента
   * @returns {Promise<object>}
   */
  async addMember(groupId, studentId) {
    return prisma.groupMember.create({
      data: {
        groupId,
        studentId
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Удалить студента из группы
   * @param {string} groupId - ID группы
   * @param {string} studentId - ID студента
   * @returns {Promise<object>}
   */
  async removeMember(groupId, studentId) {
    return prisma.groupMember.deleteMany({
      where: {
        groupId,
        studentId
      }
    });
  }

  /**
   * Проверить, является ли пользователь участником группы
   * @param {string} groupId - ID группы
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<boolean>}
   */
  async isMember(groupId, userId, userRole) {
    if (userRole === 'TEACHER') {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { teacherId: true }
      });
      return group?.teacherId === userId;
    } else {
      const member = await prisma.groupMember.findFirst({
        where: {
          groupId,
          studentId: userId
        }
      });
      return !!member;
    }
  }
}

module.exports = new GroupRepository();

