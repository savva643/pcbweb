const { body, param, query } = require('express-validator');

const gradeRecordValidators = {
  groupId: [
    param('groupId').isUUID().withMessage('Invalid group ID')
  ],
  studentId: [
    param('studentId').isUUID().withMessage('Invalid student ID')
  ],
  recordId: [
    param('recordId').isUUID().withMessage('Invalid record ID')
  ],
  gradeType: [
    param('gradeType').isIn(['COURSE', 'HOMEWORK', 'TEST']).withMessage('Invalid grade type')
  ],
  upsertGradeRecord: [
    body('studentId').isUUID().withMessage('Invalid student ID'),
    body('gradeDate').isISO8601().withMessage('Invalid date format'),
    body('gradeType').isIn(['COURSE', 'HOMEWORK', 'TEST']).withMessage('Invalid grade type'),
    body('relatedId').notEmpty().withMessage('Related ID is required'),
    body('maxScore').isInt({ min: 1 }).withMessage('Max score must be a positive integer'),
    body('score').optional().isInt({ min: 0 }).withMessage('Score must be a non-negative integer'),
    body('status').optional().isIn(['PRESENT', 'EXCUSED_ABSENCE', 'UNEXCUSED_ABSENCE']).withMessage('Invalid status')
  ],
  yearMonth: [
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Invalid month')
  ]
};

module.exports = gradeRecordValidators;

