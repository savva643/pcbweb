const teacherService = require('../services/teacherService');
const { validationResult } = require('express-validator');

/**
 * Контроллер для работы преподавателя
 * @class TeacherController
 */
class TeacherController {
  /**
   * Получить статистику курса
   * @route GET /api/teacher/courses/:courseId/stats
   */
  async getCourseStats(req, res) {
    try {
      const { courseId } = req.params;
      const stats = await teacherService.getCourseStats(courseId, req.user.id);
      res.json(stats);
    } catch (error) {
      console.error('Get course stats error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }

  /**
   * Получить детали студента
   * @route GET /api/teacher/courses/:courseId/students/:studentId
   */
  async getStudentDetails(req, res) {
    try {
      const { courseId, studentId } = req.params;
      const details = await teacherService.getStudentDetails(courseId, studentId, req.user.id);
      res.json(details);
    } catch (error) {
      console.error('Get student details error:', error);
      if (error.message === 'Access denied' || error.message === 'Student not found') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch student details' });
    }
  }
}

module.exports = new TeacherController();

