const chatService = require('../services/chatService');
const { validationResult } = require('express-validator');

/**
 * Контроллер для работы с чатом
 * @class ChatController
 */
class ChatController {
  /**
   * Получить темы курса
   * @route GET /api/chat/course/:courseId/topics
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async getCourseTopics(req, res) {
    try {
      const { courseId } = req.params;
      const topics = await chatService.getCourseTopics(courseId, req.user.id, req.user.role);
      res.json(topics);
    } catch (error) {
      console.error('Get chat topics error:', error);
      if (error.message === 'Course not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch topics' });
    }
  }

  /**
   * Получить или создать приватную тему
   * @route GET /api/chat/course/:courseId/private-topic
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async getPrivateTopic(req, res) {
    try {
      if (req.user.role !== 'TEACHER') {
        return res.status(403).json({ error: 'Only teachers can access private topics' });
      }

      const { courseId } = req.params;
      const topic = await chatService.getOrCreatePrivateTopic(courseId, req.user.id);
      res.json(topic);
    } catch (error) {
      console.error('Get private topic error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch private topic' });
    }
  }

  /**
   * Создать тему
   * @route POST /api/chat/course/:courseId/topics
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async createTopic(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { courseId } = req.params;
      const { title, description, isPrivate } = req.body;

      const topic = await chatService.createTopic(courseId, req.user.id, req.user.role, {
        title,
        description,
        isPrivate
      });

      res.status(201).json(topic);
    } catch (error) {
      console.error('Create chat topic error:', error);
      if (error.message === 'Course not found' || error.message === 'Access denied' || error.message === 'Only teachers can create private topics') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create topic' });
    }
  }

  /**
   * Получить сообщения темы
   * @route GET /api/chat/topics/:topicId/messages
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async getTopicMessages(req, res) {
    try {
      const { topicId } = req.params;
      const messages = await chatService.getTopicMessages(topicId, req.user.id, req.user.role);
      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      if (error.message === 'Topic not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  /**
   * Отправить сообщение
   * @route POST /api/chat/topics/:topicId/messages
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async sendMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { topicId } = req.params;
      const { content } = req.body;

      const message = await chatService.sendMessage(topicId, req.user.id, req.user.role, content);
      res.status(201).json(message);
    } catch (error) {
      console.error('Send message error:', error);
      if (error.message === 'Topic not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  /**
   * Обновить сообщение
   * @route PUT /api/chat/messages/:id
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async updateMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { content } = req.body;

      const updatedMessage = await chatService.updateMessage(id, req.user.id, content);
      res.json(updatedMessage);
    } catch (error) {
      console.error('Update message error:', error);
      if (error.message === 'Message not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update message' });
    }
  }

  /**
   * Удалить сообщение
   * @route DELETE /api/chat/messages/:id
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      await chatService.deleteMessage(id, req.user.id, req.user.role);
      res.json({ message: 'Message deleted' });
    } catch (error) {
      console.error('Delete message error:', error);
      if (error.message === 'Message not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete message' });
    }
  }
}

module.exports = new ChatController();

