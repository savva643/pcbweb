const express = require('express');
const homeworkController = require('../controllers/homeworkController');
const homeworkValidators = require('../validators/homeworkValidators');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/homeworks/group/:groupId:
 *   get:
 *     summary: Получить домашние задания группы
 *     tags: [Homeworks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/group/:groupId', authenticate, homeworkValidators.groupId, homeworkController.getGroupHomeworks);

/**
 * @swagger
 * /api/homeworks/:id:
 *   get:
 *     summary: Получить детали домашнего задания
 *     tags: [Homeworks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, homeworkValidators.homeworkId, homeworkController.getHomeworkDetails);

/**
 * @swagger
 * /api/homeworks:
 *   post:
 *     summary: Создать домашнее задание
 *     tags: [Homeworks]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticate, requireRole('TEACHER'), homeworkValidators.createHomework, homeworkController.createHomework);

/**
 * @swagger
 * /api/homeworks/:id:
 *   put:
 *     summary: Обновить домашнее задание
 *     tags: [Homeworks]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, requireRole('TEACHER'), homeworkValidators.updateHomework, homeworkController.updateHomework);

/**
 * @swagger
 * /api/homeworks/:id:
 *   delete:
 *     summary: Удалить домашнее задание
 *     tags: [Homeworks]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, requireRole('TEACHER'), homeworkValidators.homeworkId, homeworkController.deleteHomework);

/**
 * @swagger
 * /api/homeworks/:id/submit:
 *   post:
 *     summary: Отправить домашнее задание
 *     tags: [Homeworks]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/submit', authenticate, requireRole('STUDENT'), homeworkValidators.submitHomework, homeworkController.submitHomework);

/**
 * @swagger
 * /api/homeworks/submissions/:id/grade:
 *   post:
 *     summary: Оценить домашнее задание
 *     tags: [Homeworks]
 *     security:
 *       - bearerAuth: []
 */
router.post('/submissions/:id/grade', authenticate, requireRole('TEACHER'), homeworkValidators.gradeHomework, homeworkController.gradeHomework);

/**
 * @swagger
 * /api/homeworks/{id}/active:
 *   put:
 *     summary: Закрыть/открыть домашнее задание
 *     tags: [Homeworks]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/active', authenticate, requireRole('TEACHER'), homeworkValidators.homeworkId, homeworkController.setHomeworkActive);

module.exports = router;

