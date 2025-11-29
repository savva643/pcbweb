const express = require('express');
const teacherController = require('../controllers/teacherController');
const teacherValidators = require('../validators/teacherValidators');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/teacher/courses/{courseId}/stats:
 *   get:
 *     summary: Получить статистику курса (только для преподавателей)
 *     tags: [Teacher]
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
 *         description: Статистика курса
 */
router.get('/courses/:courseId/stats', authenticate, requireRole('TEACHER'), teacherValidators.courseId, teacherController.getCourseStats);

/**
 * @swagger
 * /api/teacher/courses/{courseId}/students:
 *   get:
 *     summary: Получить список студентов курса (только для преподавателей)
 *     tags: [Teacher]
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
 *         description: Список студентов
 */
router.get('/courses/:courseId/students', authenticate, requireRole('TEACHER'), teacherValidators.courseId, teacherController.getCourseStudents);

/**
 * @swagger
 * /api/teacher/courses/{courseId}/students/{studentId}:
 *   get:
 *     summary: Получить детали студента в курсе (только для преподавателей)
 *     tags: [Teacher]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Детали студента
 */
router.get('/courses/:courseId/students/:studentId', authenticate, requireRole('TEACHER'), teacherValidators.courseId, teacherValidators.studentId, teacherController.getStudentDetails);

module.exports = router;
