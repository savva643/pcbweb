const { body, param } = require('express-validator');

/**
 * Валидаторы для заданий
 */
const assignmentValidators = {
  create: [
    body('courseId')
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
      .isLength({ max: 2000 })
      .withMessage('Description must not exceed 2000 characters'),
    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('maxScore')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max score must be a positive integer')
  ],

  assignmentId: [
    param('id')
      .notEmpty()
      .withMessage('Assignment ID is required')
      .isUUID()
      .withMessage('Invalid assignment ID format')
  ]
};

module.exports = assignmentValidators;

