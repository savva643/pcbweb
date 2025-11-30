const express = require('express');
const testController = require('../controllers/testController');
const testValidators = require('../validators/testValidators');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/tests/course/{courseId}:
 *   get:
 *     summary: Получить тесты курса
 *     tags: [Tests]
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
 *         description: Список тестов
 */
router.get('/course/:courseId', authenticate, testController.getCourseTests);

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Получить тест по ID
 *     tags: [Tests]
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
 *         description: Тест
 */
router.get('/:id', authenticate, testController.getTestById);

/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Создать тест (только для преподавателей)
 *     tags: [Tests]
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
 *               maxScore:
 *                 type: integer
 *               timeLimit:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Тест создан
 */
router.post('/', authenticate, requireRole('TEACHER'), testValidators.create, testController.createTest);

/**
 * @swagger
 * /api/tests/{id}/questions:
 *   post:
 *     summary: Добавить вопрос к тесту (только для преподавателей)
 *     tags: [Tests]
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
 *               - type
 *               - question
 *               - answers
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [multiple_choice, matching, true_false]
 *               question:
 *                 type: string
 *               points:
 *                 type: integer
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *                     order:
 *                       type: integer
 *                     matchKey:
 *                       type: string
 *     responses:
 *       201:
 *         description: Вопрос добавлен
 */
router.post('/:id/questions', authenticate, requireRole('TEACHER'), testValidators.addQuestion, testController.addQuestion);

/**
 * @swagger
 * /api/tests/{id}/start:
 *   post:
 *     summary: Начать попытку теста (только для студентов)
 *     tags: [Tests]
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
 *         description: Попытка начата
 */
router.post('/:id/start', authenticate, requireRole('STUDENT'), testValidators.testId, testController.startAttempt);

/**
 * @swagger
 * /api/tests/{id}/submit:
 *   post:
 *     summary: Отправить ответы на тест (только для студентов)
 *     tags: [Tests]
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
 *               - attemptId
 *               - answers
 *             properties:
 *               attemptId:
 *                 type: string
 *                 format: uuid
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       format: uuid
 *                     answerIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uuid
 *     responses:
 *       200:
 *         description: Тест отправлен
 */
router.post('/:id/submit', authenticate, requireRole('STUDENT'), testValidators.submit, testController.submitTest);

/**
 * @swagger
 * /api/tests/{id}/attempts/{attemptId}:
 *   get:
 *     summary: Получить результаты попытки
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Результаты попытки
 */
/**
 * @swagger
 * /api/tests/{id}/attempts/all:
 *   get:
 *     summary: Получить все попытки по тесту (для преподавателя)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/attempts/all', authenticate, requireRole('TEACHER'), testValidators.testId, testController.getTestAttempts);

router.get('/:id/attempts/:attemptId', authenticate, testValidators.testId, testValidators.attemptId, testController.getAttemptResults);

/**
 * @swagger
 * /api/tests/{id}/active:
 *   put:
 *     summary: Закрыть/открыть тест
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id/active', authenticate, requireRole('TEACHER'), testValidators.testId, testController.setTestActive);

/**
 * @swagger
 * /api/tests/{id}/attempts:
 *   get:
 *     summary: Получить попытки студента по тесту
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/attempts', authenticate, requireRole('STUDENT'), testValidators.testId, testController.getStudentAttempts);

/**
 * @swagger
 * /api/tests/attempts/{attemptId}/grade:
 *   post:
 *     summary: Оценить попытку теста (для преподавателя)
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 */
router.post('/attempts/:attemptId/grade', authenticate, requireRole('TEACHER'), testValidators.attemptId, testController.gradeAttempt);

/**
 * @swagger
 * /api/tests/attempts/{attemptId}/comments:
 *   post:
 *     summary: Добавить комментарий к попытке теста
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 */
router.post('/attempts/:attemptId/comments', authenticate, testValidators.attemptId, testController.addComment);

/**
 * @swagger
 * /api/tests/attempts/{attemptId}/comments/{commentId}:
 *   put:
 *     summary: Обновить комментарий к попытке теста
 *     tags: [Tests]
 *     security:
 *       - bearerAuth: []
 */
router.put('/attempts/:attemptId/comments/:commentId', authenticate, testValidators.attemptId, testValidators.commentId, testController.updateComment);

module.exports = router;
