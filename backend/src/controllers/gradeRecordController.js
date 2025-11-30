const gradeRecordService = require('../services/gradeRecordService');
const { validationResult } = require('express-validator');

class GradeRecordController {
  /**
   * Получить успеваемость студента в группе
   * @route GET /api/groups/:groupId/students/:studentId/grades
   */
  async getStudentGrades(req, res) {
    try {
      const { groupId, studentId } = req.params;
      const { year, month } = req.query;
      
      const currentYear = year ? parseInt(year) : new Date().getFullYear();
      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

      const grades = await gradeRecordService.getStudentGrades(
        studentId,
        groupId,
        currentYear,
        currentMonth,
        req.user.id,
        req.user.role
      );
      res.json(grades);
    } catch (error) {
      console.error('Get student grades error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to get student grades' });
    }
  }

  /**
   * Получить успеваемость всех студентов группы
   * @route GET /api/groups/:groupId/grades
   */
  async getGroupGrades(req, res) {
    try {
      const { groupId } = req.params;
      const { year, month } = req.query;
      
      const currentYear = year ? parseInt(year) : new Date().getFullYear();
      const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

      const grades = await gradeRecordService.getGroupGrades(
        groupId,
        currentYear,
        currentMonth,
        req.user.id
      );
      res.json(grades);
    } catch (error) {
      console.error('Get group grades error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to get group grades' });
    }
  }

  /**
   * Получить успеваемость по курсу/ДЗ/тесту
   * @route GET /api/groups/:groupId/grades/:gradeType/:relatedId
   */
  async getGradesByRelated(req, res) {
    try {
      const { groupId, gradeType, relatedId } = req.params;
      const grades = await gradeRecordService.getGradesByRelated(
        groupId,
        gradeType,
        relatedId,
        req.user.id
      );
      res.json(grades);
    } catch (error) {
      console.error('Get grades by related error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to get grades' });
    }
  }

  /**
   * Создать или обновить запись успеваемости
   * @route POST /api/groups/:groupId/grades
   */
  async upsertGradeRecord(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { groupId } = req.params;
      const record = await gradeRecordService.upsertGradeRecord(
        groupId,
        req.body,
        req.user.id
      );
      res.json(record);
    } catch (error) {
      console.error('Upsert grade record error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to save grade record' });
    }
  }

  /**
   * Удалить запись успеваемости
   * @route DELETE /api/groups/:groupId/grades/:recordId
   */
  async deleteGradeRecord(req, res) {
    try {
      const { recordId } = req.params;
      await gradeRecordService.deleteGradeRecord(recordId, req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete grade record error:', error);
      if (error.message === 'Access denied' || error.message === 'Record not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete grade record' });
    }
  }

  /**
   * Получить статистику студента в группе
   * @route GET /api/groups/:groupId/students/:studentId/stats
   */
  async getStudentStats(req, res) {
    try {
      const { groupId, studentId } = req.params;
      const stats = await gradeRecordService.getStudentStats(
        studentId,
        groupId,
        req.user.id,
        req.user.role
      );
      res.json(stats);
    } catch (error) {
      console.error('Get student stats error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to get student stats' });
    }
  }
}

module.exports = new GradeRecordController();

