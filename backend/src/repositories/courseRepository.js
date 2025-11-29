const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

/**
 * Репозиторий для работы с курсами
 * @class CourseRepository
 * @extends BaseRepository
 */
class CourseRepository extends BaseRepository {
  constructor() {
    super('course');
  }

  /**
   * Найти курс с преподавателем
   * @param {string} courseId - ID курса
   * @returns {Promise<object|null>}
   */
  async findByIdWithTeacher(courseId) {
    return prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: {
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
   * Найти курсы преподавателя
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<Array>}
   */
  async findByTeacher(teacherId) {
    return prisma.course.findMany({
      where: { teacherId },
      include: {
        _count: {
          select: {
            enrollments: true,
            materials: true,
            assignments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Найти курсы студента
   * @param {string} studentId - ID студента
   * @returns {Promise<Array>}
   */
  async findByStudent(studentId) {
    return prisma.course.findMany({
      where: {
        enrollments: {
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
            lastName: true
          }
        },
        _count: {
          select: {
            materials: true,
            assignments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Найти доступные курсы для студента
   * @param {string} studentEmail - Email студента
   * @returns {Promise<Array>}
   */
  async findAvailableForStudent(studentEmail) {
    return prisma.course.findMany({
      where: {
        OR: [
          { isPrivate: false },
          {
            isPrivate: true,
            allowedEmails: {
              contains: studentEmail
            }
          }
        ]
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            materials: true,
            assignments: true,
            enrollments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Проверить запись студента на курс
   * @param {string} studentId - ID студента
   * @param {string} courseId - ID курса
   * @returns {Promise<object|null>}
   */
  async findEnrollment(studentId, courseId) {
    return prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    });
  }

  /**
   * Создать запись студента на курс
   * @param {string} studentId - ID студента
   * @param {string} courseId - ID курса
   * @returns {Promise<object>}
   */
  async createEnrollment(studentId, courseId) {
    return prisma.courseEnrollment.create({
      data: {
        studentId,
        courseId
      },
      include: {
        course: true
      }
    });
  }

  /**
   * Получить все записи на курс
   * @param {string} courseId - ID курса
   * @returns {Promise<Array>}
   */
  async findEnrollmentsByCourse(courseId) {
    return prisma.courseEnrollment.findMany({
      where: { courseId },
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

module.exports = new CourseRepository();

