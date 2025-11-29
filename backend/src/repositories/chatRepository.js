const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

/**
 * Репозиторий для работы с чатом
 * @class ChatRepository
 * @extends BaseRepository
 */
class ChatRepository extends BaseRepository {
  constructor() {
    super('chatTopic');
  }

  /**
   * Получить все темы курса
   * @param {string} courseId - ID курса
   * @param {boolean} includePrivate - Включить приватные темы
   * @returns {Promise<Array>}
   */
  async findTopicsByCourse(courseId, includePrivate = false) {
    const where = { courseId };
    if (!includePrivate) {
      where.isPrivate = false;
      where.participantId = null; // Исключаем личные чаты
    } else {
      // Для преподавателя исключаем личные чаты (они добавляются отдельно)
      where.participantId = null;
    }

    return prisma.chatTopic.findMany({
      where,
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Найти приватную тему преподавателя (старая версия, без participantId)
   * @param {string} courseId - ID курса
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<object|null>}
   */
  async findPrivateTopic(courseId, teacherId) {
    return prisma.chatTopic.findFirst({
      where: {
        courseId,
        isPrivate: true,
        createdBy: teacherId,
        participantId: null
      }
    });
  }

  /**
   * Найти личный чат между двумя участниками
   * @param {string} courseId - ID курса
   * @param {string} userId1 - ID первого участника
   * @param {string} userId2 - ID второго участника
   * @returns {Promise<object|null>}
   */
  async findPersonalChat(courseId, userId1, userId2) {
    return prisma.chatTopic.findFirst({
      where: {
        courseId,
        isPrivate: true,
        participantId: {
          not: null
        },
        OR: [
          {
            createdBy: userId1,
            participantId: userId2
          },
          {
            createdBy: userId2,
            participantId: userId1
          }
        ]
      },
      include: {
        _count: {
          select: {
            messages: true
          }
        }
      }
    });
  }

  /**
   * Получить сообщения темы
   * @param {string} topicId - ID темы
   * @returns {Promise<Array>}
   */
  async findMessagesByTopic(topicId) {
    return prisma.chatMessage.findMany({
      where: { topicId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  /**
   * Создать сообщение
   * @param {object} data - Данные сообщения
   * @returns {Promise<object>}
   */
  async createMessage(data) {
    return prisma.chatMessage.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  /**
   * Найти сообщение по ID
   * @param {string} messageId - ID сообщения
   * @returns {Promise<object|null>}
   */
  async findMessageById(messageId) {
    return prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        topic: {
          include: {
            course: true
          }
        }
      }
    });
  }

  /**
   * Обновить сообщение
   * @param {string} messageId - ID сообщения
   * @param {object} data - Данные для обновления
   * @returns {Promise<object>}
   */
  async updateMessage(messageId, data) {
    return prisma.chatMessage.update({
      where: { id: messageId },
      data,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });
  }

  /**
   * Удалить сообщение
   * @param {string} messageId - ID сообщения
   * @returns {Promise<object>}
   */
  async deleteMessage(messageId) {
    return prisma.chatMessage.delete({
      where: { id: messageId }
    });
  }
}

module.exports = new ChatRepository();

