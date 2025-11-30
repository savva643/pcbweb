const { body, param } = require('express-validator');

/**
 * Валидаторы для чата
 */
const chatValidators = {
  /**
   * Валидация создания темы
   */
  createTopic: [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('isPrivate must be a boolean')
  ],
  
  /**
   * Валидация создания темы для курса
   */
  createCourseTopic: [
    param('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isUUID()
      .withMessage('Invalid course ID format'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('isPrivate')
      .optional()
      .isBoolean()
      .withMessage('isPrivate must be a boolean')
  ],
  
  /**
   * Валидация создания темы для группы
   */
  createGroupTopic: [
    param('groupId')
      .notEmpty()
      .withMessage('Group ID is required')
      .isUUID()
      .withMessage('Invalid group ID format'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 1, max: 200 })
      .withMessage('Title must be between 1 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters')
  ],

  /**
   * Валидация отправки сообщения
   */
  sendMessage: [
    param('topicId')
      .notEmpty()
      .withMessage('Topic ID is required')
      .isUUID()
      .withMessage('Invalid topic ID format'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 1, max: 5000 })
      .withMessage('Content must be between 1 and 5000 characters')
  ],

  /**
   * Валидация обновления сообщения
   */
  updateMessage: [
    param('id')
      .notEmpty()
      .withMessage('Message ID is required')
      .isUUID()
      .withMessage('Invalid message ID format'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 1, max: 5000 })
      .withMessage('Content must be between 1 and 5000 characters')
  ],

  /**
   * Валидация параметров пути
   */
  courseId: [
    param('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isUUID()
      .withMessage('Invalid course ID format')
  ],

  topicId: [
    param('topicId')
      .notEmpty()
      .withMessage('Topic ID is required')
      .isUUID()
      .withMessage('Invalid topic ID format')
  ],

  messageId: [
    param('id')
      .notEmpty()
      .withMessage('Message ID is required')
      .isUUID()
      .withMessage('Invalid message ID format')
  ]
};

module.exports = chatValidators;

