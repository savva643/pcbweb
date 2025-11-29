const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

/**
 * Репозиторий для работы с отправками заданий
 * @class SubmissionRepository
 * @extends BaseRepository
 */
class SubmissionRepository extends BaseRepository {
  constructor() {
    super('submission');
  }

  /**
   * Найти отправку студента по заданию
   * @param {string} assignmentId - ID задания
   * @param {string} studentId - ID студента
   * @returns {Promise<object|null>}
   */
  async findByAssignmentAndStudent(assignmentId, studentId) {
    return prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId
      }
    });
  }

  /**
   * Получить отправки по заданию
   * @param {string} assignmentId - ID задания
   * @returns {Promise<Array>}
   */
  async findByAssignment(assignmentId) {
    return prisma.submission.findMany({
      where: { assignmentId },
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
      },
      orderBy: { submittedAt: 'desc' }
    });
  }

  /**
   * Получить версии отправки
   * @param {string} submissionId - ID отправки
   * @returns {Promise<Array>}
   */
  async findVersions(submissionId) {
    return prisma.submissionVersion.findMany({
      where: { submissionId },
      orderBy: { version: 'desc' }
    });
  }

  /**
   * Получить конкретную версию отправки
   * @param {string} submissionId - ID отправки
   * @param {number} version - Номер версии
   * @returns {Promise<object|null>}
   */
  async findVersion(submissionId, version) {
    return prisma.submissionVersion.findUnique({
      where: {
        submissionId_version: {
          submissionId,
          version: parseInt(version)
        }
      }
    });
  }

  /**
   * Получить последнюю версию отправки
   * @param {string} submissionId - ID отправки
   * @returns {Promise<object|null>}
   */
  async findLatestVersion(submissionId) {
    return prisma.submissionVersion.findFirst({
      where: { submissionId },
      orderBy: { version: 'desc' }
    });
  }

  /**
   * Создать версию отправки
   * @param {object} data - Данные версии
   * @returns {Promise<object>}
   */
  async createVersion(data) {
    return prisma.submissionVersion.create({
      data
    });
  }
}

module.exports = new SubmissionRepository();

