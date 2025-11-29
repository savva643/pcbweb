const { param } = require('express-validator');

/**
 * Валидаторы для прогресса
 */
const progressValidators = {
  courseId: [
    param('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isUUID()
      .withMessage('Invalid course ID format')
  ],

  materialId: [
    param('materialId')
      .notEmpty()
      .withMessage('Material ID is required')
      .isUUID()
      .withMessage('Invalid material ID format')
  ]
};

module.exports = progressValidators;

