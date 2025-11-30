const express = require('express');
const { authenticate } = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const chatValidators = require('../validators/chatValidators');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: API для работы с чатом курсов
 */

/**
 * @swagger
 * /api/chat/course/{courseId}/topics:
 *   get:
 *     summary: Получить темы обсуждения курса
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *     responses:
 *       200:
 *         description: Список тем
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatTopic'
 *       403:
 *         description: Доступ запрещен
 */
router.get('/course/:courseId/topics', authenticate, chatController.getCourseTopics.bind(chatController));

/**
 * @swagger
 * /api/chat/course/{courseId}/personal-chat:
 *   post:
 *     summary: Создать или получить личный чат
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participantId:
 *                 type: string
 *                 description: ID участника (для преподавателя - ID студента, для студента - не требуется)
 *     responses:
 *       201:
 *         description: Личный чат создан или найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatTopic'
 *       403:
 *         description: Доступ запрещен
 */
router.post('/course/:courseId/personal-chat', authenticate, chatController.createPersonalChat.bind(chatController));

/**
 * @swagger
 * /api/chat/course/{courseId}/topics:
 *   post:
 *     summary: Создать новую тему обсуждения
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
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
 *                 description: Название темы
 *               description:
 *                 type: string
 *                 description: Описание темы
 *               isPrivate:
 *                 type: boolean
 *                 description: Приватная тема (только для преподавателей)
 *     responses:
 *       201:
 *         description: Тема создана
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatTopic'
 *       400:
 *         description: Ошибка валидации
 *       403:
 *         description: Доступ запрещен
 */
router.post('/course/:courseId/topics', authenticate, chatValidators.createCourseTopic, chatController.createTopic.bind(chatController));

/**
 * @swagger
 * /api/chat/topics/{topicId}/messages:
 *   get:
 *     summary: Получить сообщения темы
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID темы
 *     responses:
 *       200:
 *         description: Список сообщений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ChatMessage'
 *       403:
 *         description: Доступ запрещен
 */
router.get('/topics/:topicId/messages', authenticate, chatController.getTopicMessages.bind(chatController));

/**
 * @swagger
 * /api/chat/topics/{topicId}/messages:
 *   post:
 *     summary: Отправить сообщение в тему
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID темы
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
 *                 description: Содержимое сообщения
 *     responses:
 *       201:
 *         description: Сообщение отправлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         description: Ошибка валидации
 *       403:
 *         description: Доступ запрещен
 */
router.post('/topics/:topicId/messages', authenticate, chatValidators.sendMessage, chatController.sendMessage.bind(chatController));

/**
 * @swagger
 * /api/chat/messages/{id}:
 *   put:
 *     summary: Обновить сообщение
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID сообщения
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
 *                 description: Новое содержимое сообщения
 *     responses:
 *       200:
 *         description: Сообщение обновлено
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatMessage'
 *       400:
 *         description: Ошибка валидации
 *       403:
 *         description: Доступ запрещен
 */
router.put('/messages/:id', authenticate, chatValidators.updateMessage, chatController.updateMessage.bind(chatController));

/**
 * @swagger
 * /api/chat/messages/{id}:
 *   delete:
 *     summary: Удалить сообщение
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID сообщения
 *     responses:
 *       200:
 *         description: Сообщение удалено
 *       403:
 *         description: Доступ запрещен
 */
router.delete('/messages/:id', authenticate, chatController.deleteMessage.bind(chatController));

/**
 * @swagger
 * /api/chat/group/{groupId}/topics:
 *   get:
 *     summary: Получить темы обсуждения группы
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 */
router.get('/group/:groupId/topics', authenticate, chatController.getGroupTopics.bind(chatController));

/**
 * @swagger
 * /api/chat/group/{groupId}/topics:
 *   post:
 *     summary: Создать новую тему обсуждения для группы
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 */
router.post('/group/:groupId/topics', authenticate, chatValidators.createGroupTopic, chatController.createGroupTopic.bind(chatController));

module.exports = router;

