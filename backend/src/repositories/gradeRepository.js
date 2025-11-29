const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

/**
 * Репозиторий для работы с оценками
 * @class GradeRepository
 * @extends BaseRepository
 */
class GradeRepository extends BaseRepository {
  constructor() {
    super('grade');
  }

  /**
   * Создать или обновить оценку
   * @param {string} submissionId - ID отправки
   * @param {object} data - Данные оценки
   * @returns {Promise<object>}
   */
  async upsertGrade(submissionId, data) {
    return prisma.grade.upsert({
      where: { submissionId },
      update: data,
      create: {
        submissionId,
        ...data
      }
    });
  }

  /**
   * Получить оценки студента
   * @param {string} studentId - ID студента
   * @returns {Promise<Array>}
   */
  async findByStudent(studentId) {
    return prisma.grade.findMany({
      where: { studentId },
      include: {
        submission: {
          include: {
            assignment: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true
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

module.exports = new GradeRepository();

