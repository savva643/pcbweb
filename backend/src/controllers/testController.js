const testService = require('../services/testService');
const { validationResult } = require('express-validator');

/**
 * Контроллер для работы с тестами
 * @class TestController
 */
class TestController {
  /**
   * Получить тесты курса
   * @route GET /api/tests/course/:courseId
   */
  async getCourseTests(req, res) {
    try {
      const { courseId } = req.params;
      const tests = await testService.getCourseTests(courseId, req.user.id, req.user.role);
      res.json(tests);
    } catch (error) {
      console.error('Get tests error:', error);
      if (error.message === 'Course not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch tests' });
    }
  }

  /**
   * Получить тест по ID
   * @route GET /api/tests/:id
   */
  async getTestById(req, res) {
    try {
      const { id } = req.params;
      const test = await testService.getTestById(id, req.user.id, req.user.role);
      res.json(test);
    } catch (error) {
      console.error('Get test error:', error);
      if (error.message === 'Test not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch test' });
    }
  }

  /**
   * Создать тест
   * @route POST /api/tests
   */
  async createTest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const test = await testService.createTest(req.body.courseId, req.user.id, req.body);
      res.status(201).json(test);
    } catch (error) {
      console.error('Create test error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create test' });
    }
  }

  /**
   * Добавить вопрос к тесту
   * @route POST /api/tests/:id/questions
   */
  async addQuestion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const question = await testService.addQuestion(id, req.user.id, req.body);
      res.status(201).json(question);
    } catch (error) {
      console.error('Add question error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to add question' });
    }
  }

  /**
   * Начать попытку теста
   * @route POST /api/tests/:id/start
   */
  async startAttempt(req, res) {
    try {
      const { id } = req.params;
      const attempt = await testService.startAttempt(id, req.user.id);
      res.status(201).json(attempt);
    } catch (error) {
      console.error('Start test error:', error);
      if (error.message === 'Test not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to start test' });
    }
  }

  /**
   * Отправить ответы на тест
   * @route POST /api/tests/:id/submit
   */
  async submitTest(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { attemptId, answers } = req.body;
      const result = await testService.submitTest(id, attemptId, req.user.id, answers);
      res.json(result);
    } catch (error) {
      console.error('Submit test error:', error);
      if (error.message === 'Access denied' || error.message === 'Test already completed') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to submit test' });
    }
  }

  /**
   * Получить результаты попытки
   * @route GET /api/tests/:id/attempts/:attemptId
   */
  async getAttemptResults(req, res) {
    try {
      const { id, attemptId } = req.params;
      const testRepository = require('../repositories/testRepository');
      const attempt = await testRepository.findAttemptById(attemptId);

      if (!attempt) {
        return res.status(404).json({ error: 'Attempt not found' });
      }

      if (req.user.role === 'STUDENT' && attempt.studentId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (req.user.role === 'TEACHER' && attempt.test.course.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(attempt);
    } catch (error) {
      console.error('Get attempt error:', error);
      res.status(500).json({ error: 'Failed to fetch attempt' });
    }
  }
}

module.exports = new TestController();

