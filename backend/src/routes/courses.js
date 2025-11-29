const express = require('express');
const courseController = require('../controllers/courseController');
const courseValidators = require('../validators/courseValidators');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/courses/available:
 *   get:
 *     summary: Получить доступные курсы (только для студентов)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список доступных курсов
 */
router.get('/available', authenticate, requireRole('STUDENT'), courseController.getAvailableCourses);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Получить курсы пользователя
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список курсов
 */
router.get('/', authenticate, courseController.getCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Получить курс по ID
 *     tags: [Courses]
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
 *         description: Курс
 */
router.get('/:id', authenticate, courseController.getCourseById);

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Создать курс (только для преподавателей)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *               allowedEmails:
 *                 type: string
 *     responses:
 *       201:
 *         description: Курс создан
 */
router.post('/', authenticate, requireRole('TEACHER'), courseValidators.create, courseController.createCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Обновить курс (только для преподавателей)
 *     tags: [Courses]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               isPrivate:
 *                 type: boolean
 *               allowedEmails:
 *                 type: string
 *     responses:
 *       200:
 *         description: Курс обновлен
 */
router.put('/:id', authenticate, requireRole('TEACHER'), courseValidators.update, courseController.updateCourse);

/**
 * @swagger
 * /api/courses/{id}/enroll:
 *   post:
 *     summary: Записаться на курс (только для студентов)
 *     tags: [Courses]
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
 *       201:
 *         description: Запись на курс успешна
 */
router.post('/:id/enroll', authenticate, requireRole('STUDENT'), courseController.enrollInCourse);

/**
 * @swagger
 * /api/courses/{id}/enroll-student:
 *   post:
 *     summary: Добавить студента на курс (только для преподавателей)
 *     tags: [Courses]
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
 *               - studentEmail
 *             properties:
 *               studentEmail:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Студент добавлен на курс
 */
router.post('/:id/enroll-student', authenticate, requireRole('TEACHER'), courseValidators.enrollStudent, courseController.enrollStudent);

module.exports = router;
