const { param } = require('express-validator');

/**
 * Валидаторы для преподавателя
 */
const teacherValidators = {
  courseId: [
    param('courseId')
      .notEmpty()
      .withMessage('Course ID is required')
      .isUUID()
      .withMessage('Invalid course ID format')
  ],

  studentId: [
    param('studentId')
      .notEmpty()
      .withMessage('Student ID is required')
      .isUUID()
      .withMessage('Invalid student ID format')
  ]
};

module.exports = teacherValidators;

