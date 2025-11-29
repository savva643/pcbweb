const { body, param } = require('express-validator');

/**
 * Валидаторы для материалов
 */
const materialValidators = {
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
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('type')
      .isIn(['video', 'text', 'scorm', 'file'])
      .withMessage('Type must be one of: video, text, scorm, file'),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Order must be a non-negative integer')
  ],

  update: [
    param('id')
      .notEmpty()
      .withMessage('Material ID is required')
      .isUUID()
      .withMessage('Invalid material ID format'),
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
    body('type')
      .optional()
      .isIn(['video', 'text', 'scorm', 'file'])
      .withMessage('Type must be one of: video, text, scorm, file'),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Order must be a non-negative integer')
  ],

  materialId: [
    param('id')
      .notEmpty()
      .withMessage('Material ID is required')
      .isUUID()
      .withMessage('Invalid material ID format')
  ],

  version: [
    param('version')
      .isInt({ min: 1 })
      .withMessage('Version must be a positive integer')
  ]
};

module.exports = materialValidators;

