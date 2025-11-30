const materialRepository = require('../repositories/materialRepository');
const courseRepository = require('../repositories/courseRepository');

/**
 * Сервис для работы с материалами
 * @class MaterialService
 */
class MaterialService {
  /**
   * Проверка доступа к курсу
   * @param {string} courseId - ID курса
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<object>} Курс
   * @throws {Error} Если доступ запрещен
   */
  async checkCourseAccess(courseId, userId, userRole) {
    const course = await courseRepository.findById(courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    if (userRole === 'STUDENT') {
      const enrollment = await courseRepository.findEnrollment(userId, courseId);
      if (!enrollment) {
        throw new Error('Access denied');
      }
    } else if (userRole === 'TEACHER' && course.teacherId !== userId) {
      throw new Error('Access denied');
    }

    return course;
  }

  /**
   * Получить материалы курса
   * @param {string} courseId - ID курса
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<Array>} Список материалов
   */
  async getCourseMaterials(courseId, userId, userRole) {
    await this.checkCourseAccess(courseId, userId, userRole);
    return materialRepository.findByCourse(courseId);
  }

  /**
   * Создать материал
   * @param {string} courseId - ID курса
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные материала
   * @param {string} data.title - Название
   * @param {string} [data.description] - Описание
   * @param {string} data.type - Тип (video, text, scorm, file)
   * @param {string} [data.contentUrl] - URL контента
   * @param {number} [data.order=0] - Порядок
   * @returns {Promise<object>} Созданный материал
   */
  async createMaterial(courseId, teacherId, data) {
    await this.checkCourseAccess(courseId, teacherId, 'TEACHER');

    const material = await materialRepository.create({
      courseId,
      title: data.title,
      description: data.description,
      type: data.type,
      contentUrl: data.contentUrl,
      order: data.order ? parseInt(data.order) : 0,
      assignmentId: data.assignmentId || null
    });

    // Создать начальную версию
    await materialRepository.createVersion({
      materialId: material.id,
      version: 1,
      title: material.title,
      description: material.description,
      contentUrl: material.contentUrl,
      order: material.order,
      createdBy: teacherId
    });

    return material;
  }

  /**
   * Обновить материал
   * @param {string} materialId - ID материала
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные для обновления
   * @returns {Promise<object>} Обновленный материал
   */
  async updateMaterial(materialId, teacherId, data) {
    const material = await materialRepository.findById(materialId, {
      course: true
    });

    if (!material) {
      throw new Error('Material not found');
    }

    if (material.course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.order !== undefined) updateData.order = parseInt(data.order);
    if (data.contentUrl !== undefined) updateData.contentUrl = data.contentUrl;
    if (data.assignmentId !== undefined) updateData.assignmentId = data.assignmentId || null;

    const updatedMaterial = await materialRepository.update(materialId, updateData);

    // Создать новую версию
    const latestVersion = await materialRepository.findLatestVersion(materialId);
    const nextVersion = (latestVersion?.version || 0) + 1;

    await materialRepository.createVersion({
      materialId: material.id,
      version: nextVersion,
      title: updatedMaterial.title,
      description: updatedMaterial.description,
      contentUrl: updatedMaterial.contentUrl,
      order: updatedMaterial.order,
      createdBy: teacherId
    });

    return updatedMaterial;
  }

  /**
   * Получить версии материала
   * @param {string} materialId - ID материала
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<Array>} Список версий
   */
  async getMaterialVersions(materialId, teacherId) {
    const material = await materialRepository.findById(materialId, {
      course: true
    });

    if (!material || material.course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    return materialRepository.findVersions(materialId);
  }

  /**
   * Получить конкретную версию материала
   * @param {string} materialId - ID материала
   * @param {number} version - Номер версии
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<object>} Версия материала
   */
  async getMaterialVersion(materialId, version, teacherId) {
    const material = await materialRepository.findById(materialId, {
      course: true
    });

    if (!material || material.course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const materialVersion = await materialRepository.findVersion(materialId, version);
    if (!materialVersion) {
      throw new Error('Version not found');
    }

    return materialVersion;
  }
}

module.exports = new MaterialService();

