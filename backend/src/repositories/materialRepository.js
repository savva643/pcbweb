const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

/**
 * Репозиторий для работы с материалами
 * @class MaterialRepository
 * @extends BaseRepository
 */
class MaterialRepository extends BaseRepository {
  constructor() {
    super('material');
  }

  /**
   * Получить материалы курса
   * @param {string} courseId - ID курса
   * @returns {Promise<Array>}
   */
  async findByCourse(courseId) {
    return prisma.material.findMany({
      where: { courseId },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            description: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });
  }

  /**
   * Получить версии материала
   * @param {string} materialId - ID материала
   * @returns {Promise<Array>}
   */
  async findVersions(materialId) {
    return prisma.materialVersion.findMany({
      where: { materialId },
      orderBy: { version: 'desc' }
    });
  }

  /**
   * Получить конкретную версию материала
   * @param {string} materialId - ID материала
   * @param {number} version - Номер версии
   * @returns {Promise<object|null>}
   */
  async findVersion(materialId, version) {
    return prisma.materialVersion.findUnique({
      where: {
        materialId_version: {
          materialId,
          version: parseInt(version)
        }
      }
    });
  }

  /**
   * Получить последнюю версию материала
   * @param {string} materialId - ID материала
   * @returns {Promise<object|null>}
   */
  async findLatestVersion(materialId) {
    return prisma.materialVersion.findFirst({
      where: { materialId },
      orderBy: { version: 'desc' }
    });
  }

  /**
   * Создать версию материала
   * @param {object} data - Данные версии
   * @returns {Promise<object>}
   */
  async createVersion(data) {
    return prisma.materialVersion.create({
      data
    });
  }
}

module.exports = new MaterialRepository();

