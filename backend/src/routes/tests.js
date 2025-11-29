const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get tests for a course
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check course access
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'TEACHER' && course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tests = await prisma.test.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // For students, include their attempt status
    if (req.user.role === 'STUDENT') {
      const testsWithAttempts = await Promise.all(
        tests.map(async (test) => {
          const attempt = await prisma.testAttempt.findFirst({
            where: {
              testId: test.id,
              studentId: req.user.id
            },
            orderBy: { startedAt: 'desc' }
          });

          return {
            ...test,
            myAttempt: attempt || null
          };
        })
      );

      return res.json(testsWithAttempts);
    }

    res.json(tests);
  } catch (error) {
    console.error('Get tests error:', error);
    res.status(500).json({ error: 'Failed to fetch tests' });
  }
});

// Get test by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        course: true,
        questions: {
          include: {
            answers: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check access
    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: test.courseId
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // For students, hide correct answers
      const testWithoutAnswers = {
        ...test,
        questions: test.questions.map(q => ({
          ...q,
          answers: q.answers.map(a => ({
            id: a.id,
            text: a.text,
            order: a.order,
            matchKey: a.matchKey
            // isCorrect is hidden
          }))
        }))
      };

      return res.json(testWithoutAnswers);
    } else if (req.user.role === 'TEACHER' && test.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(test);
  } catch (error) {
    console.error('Get test error:', error);
    res.status(500).json({ error: 'Failed to fetch test' });
  }
});

// Create test (teacher only)
router.post('/', authenticate, requireRole('TEACHER'), [
  body('courseId').notEmpty(),
  body('title').trim().notEmpty(),
  body('maxScore').optional().isInt({ min: 1 }),
  body('timeLimit').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, title, description, maxScore, timeLimit } = req.body;

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const test = await prisma.test.create({
      data: {
        courseId,
        title,
        description,
        maxScore: maxScore ? parseInt(maxScore) : 100,
        timeLimit: timeLimit ? parseInt(timeLimit) : null
      },
      include: {
        questions: true
      }
    });

    res.status(201).json(test);
  } catch (error) {
    console.error('Create test error:', error);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

// Add question to test (teacher only)
router.post('/:id/questions', authenticate, requireRole('TEACHER'), [
  body('type').isIn(['multiple_choice', 'matching', 'true_false']),
  body('question').trim().notEmpty(),
  body('points').optional().isInt({ min: 1 }),
  body('answers').isArray().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { type, question, points, answers, order } = req.body;

    // Get test
    const test = await prisma.test.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    if (test.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create question
    const createdQuestion = await prisma.question.create({
      data: {
        testId: id,
        type,
        question,
        points: points ? parseInt(points) : 1,
        order: order ? parseInt(order) : 0
      }
    });

    // Create answers
    const answerData = answers.map((answer, index) => ({
      questionId: createdQuestion.id,
      text: answer.text,
      isCorrect: answer.isCorrect || false,
      order: answer.order !== undefined ? answer.order : index,
      matchKey: answer.matchKey || null
    }));

    await prisma.answer.createMany({
      data: answerData
    });

    const questionWithAnswers = await prisma.question.findUnique({
      where: { id: createdQuestion.id },
      include: { answers: true }
    });

    res.status(201).json(questionWithAnswers);
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Start test attempt (student only)
router.post('/:id/start', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get test
    const test = await prisma.test.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: test.courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if already started
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: {
        testId: id,
        studentId: req.user.id,
        completedAt: null
      }
    });

    if (existingAttempt) {
      return res.json(existingAttempt);
    }

    // Create attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        testId: id,
        studentId: req.user.id,
        maxScore: test.maxScore
      }
    });

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Start test error:', error);
    res.status(500).json({ error: 'Failed to start test' });
  }
});

// Submit test answers (student only)
router.post('/:id/submit', authenticate, requireRole('STUDENT'), [
  body('attemptId').notEmpty(),
  body('answers').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { attemptId, answers } = req.body;

    // Get test with questions and correct answers
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        course: true,
        questions: {
          include: {
            answers: true
          }
        }
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Check attempt ownership
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId }
    });

    if (!attempt || attempt.testId !== id || attempt.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (attempt.completedAt) {
      return res.status(400).json({ error: 'Test already completed' });
    }

    let totalScore = 0;
    const answerRecords = [];

    // Check each answer
    for (const answer of answers) {
      const question = test.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      let isCorrect = false;
      let points = 0;

      if (question.type === 'multiple_choice') {
        // Check if selected answer is correct
        const selectedAnswer = question.answers.find(a => a.id === answer.answerIds[0]);
        if (selectedAnswer && selectedAnswer.isCorrect) {
          isCorrect = true;
          points = question.points;
        }
      } else if (question.type === 'true_false') {
        // Check if selected answer matches correct answer
        const correctAnswer = question.answers.find(a => a.isCorrect);
        if (correctAnswer && answer.answerIds.includes(correctAnswer.id)) {
          isCorrect = true;
          points = question.points;
        }
      } else if (question.type === 'matching') {
        // For matching, check if all pairs are correct
        const correctPairs = question.answers.filter(a => a.isCorrect);
        const selectedPairs = answer.answerIds.map(aid => {
          const ans = question.answers.find(a => a.id === aid);
          return ans ? { id: ans.id, matchKey: ans.matchKey } : null;
        }).filter(Boolean);

        // Simple matching check (can be improved)
        if (selectedPairs.length === correctPairs.length) {
          const allCorrect = selectedPairs.every(sp => 
            correctPairs.some(cp => cp.id === sp.id && cp.matchKey === sp.matchKey)
          );
          if (allCorrect) {
            isCorrect = true;
            points = question.points;
          }
        }
      }

      totalScore += points;

      answerRecords.push({
        attemptId,
        questionId: question.id,
        answerIds: answer.answerIds,
        isCorrect,
        points
      });
    }

    // Create answer records
    await prisma.testAttemptAnswer.createMany({
      data: answerRecords
    });

    // Update attempt
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        score: totalScore,
        completedAt: new Date()
      },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    res.json(updatedAttempt);
  } catch (error) {
    console.error('Submit test error:', error);
    res.status(500).json({ error: 'Failed to submit test' });
  }
});

// Get test attempt results
router.get('/:id/attempts/:attemptId', authenticate, async (req, res) => {
  try {
    const { id, attemptId } = req.params;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            course: true,
            questions: {
              include: {
                answers: true
              }
            }
          }
        },
        answers: {
          include: {
            question: {
              include: {
                answers: true
              }
            }
          }
        }
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    // Check access
    if (req.user.role === 'STUDENT' && attempt.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'TEACHER' && attempt.test.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(attempt);
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ error: 'Failed to fetch attempt' });
  }
});

module.exports = router;

