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
   * Создать тему с поддержкой _count
   * @param {object} data - Данные темы
   * @param {object} options - Опции (include, _count)
   * @returns {Promise<object>}
   */
  async create(data, options = {}) {
    const { include = {}, _count } = options;
    
    const createOptions = {
      data
    };
    
    if (Object.keys(include).length > 0) {
      createOptions.include = include;
    }
    
    if (_count) {
      createOptions._count = _count;
    }
    
    return prisma.chatTopic.create(createOptions);
  }

  /**
   * Найти тему по ID с поддержкой _count
   * @param {string} id - ID темы
   * @param {object} options - Опции (include, _count)
   * @returns {Promise<object|null>}
   */
  async findById(id, options = {}) {
    const { include = {}, _count } = options;
    
    const findOptions = {
      where: { id }
    };
    
    if (Object.keys(include).length > 0) {
      findOptions.include = include;
    }
    
    if (_count) {
      findOptions._count = _count;
    }
    
    return prisma.chatTopic.findUnique(findOptions);
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
    // Ищем чат, где userId1 - создатель, userId2 - участник
    const chat1 = await prisma.chatTopic.findFirst({
      where: {
        courseId,
        isPrivate: true,
        participantId: userId2,
        createdBy: userId1
      }
    });
    
    if (chat1) {
      return prisma.chatTopic.findUnique({
        where: { id: chat1.id },
        include: {
          _count: {
            select: {
              messages: true
            }
          }
        }
      });
    }
    
    // Ищем чат, где userId2 - создатель, userId1 - участник
    const chat2 = await prisma.chatTopic.findFirst({
      where: {
        courseId,
        isPrivate: true,
        participantId: userId1,
        createdBy: userId2
      }
    });
    
    if (chat2) {
      return prisma.chatTopic.findUnique({
        where: { id: chat2.id },
        include: {
          _count: {
            select: {
              messages: true
            }
          }
        }
      });
    }
    
    return null;
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

