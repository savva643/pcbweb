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
   * Получить или создать личный чат
   * @route POST /api/chat/course/:courseId/personal-chat
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async createPersonalChat(req, res) {
    try {
      const { courseId } = req.params;
      const { participantId } = req.body;

      const topic = await chatService.getOrCreatePersonalChat(
        courseId, 
        req.user.id, 
        req.user.role,
        participantId
      );
      
      res.status(201).json(topic);
    } catch (error) {
      console.error('Create personal chat error:', error);
      if (error.message === 'Access denied' || 
          error.message === 'Student can only create personal chat with course teacher' ||
          error.message === 'Student not enrolled in this course' ||
          error.message === 'Teacher must specify participantId') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create personal chat' });
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
      const { title, description, isPrivate, participantId } = req.body;

      const topic = await chatService.createTopic(courseId, req.user.id, req.user.role, {
        title,
        description,
        isPrivate,
        participantId
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

  /**
   * Получить темы группы
   * @route GET /api/chat/group/:groupId/topics
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async getGroupTopics(req, res) {
    try {
      const { groupId } = req.params;
      const topics = await chatService.getGroupTopics(groupId, req.user.id, req.user.role);
      res.json(topics);
    } catch (error) {
      console.error('Get group topics error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch topics' });
    }
  }

  /**
   * Создать тему для группы
   * @route POST /api/chat/group/:groupId/topics
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async createGroupTopic(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { groupId } = req.params;
      const { title, description } = req.body;

      const topic = await chatService.createGroupTopic(groupId, req.user.id, req.user.role, {
        title,
        description
      });

      res.status(201).json(topic);
    } catch (error) {
      console.error('Create group topic error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create topic' });
    }
  }
}

module.exports = new ChatController();

