const { body, param } = require('express-validator');

const homeworkValidators = {
  homeworkId: [
    param('id').isUUID().withMessage('Invalid homework ID')
  ],
  groupId: [
    param('groupId').isUUID().withMessage('Invalid group ID')
  ],
  createHomework: [
    body('groupId').isUUID().withMessage('Invalid group ID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('maxScore').optional().isInt({ min: 1 }).withMessage('Max score must be a positive integer')
  ],
  updateHomework: [
    param('id').isUUID().withMessage('Invalid homework ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('maxScore').optional().isInt({ min: 1 }).withMessage('Max score must be a positive integer')
  ],
  submitHomework: [
    param('id').isUUID().withMessage('Invalid homework ID'),
    body('fileUrl').notEmpty().withMessage('File URL is required')
  ],
  gradeHomework: [
    param('id').isUUID().withMessage('Invalid submission ID'),
    body('score').isInt({ min: 0 }).withMessage('Score must be a non-negative integer'),
    body('maxScore').isInt({ min: 1 }).withMessage('Max score must be a positive integer'),
    body('feedback').optional().trim()
  ]
};

module.exports = homeworkValidators;

