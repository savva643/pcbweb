const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

/**
 * Репозиторий для работы с прогрессом
 * @class ProgressRepository
 * @extends BaseRepository
 */
class ProgressRepository extends BaseRepository {
  constructor() {
    super('progress');
  }

  /**
   * Получить прогресс студента по курсу
   * @param {string} courseId - ID курса
   * @param {string} studentId - ID студента
   * @returns {Promise<Array>}
   */
  async findByCourseAndStudent(courseId, studentId) {
    return prisma.progress.findMany({
      where: {
        courseId,
        studentId
      }
    });
  }

  /**
   * Найти или создать запись прогресса
   * @param {string} courseId - ID курса
   * @param {string} studentId - ID студента
   * @param {string} materialId - ID материала
   * @param {object} data - Данные прогресса
   * @returns {Promise<object>}
   */
  async upsertProgress(courseId, studentId, materialId, data) {
    return prisma.progress.upsert({
      where: {
        studentId_courseId_materialId: {
          studentId,
          courseId,
          materialId: materialId || null
        }
      },
      update: data,
      create: {
        courseId,
        studentId,
        materialId: materialId || null,
        ...data
      }
    });
  }
}

module.exports = new ProgressRepository();

