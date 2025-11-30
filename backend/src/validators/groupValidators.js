const { body, param } = require('express-validator');

const groupValidators = {
  groupId: [
    param('id').isUUID().withMessage('Invalid group ID')
  ],
  createGroup: [
    body('name').trim().notEmpty().withMessage('Group name is required'),
    body('description').optional().trim()
  ],
  updateGroup: [
    param('id').isUUID().withMessage('Invalid group ID'),
    body('name').optional().trim().notEmpty().withMessage('Group name cannot be empty'),
    body('description').optional().trim()
  ],
  addStudent: [
    param('id').isUUID().withMessage('Invalid group ID'),
    body('studentEmail').isEmail().withMessage('Invalid email address')
  ],
  studentId: [
    param('studentId').isUUID().withMessage('Invalid student ID')
  ],
  assignCourse: [
    param('id').isUUID().withMessage('Invalid group ID'),
    body('courseId').isUUID().withMessage('Invalid course ID')
  ],
  courseId: [
    param('courseId').isUUID().withMessage('Invalid course ID')
  ]
};

module.exports = groupValidators;

