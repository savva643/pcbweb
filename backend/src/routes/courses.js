const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all available courses (for students: all courses, for teachers: own courses)
router.get('/available', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    // Get all courses
    const allCourses = await prisma.course.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            materials: true,
            assignments: true,
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get enrolled courses for this student
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId: req.user.id
      },
      select: {
        courseId: true
      }
    });

    const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

    // Mark which courses are enrolled
    const coursesWithEnrollment = allCourses.map(course => ({
      ...course,
      isEnrolled: enrolledCourseIds.has(course.id)
    }));

    res.json(coursesWithEnrollment);
  } catch (error) {
    console.error('Get available courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get all courses (for students: enrolled, for teachers: own courses)
router.get('/', authenticate, async (req, res) => {
  try {
    let courses;

    if (req.user.role === 'STUDENT') {
      courses = await prisma.course.findMany({
        where: {
          enrollments: {
            some: {
              studentId: req.user.id
            }
          }
        },
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              materials: true,
              assignments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else if (req.user.role === 'TEACHER') {
      courses = await prisma.course.findMany({
        where: {
          teacherId: req.user.id
        },
        include: {
          _count: {
            select: {
              enrollments: true,
              materials: true,
              assignments: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      return res.status(403).json({ error: 'Invalid role' });
    }

    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        materials: {
          orderBy: {
            order: 'asc'
          }
        },
        assignments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check access
    if (req.user.role === 'STUDENT') {
      const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId: req.user.id,
            courseId: id
          }
        }
      });

      if (!enrollment) {
        return res.status(403).json({ error: 'Access denied' });
      }
    } else if (req.user.role === 'TEACHER' && course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create course (teacher only)
router.post('/', authenticate, requireRole('TEACHER'), [
  body('title').trim().notEmpty(),
  body('description').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        teacherId: req.user.id
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Enroll in course (student only)
router.post('/:id/enroll', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: id
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled' });
    }

    const enrollment = await prisma.courseEnrollment.create({
      data: {
        studentId: req.user.id,
        courseId: id
      },
      include: {
        course: true
      }
    });

    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

module.exports = router;

