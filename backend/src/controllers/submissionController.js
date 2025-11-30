const submissionService = require('../services/submissionService');
const { validationResult } = require('express-validator');

/**
 * Контроллер для работы с отправками заданий
 * @class SubmissionController
 */
class SubmissionController {
  /**
   * Отправить задание
   * @route POST /api/submissions
   */
  async submitAssignment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const submission = await submissionService.submitAssignment(
        req.body.assignmentId,
        req.user.id,
        `/uploads/${req.file.filename}`,
        req.body.comment
      );

      res.status(201).json(submission);
    } catch (error) {
      console.error('Submit assignment error:', error);
      if (error.message === 'Assignment not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to submit assignment' });
    }
  }

  /**
   * Выставить оценку
   * @route POST /api/submissions/:id/grade
   */
  async gradeSubmission(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const grade = await submissionService.gradeSubmission(id, req.user.id, req.body);

      res.json(grade);
    } catch (error) {
      console.error('Grade submission error:', error);
      if (error.message === 'Submission not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to grade submission' });
    }
  }

  /**
   * Получить отправки по заданию
   * @route GET /api/submissions?assignmentId=:id
   */
  async getAssignmentSubmissions(req, res) {
    try {
      if (req.user.role === 'STUDENT') {
        const submissionRepository = require('../repositories/submissionRepository');
        const prisma = require('../config/database');
        
        const submissions = await prisma.submission.findMany({
          where: { studentId: req.user.id },
          include: {
            assignment: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            },
            grade: true,
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: { submittedAt: 'desc' }
        });

        return res.json(submissions);
      } else if (req.user.role === 'TEACHER') {
        const { assignmentId } = req.query;
        if (!assignmentId) {
          return res.status(400).json({ error: 'assignmentId is required' });
        }

        const submissions = await submissionService.getAssignmentSubmissions(assignmentId, req.user.id);
        return res.json(submissions);
      }

      res.status(403).json({ error: 'Invalid role' });
    } catch (error) {
      console.error('Get submissions error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  }

  /**
   * Получить версии отправки
   * @route GET /api/submissions/:id/versions
   */
  async getSubmissionVersions(req, res) {
    try {
      const { id } = req.params;
      const versions = await submissionService.getSubmissionVersions(id, req.user.id, req.user.role);
      res.json(versions);
    } catch (error) {
      console.error('Get submission versions error:', error);
      if (error.message === 'Submission not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch versions' });
    }
  }

  /**
   * Добавить комментарий
   * @route POST /api/submissions/:id/comments
   */
  async addComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const comment = await submissionService.addComment(id, req.user.id, req.body.content);
      res.status(201).json(comment);
    } catch (error) {
      console.error('Add comment error:', error);
      if (error.message === 'Submission not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }

  /**
   * Обновить комментарий
   * @route PUT /api/submissions/:submissionId/comments/:commentId
   */
  async updateComment(req, res) {
    try {
      const { submissionId, commentId } = req.params;
      const comment = await submissionService.updateComment(submissionId, commentId, req.user.id, req.body.content);
      res.json(comment);
    } catch (error) {
      console.error('Update comment error:', error);
      if (error.message === 'Comment not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update comment' });
    }
  }
}

module.exports = new SubmissionController();

