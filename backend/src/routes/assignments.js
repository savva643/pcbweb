const express = require('express');
const assignmentController = require('../controllers/assignmentController');
const assignmentValidators = require('../validators/assignmentValidators');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/assignments/course/{courseId}:
 *   get:
 *     summary: Получить задания курса
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Список заданий
 */
router.get('/course/:courseId', authenticate, assignmentController.getCourseAssignments);

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     summary: Получить задание по ID
 *     tags: [Assignments]
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
 *         description: Задание
 */
router.get('/:id', authenticate, assignmentController.getAssignmentById);

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Создать задание (только для преподавателей)
 *     tags: [Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - title
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               maxScore:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Задание создано
 */
router.post('/', authenticate, requireRole('TEACHER'), assignmentValidators.create, assignmentController.createAssignment);

module.exports = router;
