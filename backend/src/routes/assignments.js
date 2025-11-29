const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get assignments for a course
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

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // For students, include their submission status
    if (req.user.role === 'STUDENT') {
      const assignmentsWithStatus = await Promise.all(
        assignments.map(async (assignment) => {
          const submission = await prisma.submission.findFirst({
            where: {
              assignmentId: assignment.id,
              studentId: req.user.id
            },
            include: {
              grade: true
            }
          });

          return {
            ...assignment,
            mySubmission: submission || null
          };
        })
      );

      return res.json(assignmentsWithStatus);
    }

    res.json(assignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get assignment by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        course: true,
        submissions: req.user.role === 'TEACHER' ? {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            grade: true,
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        } : false
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check access
    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: assignment.courseId
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Include student's submission
      const submission = await prisma.submission.findFirst({
        where: {
          assignmentId: id,
          studentId: req.user.id
        },
        include: {
          grade: true,
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      return res.json({
        ...assignment,
        mySubmission: submission || null
      });
    } else if (req.user.role === 'TEACHER' && assignment.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Create assignment (teacher only)
router.post('/', authenticate, requireRole('TEACHER'), [
  body('courseId').notEmpty(),
  body('title').trim().notEmpty(),
  body('maxScore').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, title, description, dueDate, maxScore } = req.body;

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore ? parseInt(maxScore) : 100
      }
    });

    res.status(201).json(assignment);
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

module.exports = router;

