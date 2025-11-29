const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

/**
 * Репозиторий для работы с заданиями
 * @class AssignmentRepository
 * @extends BaseRepository
 */
class AssignmentRepository extends BaseRepository {
  constructor() {
    super('assignment');
  }

  /**
   * Получить задания курса
   * @param {string} courseId - ID курса
   * @returns {Promise<Array>}
   */
  async findByCourse(courseId) {
    return prisma.assignment.findMany({
      where: { courseId },
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
   * Получить задание с курсом
   * @param {string} assignmentId - ID задания
   * @returns {Promise<object|null>}
   */
  async findByIdWithCourse(assignmentId) {
    return prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: true
      }
    });
  }

  /**
   * Получить задание с отправками (для преподавателя)
   * @param {string} assignmentId - ID задания
   * @returns {Promise<object|null>}
   */
  async findByIdWithSubmissions(assignmentId) {
    return prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: true,
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
              }
            }
          }
        }
      }
    });
  }
}

module.exports = new AssignmentRepository();

