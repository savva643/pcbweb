const { body, param } = require('express-validator');

/**
 * Валидаторы для тестов
 */
const testValidators = {
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
    body('maxScore')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Max score must be a positive integer'),
    body('timeLimit')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Time limit must be a positive integer (in minutes)'),
    body('autoGrade')
      .optional()
      .isBoolean()
      .withMessage('Auto grade must be a boolean'),
    body('difficulty')
      .optional()
      .isIn(['LOW', 'MEDIUM', 'HIGH'])
      .withMessage('Difficulty must be one of: LOW, MEDIUM, HIGH')
  ],

  addQuestion: [
    param('id')
      .notEmpty()
      .withMessage('Test ID is required')
      .isUUID()
      .withMessage('Invalid test ID format'),
    body('type')
      .isIn(['multiple_choice', 'matching', 'true_false', 'text_input'])
      .withMessage('Type must be one of: multiple_choice, matching, true_false, text_input'),
    body('question')
      .trim()
      .notEmpty()
      .withMessage('Question is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Question must be between 1 and 1000 characters'),
    body('points')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Points must be a positive integer'),
    body('answers')
      .optional()
      .custom((value, { req }) => {
        // Для text_input answers может быть пустым или отсутствовать
        if (req.body.type === 'text_input') {
          if (value && !Array.isArray(value)) {
            throw new Error('Answers must be an array');
          }
          return true;
        }
        // Для других типов answers обязателен и должен содержать хотя бы один элемент
        if (!value || !Array.isArray(value) || value.length === 0) {
          throw new Error('At least one answer is required');
        }
        return true;
      }),
    body('answers.*.text')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Answer text is required'),
    body('answers.*.isCorrect')
      .optional()
      .isBoolean()
      .withMessage('isCorrect must be a boolean'),
    body('answers.*.matchKey')
      .optional()
      .trim()
      .withMessage('Match key must be a string'),
    body('order')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Order must be a non-negative integer')
  ],

  submit: [
    param('id')
      .notEmpty()
      .withMessage('Test ID is required')
      .isUUID()
      .withMessage('Invalid test ID format'),
    body('attemptId')
      .notEmpty()
      .withMessage('Attempt ID is required')
      .isUUID()
      .withMessage('Invalid attempt ID format'),
    body('answers')
      .isArray()
      .withMessage('Answers must be an array'),
    body('answers.*.questionId')
      .notEmpty()
      .isUUID()
      .withMessage('Question ID is required'),
    body('answers.*.answerIds')
      .isArray()
      .withMessage('Answer IDs must be an array')
  ],

  testId: [
    param('id')
      .notEmpty()
      .withMessage('Test ID is required')
      .isUUID()
      .withMessage('Invalid test ID format')
  ],

  attemptId: [
    param('attemptId')
      .notEmpty()
      .withMessage('Attempt ID is required')
      .isUUID()
      .withMessage('Invalid attempt ID format')
  ],

  commentId: [
    param('commentId')
      .notEmpty()
      .withMessage('Comment ID is required')
      .isUUID()
      .withMessage('Invalid comment ID format')
  ],

  gradeAttempt: [
    param('attemptId')
      .notEmpty()
      .withMessage('Attempt ID is required')
      .isUUID()
      .withMessage('Invalid attempt ID format'),
    body('score')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Score must be a non-negative integer'),
    body('feedback')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Feedback must not exceed 1000 characters')
  ],

  addComment: [
    param('attemptId')
      .notEmpty()
      .withMessage('Attempt ID is required')
      .isUUID()
      .withMessage('Invalid attempt ID format'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
      .isLength({ max: 1000 })
      .withMessage('Comment must not exceed 1000 characters')
  ],

  updateComment: [
    param('commentId')
      .notEmpty()
      .withMessage('Comment ID is required')
      .isUUID()
      .withMessage('Invalid comment ID format'),
    body('content')
      .trim()
      .notEmpty()
      .withMessage('Comment content is required')
      .isLength({ max: 1000 })
      .withMessage('Comment must not exceed 1000 characters')
  ]
};

module.exports = testValidators;

