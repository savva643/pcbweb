const homeworkService = require('../services/homeworkService');
const { validationResult } = require('express-validator');

class HomeworkController {
  /**
   * Получить домашние задания группы
   * @route GET /api/homeworks/group/:groupId
   */
  async getGroupHomeworks(req, res) {
    try {
      const { groupId } = req.params;
      const homeworks = await homeworkService.getGroupHomeworks(groupId, req.user.id, req.user.role);
      res.json(homeworks);
    } catch (error) {
      console.error('Get group homeworks error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to get homeworks' });
    }
  }

  /**
   * Получить детали домашнего задания
   * @route GET /api/homeworks/:id
   */
  async getHomeworkDetails(req, res) {
    try {
      const { id } = req.params;
      const homework = await homeworkService.getHomeworkDetails(id, req.user.id, req.user.role);
      res.json(homework);
    } catch (error) {
      console.error('Get homework details error:', error);
      if (error.message === 'Access denied' || error.message === 'Homework not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to get homework details' });
    }
  }

  /**
   * Создать домашнее задание
   * @route POST /api/homeworks
   */
  async createHomework(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { groupId, title, description, dueDate, maxScore } = req.body;
      const homework = await homeworkService.createHomework(groupId, req.user.id, {
        title,
        description,
        dueDate: dueDate || null,
        maxScore: maxScore || 100
      });
      res.status(201).json(homework);
    } catch (error) {
      console.error('Create homework error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create homework' });
    }
  }

  /**
   * Обновить домашнее задание
   * @route PUT /api/homeworks/:id
   */
  async updateHomework(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, description, dueDate, maxScore } = req.body;
      const homework = await homeworkService.updateHomework(id, req.user.id, {
        title,
        description,
        dueDate: dueDate || null,
        maxScore
      });
      res.json(homework);
    } catch (error) {
      console.error('Update homework error:', error);
      if (error.message === 'Access denied' || error.message === 'Homework not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update homework' });
    }
  }

  /**
   * Удалить домашнее задание
   * @route DELETE /api/homeworks/:id
   */
  async deleteHomework(req, res) {
    try {
      const { id } = req.params;
      await homeworkService.deleteHomework(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete homework error:', error);
      if (error.message === 'Access denied' || error.message === 'Homework not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete homework' });
    }
  }

  /**
   * Отправить домашнее задание
   * @route POST /api/homeworks/:id/submit
   */
  async submitHomework(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { fileUrl } = req.body;
      const submission = await homeworkService.submitHomework(id, req.user.id, fileUrl);
      res.status(201).json(submission);
    } catch (error) {
      console.error('Submit homework error:', error);
      if (error.message === 'Access denied' || error.message === 'Homework not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to submit homework' });
    }
  }

  /**
   * Оценить домашнее задание
   * @route POST /api/homeworks/submissions/:id/grade
   */
  async gradeHomework(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { score, maxScore, feedback } = req.body;
      const submission = await homeworkService.gradeHomework(id, req.user.id, {
        score,
        maxScore,
        feedback
      });
      res.json(submission);
    } catch (error) {
      console.error('Grade homework error:', error);
      if (error.message === 'Access denied' || error.message === 'Submission not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to grade homework' });
    }
  }

  /**
   * Закрыть/открыть домашнее задание
   * @route PUT /api/homeworks/:id/active
   */
  async setHomeworkActive(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { isActive } = req.body;
      const homework = await homeworkService.setHomeworkActive(id, req.user.id, isActive);
      res.json(homework);
    } catch (error) {
      console.error('Set homework active error:', error);
      if (error.message === 'Access denied' || error.message === 'Homework not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update homework' });
    }
  }
}

module.exports = new HomeworkController();

