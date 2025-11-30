const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

class HomeworkRepository extends BaseRepository {
  constructor() {
    super('homework');
  }

  /**
   * Найти все домашние задания группы
   * @param {string} groupId - ID группы
   * @returns {Promise<Array>}
   */
  async findByGroup(groupId) {
    return prisma.homework.findMany({
      where: { groupId },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Найти домашнее задание с деталями
   * @param {string} id - ID домашнего задания
   * @returns {Promise<object>}
   */
  async findByIdWithDetails(id) {
    return prisma.homework.findUnique({
      where: { id },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            teacherId: true
          }
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            grade: true,
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });
  }

  /**
   * Найти отправки домашнего задания
   * @param {string} homeworkId - ID домашнего задания
   * @returns {Promise<Array>}
   */
  async findSubmissions(homeworkId) {
    return prisma.homeworkSubmission.findMany({
      where: { homeworkId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        grade: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
  }

  /**
   * Найти отправку студента
   * @param {string} homeworkId - ID домашнего задания
   * @param {string} studentId - ID студента
   * @returns {Promise<object|null>}
   */
  async findSubmission(homeworkId, studentId) {
    return prisma.homeworkSubmission.findFirst({
      where: {
        homeworkId,
        studentId
      },
      include: {
        grade: true
      }
    });
  }

  /**
   * Создать отправку домашнего задания
   * @param {object} data - Данные отправки
   * @returns {Promise<object>}
   */
  async createSubmission(data) {
    return prisma.homeworkSubmission.create({
      data,
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
   * Обновить отправку домашнего задания
   * @param {string} id - ID отправки
   * @param {object} data - Данные для обновления
   * @returns {Promise<object>}
   */
  async updateSubmission(id, data) {
    return prisma.homeworkSubmission.update({
      where: { id },
      data,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        grade: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  /**
   * Создать оценку за домашнее задание
   * @param {object} data - Данные оценки
   * @returns {Promise<object>}
   */
  async createGrade(data) {
    return prisma.homeworkGrade.create({
      data,
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
   * Обновить оценку за домашнее задание
   * @param {string} submissionId - ID отправки
   * @param {object} data - Данные для обновления
   * @returns {Promise<object>}
   */
  async updateGrade(submissionId, data) {
    return prisma.homeworkGrade.update({
      where: { submissionId },
      data,
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
}

module.exports = new HomeworkRepository();

