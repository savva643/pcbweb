const express = require('express');
const submissionController = require('../controllers/submissionController');
const submissionValidators = require('../validators/submissionValidators');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router();

/**
 * @swagger
 * /api/submissions:
 *   get:
 *     summary: Получить отправки (студент - свои, преподаватель - по заданию)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assignmentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID задания (только для преподавателей)
 *     responses:
 *       200:
 *         description: Список отправок
 */
router.get('/', authenticate, submissionController.getAssignmentSubmissions);

/**
 * @swagger
 * /api/submissions:
 *   post:
 *     summary: Отправить задание (только для студентов)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - assignmentId
 *               - file
 *             properties:
 *               assignmentId:
 *                 type: string
 *                 format: uuid
 *               file:
 *                 type: string
 *                 format: binary
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Задание отправлено
 */
router.post('/', authenticate, requireRole('STUDENT'), upload.single('file'), submissionValidators.submit, submissionController.submitAssignment);

/**
 * @swagger
 * /api/submissions/{id}/grade:
 *   post:
 *     summary: Выставить оценку (только для преподавателей)
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - score
 *             properties:
 *               score:
 *                 type: integer
 *               maxScore:
 *                 type: integer
 *               feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Оценка выставлена
 */
router.post('/:id/grade', authenticate, requireRole('TEACHER'), submissionValidators.grade, submissionController.gradeSubmission);

/**
 * @swagger
 * /api/submissions/{id}/comments:
 *   post:
 *     summary: Добавить комментарий к отправке
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Комментарий добавлен
 */
router.post('/:id/comments', authenticate, submissionValidators.addComment, submissionController.addComment);

/**
 * @swagger
 * /api/submissions/{submissionId}/comments/{commentId}:
 *   put:
 *     summary: Обновить комментарий
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:submissionId/comments/:commentId', authenticate, submissionController.updateComment);

/**
 * @swagger
 * /api/submissions/{id}/versions:
 *   get:
 *     summary: Получить версии отправки
 *     tags: [Submissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Список версий
 */
router.get('/:id/versions', authenticate, submissionValidators.submissionId, submissionController.getSubmissionVersions);

module.exports = router;
