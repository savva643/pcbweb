const groupService = require('../services/groupService');
const { validationResult } = require('express-validator');

class GroupController {
  /**
   * Получить все группы преподавателя
   * @route GET /api/groups
   */
  async getTeacherGroups(req, res) {
    try {
      const groups = await groupService.getTeacherGroups(req.user.id);
      res.json(groups);
    } catch (error) {
      console.error('Get teacher groups error:', error);
      res.status(500).json({ error: 'Failed to get groups' });
    }
  }

  /**
   * Получить все группы студента
   * @route GET /api/groups/student
   */
  async getStudentGroups(req, res) {
    try {
      const groups = await groupService.getStudentGroups(req.user.id);
      res.json(groups);
    } catch (error) {
      console.error('Get student groups error:', error);
      res.status(500).json({ error: 'Failed to get groups' });
    }
  }

  /**
   * Получить детали группы
   * @route GET /api/groups/:id
   */
  async getGroupDetails(req, res) {
    try {
      const { id } = req.params;
      const group = await groupService.getGroupDetails(id, req.user.id, req.user.role);
      res.json(group);
    } catch (error) {
      console.error('Get group details error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to get group details' });
    }
  }

  /**
   * Создать группу
   * @route POST /api/groups
   */
  async createGroup(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description } = req.body;
      const group = await groupService.createGroup(req.user.id, { name, description });
      res.status(201).json(group);
    } catch (error) {
      console.error('Create group error:', error);
      res.status(500).json({ error: 'Failed to create group' });
    }
  }

  /**
   * Обновить группу
   * @route PUT /api/groups/:id
   */
  async updateGroup(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, description } = req.body;
      const group = await groupService.updateGroup(id, req.user.id, { name, description });
      res.json(group);
    } catch (error) {
      console.error('Update group error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update group' });
    }
  }

  /**
   * Удалить группу
   * @route DELETE /api/groups/:id
   */
  async deleteGroup(req, res) {
    try {
      const { id } = req.params;
      await groupService.deleteGroup(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      console.error('Delete group error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to delete group' });
    }
  }

  /**
   * Добавить студента в группу
   * @route POST /api/groups/:id/students
   */
  async addStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { studentEmail } = req.body;
      const group = await groupService.addStudent(id, req.user.id, studentEmail);
      res.json(group);
    } catch (error) {
      console.error('Add student error:', error);
      if (error.message === 'Access denied' || error.message === 'Student not found' || error.message === 'Student already in group') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to add student' });
    }
  }

  /**
   * Удалить студента из группы
   * @route DELETE /api/groups/:id/students/:studentId
   */
  async removeStudent(req, res) {
    try {
      const { id, studentId } = req.params;
      const group = await groupService.removeStudent(id, req.user.id, studentId);
      res.json(group);
    } catch (error) {
      console.error('Remove student error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to remove student' });
    }
  }

  /**
   * Назначить курс группе
   * @route POST /api/groups/:id/courses
   */
  async assignCourse(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { courseId } = req.body;
      const group = await groupService.assignCourse(id, req.user.id, courseId);
      res.json(group);
    } catch (error) {
      console.error('Assign course error:', error);
      if (error.message === 'Access denied' || error.message === 'Course not found' || error.message === 'Course already assigned to group') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to assign course' });
    }
  }

  /**
   * Удалить назначение курса группе
   * @route DELETE /api/groups/:id/courses/:courseId
   */
  async unassignCourse(req, res) {
    try {
      const { id, courseId } = req.params;
      const group = await groupService.unassignCourse(id, req.user.id, courseId);
      res.json(group);
    } catch (error) {
      console.error('Unassign course error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to unassign course' });
    }
  }

  /**
   * Получить статистику группы
   * @route GET /api/groups/:id/stats
   */
  async getGroupStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await groupService.getGroupStats(id, req.user.id);
      res.json(stats);
    } catch (error) {
      console.error('Get group stats error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to get group stats' });
    }
  }
}

module.exports = new GroupController();

