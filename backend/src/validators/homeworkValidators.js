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
    body('instructions').optional().trim(),
    body('requirements').optional().trim(),
    body('resources').optional().trim(),
    body('dueDate')
      .optional({ nullable: true, checkFalsy: true })
      .custom((value) => {
        if (value === null || value === undefined || value === '') {
          return true;
        }
        // Проверка ISO8601 формата
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        if (!iso8601Regex.test(value) && isNaN(Date.parse(value))) {
          throw new Error('Invalid date format');
        }
        return true;
      }),
    body('maxScore').optional().isInt({ min: 1 }).withMessage('Max score must be a positive integer'),
    body('difficulty').optional().isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Difficulty must be one of: LOW, MEDIUM, HIGH')
  ],
  updateHomework: [
    param('id').isUUID().withMessage('Invalid homework ID'),
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('description').optional().trim(),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('maxScore').optional().isInt({ min: 1 }).withMessage('Max score must be a positive integer')
  ],
  submitHomework: [
    param('id').isUUID().withMessage('Invalid homework ID')
  ],
  gradeHomework: [
    param('id').isUUID().withMessage('Invalid submission ID'),
    body('score').isInt({ min: 0 }).withMessage('Score must be a non-negative integer'),
    body('maxScore').isInt({ min: 1 }).withMessage('Max score must be a positive integer'),
    body('feedback').optional().trim()
  ],
  addComment: [
    param('id').isUUID().withMessage('Invalid submission ID'),
    body('content').trim().notEmpty().withMessage('Comment content is required')
  ],
  updateComment: [
    param('submissionId').isUUID().withMessage('Invalid submission ID'),
    param('commentId').isUUID().withMessage('Invalid comment ID'),
    body('content').trim().notEmpty().withMessage('Comment content is required')
  ]
};

module.exports = homeworkValidators;

