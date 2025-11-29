const chatRepository = require('../repositories/chatRepository');
const courseRepository = require('../repositories/courseRepository');

/**
 * Сервис для работы с чатом
 * @class ChatService
 */
class ChatService {
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
   * Получить темы курса
   * @param {string} courseId - ID курса
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<Array>} Список тем
   */
  async getCourseTopics(courseId, userId, userRole) {
    await this.checkCourseAccess(courseId, userId, userRole);

    // Для студентов показываем только публичные темы
    // Для преподавателя показываем все темы (публичные + приватные)
    const includePrivate = userRole === 'TEACHER';

    return chatRepository.findTopicsByCourse(courseId, includePrivate);
  }

  /**
   * Создать тему
   * @param {string} courseId - ID курса
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @param {object} data - Данные темы
   * @param {string} data.title - Название темы
   * @param {string} [data.description] - Описание темы
   * @param {boolean} [data.isPrivate=false] - Приватная тема
   * @returns {Promise<object>} Созданная тема
   */
  async createTopic(courseId, userId, userRole, { title, description, isPrivate = false }) {
    await this.checkCourseAccess(courseId, userId, userRole);

    // Только преподаватель может создавать приватные темы
    if (isPrivate && userRole !== 'TEACHER') {
      throw new Error('Only teachers can create private topics');
    }

    return chatRepository.create({
      courseId,
      title,
      description,
      isPrivate: isPrivate || false,
      createdBy: userId
    }, {
      _count: {
        select: {
          messages: true
        }
      }
    });
  }

  /**
   * Получить приватную тему преподавателя (личные сообщения)
   * @param {string} courseId - ID курса
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<object>} Приватная тема
   */
  async getOrCreatePrivateTopic(courseId, teacherId) {
    // Ищем существующую приватную тему
    let topic = await chatRepository.findPrivateTopic(courseId, teacherId);

    // Если нет, создаем
    if (!topic) {
      const course = await courseRepository.findById(courseId);

      if (!course || course.teacherId !== teacherId) {
        throw new Error('Access denied');
      }

      topic = await chatRepository.create({
        courseId,
        title: 'Личные сообщения',
        description: 'Приватное обсуждение для преподавателя',
        isPrivate: true,
        createdBy: teacherId
      });
    }

    return topic;
  }

  /**
   * Проверка доступа к теме
   * @param {string} topicId - ID темы
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<object>} Тема
   * @throws {Error} Если доступ запрещен
   */
  async checkTopicAccess(topicId, userId, userRole) {
    const topic = await chatRepository.findById(topicId, {
      course: true
    });

    if (!topic) {
      throw new Error('Topic not found');
    }

    // Если тема приватная, доступ только у преподавателя курса
    if (topic.isPrivate) {
      if (userRole !== 'TEACHER' || topic.course.teacherId !== userId) {
        throw new Error('Access denied');
      }
      return topic;
    }

    // Для публичных тем проверяем доступ к курсу
    await this.checkCourseAccess(topic.courseId, userId, userRole);
    return topic;
  }

  /**
   * Получить сообщения темы
   * @param {string} topicId - ID темы
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<Array>} Список сообщений
   */
  async getTopicMessages(topicId, userId, userRole) {
    await this.checkTopicAccess(topicId, userId, userRole);
    return chatRepository.findMessagesByTopic(topicId);
  }

  /**
   * Отправить сообщение
   * @param {string} topicId - ID темы
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @param {string} content - Содержимое сообщения
   * @returns {Promise<object>} Созданное сообщение
   */
  async sendMessage(topicId, userId, userRole, content) {
    await this.checkTopicAccess(topicId, userId, userRole);

    return chatRepository.createMessage({
      topicId,
      authorId: userId,
      content
    });
  }

  /**
   * Обновить сообщение
   * @param {string} messageId - ID сообщения
   * @param {string} userId - ID пользователя
   * @param {string} content - Новое содержимое
   * @returns {Promise<object>} Обновленное сообщение
   */
  async updateMessage(messageId, userId, content) {
    const message = await chatRepository.findMessageById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.authorId !== userId) {
      throw new Error('Access denied');
    }

    return chatRepository.updateMessage(messageId, { content });
  }

  /**
   * Удалить сообщение
   * @param {string} messageId - ID сообщения
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<object>} Результат удаления
   */
  async deleteMessage(messageId, userId, userRole) {
    const message = await chatRepository.findMessageById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    const isAuthor = message.authorId === userId;
    const isTeacher = userRole === 'TEACHER' && message.topic.course.teacherId === userId;

    if (!isAuthor && !isTeacher) {
      throw new Error('Access denied');
    }

    await chatRepository.deleteMessage(messageId);
    return { success: true };
  }
}

module.exports = new ChatService();
