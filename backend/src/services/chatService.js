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

    const course = await courseRepository.findById(courseId);

    // Для студентов показываем публичные темы + личный чат с преподавателем
    // Для преподавателя показываем все темы (публичные + приватные + личные чаты со студентами)
    if (userRole === 'STUDENT') {
      const publicTopics = await chatRepository.findTopicsByCourse(courseId, false);
      
      // Получаем личный чат с преподавателем
      const personalChat = await chatRepository.findPersonalChat(courseId, userId, course.teacherId);
      
      // Объединяем: сначала личный чат (если есть), потом публичные
      return personalChat ? [personalChat, ...publicTopics] : publicTopics;
    } else {
      // Для преподавателя показываем все темы, включая личные чаты со студентами
      const allTopics = await chatRepository.findTopicsByCourse(courseId, true);
      
      // Получаем все личные чаты со студентами
      const enrollments = await courseRepository.findEnrollmentsByCourse(courseId);
      const personalChats = [];
      
      for (const enrollment of enrollments) {
        const personalChat = await chatRepository.findPersonalChat(courseId, userId, enrollment.studentId);
        if (personalChat) {
          personalChats.push(personalChat);
        }
      }
      
      // Объединяем: сначала личные чаты, потом остальные
      return [...personalChats, ...allTopics.filter(t => !t.participantId)];
    }
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
   * @param {string} [data.participantId] - ID участника для личного чата
   * @returns {Promise<object>} Созданная тема
   */
  async createTopic(courseId, userId, userRole, { title, description, isPrivate = false, participantId = null }) {
    await this.checkCourseAccess(courseId, userId, userRole);

    const course = await courseRepository.findById(courseId);

    // Если создается личный чат
    if (participantId) {
      // Проверяем, что участник есть на курсе
      if (userRole === 'STUDENT') {
        // Студент может создать личный чат только с преподавателем курса
        if (participantId !== course.teacherId) {
          throw new Error('Student can only create personal chat with course teacher');
        }
      } else if (userRole === 'TEACHER') {
        // Преподаватель может создать личный чат со студентом курса
        const enrollment = await courseRepository.findEnrollment(participantId, courseId);
        if (!enrollment) {
          throw new Error('Student not enrolled in this course');
        }
      }

      // Проверяем, не существует ли уже личный чат
      // Метод findPersonalChat уже проверяет в обе стороны
      const existingChat = await chatRepository.findPersonalChat(courseId, userId, participantId);
      
      if (existingChat) {
        return existingChat;
      }

      // Создаем личный чат
      const titleText = userRole === 'STUDENT' 
        ? `Чат с преподавателем` 
        : `Чат со студентом`;

      const newTopic = await chatRepository.create({
        courseId,
        title: titleText,
        description: null,
        isPrivate: true,
        participantId: participantId,
        createdBy: userId
      }, {
        _count: {
          select: {
            messages: true
          }
        }
      });
      
      // Если тема создана, но не содержит _count, добавляем его
      if (newTopic && !newTopic._count) {
        return chatRepository.findById(newTopic.id, {
          _count: {
            select: {
              messages: true
            }
          }
        });
      }
      
      return newTopic;
    }

    // Обычная тема (публичная или приватная для преподавателя)
    // Только преподаватель может создавать приватные темы
    if (isPrivate && userRole !== 'TEACHER') {
      throw new Error('Only teachers can create private topics');
    }

    const newTopic = await chatRepository.create({
      courseId,
      title,
      description,
      isPrivate: isPrivate || false,
      participantId: null,
      createdBy: userId
    }, {
      _count: {
        select: {
          messages: true
        }
      }
    });
    
    // Если тема создана, но не содержит _count, добавляем его
    if (newTopic && !newTopic._count) {
      return chatRepository.findById(newTopic.id, {
        _count: {
          select: {
            messages: true
          }
        }
      });
    }
    
    return newTopic;
  }

  /**
   * Получить или создать личный чат между студентом и преподавателем
   * @param {string} courseId - ID курса
   * @param {string} userId - ID пользователя (студент или преподаватель)
   * @param {string} userRole - Роль пользователя
   * @param {string} [participantId] - ID участника (опционально, для создания нового чата)
   * @returns {Promise<object>} Личный чат
   */
  async getOrCreatePersonalChat(courseId, userId, userRole, participantId = null) {
    const course = await courseRepository.findById(courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    let targetParticipantId = participantId;

    // Если participantId не указан, определяем его автоматически
    if (!targetParticipantId) {
      if (userRole === 'STUDENT') {
        // Студент хочет чат с преподавателем
        targetParticipantId = course.teacherId;
      } else if (userRole === 'TEACHER') {
        throw new Error('Teacher must specify participantId');
      }
    }

    // Проверяем доступ
    if (userRole === 'STUDENT') {
      // Студент может создать чат только с преподавателем
      if (targetParticipantId !== course.teacherId) {
        throw new Error('Student can only create personal chat with course teacher');
      }
      const enrollment = await courseRepository.findEnrollment(userId, courseId);
      if (!enrollment) {
        throw new Error('Access denied');
      }
    } else if (userRole === 'TEACHER') {
      // Преподаватель может создать чат со студентом
      if (course.teacherId !== userId) {
        throw new Error('Access denied');
      }
      const enrollment = await courseRepository.findEnrollment(targetParticipantId, courseId);
      if (!enrollment) {
        throw new Error('Student not enrolled in this course');
      }
    }

    // Ищем существующий личный чат
    // Метод findPersonalChat уже проверяет в обе стороны (кто создатель)
    const topic = await chatRepository.findPersonalChat(courseId, userId, targetParticipantId);

    // Если чат не найден, создаем новый
    if (!topic) {
      const title = userRole === 'STUDENT' 
        ? `Чат с преподавателем` 
        : `Чат со студентом`;

      const newTopic = await chatRepository.create({
        courseId,
        title,
        description: null,
        isPrivate: true,
        participantId: targetParticipantId,
        createdBy: userId
      }, {
        _count: {
          select: {
            messages: true
          }
        }
      });
      
      // Если тема создана, но не содержит _count, добавляем его
      if (newTopic && !newTopic._count) {
        topic = await chatRepository.findById(newTopic.id, {
          _count: {
            select: {
              messages: true
            }
          }
        });
      } else {
        topic = newTopic;
      }
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

    // Если тема приватная
    if (topic.isPrivate) {
      // Если это личный чат (есть participantId)
      if (topic.participantId) {
        // Доступ имеют оба участника
        if (userId !== topic.createdBy && userId !== topic.participantId) {
          throw new Error('Access denied');
        }
        return topic;
      }
      
      // Старая приватная тема (только для преподавателя)
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
