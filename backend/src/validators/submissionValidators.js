const { body, param } = require('express-validator');

/**
 * Валидаторы для отправок заданий
 */
const submissionValidators = {
  submit: [
    body('assignmentId')
      .notEmpty()
      .withMessage('Assignment ID is required')
      .isUUID()
      .withMessage('Invalid assignment ID format'),
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Comment must not exceed 500 characters')
  ],

  grade: [
    param('id')
      .notEmpty()
      .withMessage('Submission ID is required')
      .isUUID()
      .withMessage('Invalid submission ID format'),
    body('score')
      .isInt({ min: 0 })
      .withMessage('Score must be a non-negative integer'),
    body('maxScore')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max score must be a positive integer'),
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Feedback must not exceed 2000 characters')
  ],

  addComment: [
    param('id')
      .notEmpty()
      .withMessage('Submission ID is required')
      .isUUID()
      .withMessage('Invalid submission ID format'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Content must be between 1 and 1000 characters')
  ],

  submissionId: [
    param('id')
      .notEmpty()
      .withMessage('Submission ID is required')
      .isUUID()
      .withMessage('Invalid submission ID format')
  ],

  version: [
    param('version')
      .isInt({ min: 1 })
      .withMessage('Version must be a positive integer')
  ]
};

module.exports = submissionValidators;

