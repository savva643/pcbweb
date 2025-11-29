const { body, param } = require('express-validator');

/**
 * Валидаторы для курсов
 */
const courseValidators = {
  create: [
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
      .withMessage('isPrivate must be a boolean'),
    body('allowedEmails')
      .optional()
      .trim()
  ],

  update: [
    param('id')
      .notEmpty()
      .withMessage('Course ID is required')
      .isUUID()
      .withMessage('Invalid course ID format'),
    body('title')
      .optional()
      .trim()
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
      .withMessage('isPrivate must be a boolean'),
    body('allowedEmails')
      .optional()
      .trim()
  ],

  enrollStudent: [
    param('id')
      .notEmpty()
      .withMessage('Course ID is required')
      .isUUID()
      .withMessage('Invalid course ID format'),
    body('studentEmail')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],

  courseId: [
    param('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isUUID()
      .withMessage('Invalid course ID format')
  ]
};

module.exports = courseValidators;

