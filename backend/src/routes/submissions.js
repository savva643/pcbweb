const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router();

// Submit assignment (student only)
router.post('/', authenticate, requireRole('STUDENT'), upload.single('file'), [
  body('assignmentId').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const { assignmentId } = req.body;

    // Check assignment access
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Check enrollment
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

    // Check if submission already exists
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId: req.user.id
      }
    });

    const fileUrl = `/uploads/${req.file.filename}`;
    const { comment } = req.body; // Комментарий к версии

    let submission;
    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.submission.update({
        where: { id: existingSubmission.id },
        data: {
          fileUrl,
          status: 'SUBMITTED'
        },
        include: {
          assignment: true,
          grade: true
        }
      });

      // Get latest version number
      const latestVersion = await prisma.submissionVersion.findFirst({
        where: { submissionId: existingSubmission.id },
        orderBy: { version: 'desc' },
        select: { version: true }
      });

      const nextVersion = (latestVersion?.version || 0) + 1;

      // Create new version
      await prisma.submissionVersion.create({
        data: {
          submissionId: existingSubmission.id,
          version: nextVersion,
          fileUrl,
          comment: comment || null
        }
      });
    } else {
      // Create new submission
      submission = await prisma.submission.create({
        data: {
          assignmentId,
          studentId: req.user.id,
          fileUrl,
          status: 'SUBMITTED'
        },
        include: {
          assignment: true,
          grade: true
        }
      });

      // Create initial version
      await prisma.submissionVersion.create({
        data: {
          submissionId: submission.id,
          version: 1,
          fileUrl,
          comment: comment || null
        }
      });
    }

    res.status(201).json(submission);
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Grade submission (teacher only)
router.post('/:id/grade', authenticate, requireRole('TEACHER'), [
  body('score').isInt({ min: 0 }),
  body('maxScore').optional().isInt({ min: 1 }),
  body('feedback').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { score, maxScore, feedback } = req.body;

    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: { course: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check course ownership
    if (submission.assignment.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignmentMaxScore = maxScore || submission.assignment.maxScore;

    // Create or update grade
    const grade = await prisma.grade.upsert({
      where: { submissionId: id },
      update: {
        score: parseInt(score),
        maxScore: assignmentMaxScore,
        feedback,
        gradedBy: req.user.id
      },
      create: {
        submissionId: id,
        studentId: submission.studentId,
        score: parseInt(score),
        maxScore: assignmentMaxScore,
        feedback,
        gradedBy: req.user.id
      }
    });

    // Update submission status
    await prisma.submission.update({
      where: { id },
      data: { status: 'GRADED' }
    });

    res.json(grade);
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// Add comment to submission
router.post('/:id/comments', authenticate, [
  body('content').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { content } = req.body;

    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: { course: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Access denied' });
    }

    // Check access
    if (req.user.role === 'STUDENT' && submission.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'TEACHER' && submission.assignment.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = await prisma.comment.create({
      data: {
        submissionId: id,
        authorId: req.user.id,
        content
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get my submissions (student) or all submissions for assignment (teacher)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'STUDENT') {
      const submissions = await prisma.submission.findMany({
        where: { studentId: req.user.id },
        include: {
          assignment: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
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
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });

      return res.json(submissions);
    } else if (req.user.role === 'TEACHER') {
      const { assignmentId } = req.query;

      if (!assignmentId) {
        return res.status(400).json({ error: 'assignmentId is required' });
      }

      // Check assignment ownership
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { course: true }
      });

      if (!assignment || assignment.course.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const submissions = await prisma.submission.findMany({
        where: { assignmentId },
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
        },
        orderBy: {
          submittedAt: 'desc'
        }
      });

      return res.json(submissions);
    }

    res.status(403).json({ error: 'Invalid role' });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get submission versions (student can see own, teacher can see all)
router.get('/:id/versions', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: { course: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check access
    if (req.user.role === 'STUDENT' && submission.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'TEACHER' && submission.assignment.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all versions
    const versions = await prisma.submissionVersion.findMany({
      where: { submissionId: id },
      orderBy: { version: 'desc' }
    });

    res.json(versions);
  } catch (error) {
    console.error('Get submission versions error:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// Get specific submission version
router.get('/:id/versions/:version', authenticate, async (req, res) => {
  try {
    const { id, version } = req.params;

    // Get submission
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        assignment: {
          include: { course: true }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check access
    if (req.user.role === 'STUDENT' && submission.studentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'TEACHER' && submission.assignment.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get version
    const submissionVersion = await prisma.submissionVersion.findUnique({
      where: {
        submissionId_version: {
          submissionId: id,
          version: parseInt(version)
        }
      }
    });

    if (!submissionVersion) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json(submissionVersion);
  } catch (error) {
    console.error('Get submission version error:', error);
    res.status(500).json({ error: 'Failed to fetch version' });
  }
});

module.exports = router;


