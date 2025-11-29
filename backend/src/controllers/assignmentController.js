const assignmentService = require('../services/assignmentService');
const { validationResult } = require('express-validator');

/**
 * Контроллер для работы с заданиями
 * @class AssignmentController
 */
class AssignmentController {
  /**
   * Получить задания курса
   * @route GET /api/assignments/course/:courseId
   */
  async getCourseAssignments(req, res) {
    try {
      const { courseId } = req.params;
      const assignments = await assignmentService.getCourseAssignments(courseId, req.user.id, req.user.role);
      res.json(assignments);
    } catch (error) {
      console.error('Get assignments error:', error);
      if (error.message === 'Course not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  }

  /**
   * Получить задание по ID
   * @route GET /api/assignments/:id
   */
  async getAssignmentById(req, res) {
    try {
      const { id } = req.params;
      const assignment = await assignmentService.getAssignmentById(id, req.user.id, req.user.role);
      res.json(assignment);
    } catch (error) {
      console.error('Get assignment error:', error);
      if (error.message === 'Assignment not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch assignment' });
    }
  }

  /**
   * Создать задание
   * @route POST /api/assignments
   */
  async createAssignment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const assignment = await assignmentService.createAssignment(
        req.body.courseId,
        req.user.id,
        req.body
      );

      res.status(201).json(assignment);
    } catch (error) {
      console.error('Create assignment error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create assignment' });
    }
  }
}

module.exports = new AssignmentController();

