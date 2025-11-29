const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all available courses (for students: all courses, for teachers: own courses)
router.get('/available', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    // Get all public courses and private courses where student email is allowed
    const allCourses = await prisma.course.findMany({
      where: {
        OR: [
          { isPrivate: false }, // Публичные курсы
          {
            isPrivate: true,
            allowedEmails: {
              contains: req.user.email // Персональные курсы для этого студента
            }
          }
        ]
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
  body('description').optional(),
  body('isPrivate').optional().isBoolean(),
  body('allowedEmails').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, isPrivate, allowedEmails } = req.body;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        teacherId: req.user.id,
        isPrivate: isPrivate || false,
        allowedEmails: isPrivate ? allowedEmails : null
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

// Update course (teacher only)
router.put('/:id', authenticate, requireRole('TEACHER'), [
  body('title').optional().trim().notEmpty(),
  body('description').optional(),
  body('isPrivate').optional().isBoolean(),
  body('allowedEmails').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, isPrivate, allowedEmails } = req.body;

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPrivate !== undefined) {
      updateData.isPrivate = isPrivate;
      updateData.allowedEmails = isPrivate ? allowedEmails : null;
    } else if (allowedEmails !== undefined) {
      updateData.allowedEmails = course.isPrivate ? allowedEmails : null;
    }

    // If course becomes private, enroll students from allowedEmails
    if (isPrivate === true && allowedEmails) {
      const emails = allowedEmails.split(',').map(e => e.trim()).filter(e => e);
      
      // Find students by emails
      const students = await prisma.user.findMany({
        where: {
          email: { in: emails },
          role: 'STUDENT'
        }
      });

      // Enroll students
      for (const student of students) {
        await prisma.courseEnrollment.upsert({
          where: {
            studentId_courseId: {
              studentId: student.id,
              courseId: id
            }
          },
          update: {},
          create: {
            studentId: student.id,
            courseId: id
          }
        });
      }
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: updateData,
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

    res.json(updatedCourse);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Failed to update course' });
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

// Add student to course (teacher only)
router.post('/:id/enroll-student', authenticate, requireRole('TEACHER'), [
  body('studentEmail').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { studentEmail } = req.body;

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find student by email
    const student = await prisma.user.findUnique({
      where: { email: studentEmail },
      select: { id: true, email: true, firstName: true, lastName: true, role: true }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (student.role !== 'STUDENT') {
      return res.status(400).json({ error: 'User is not a student' });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: student.id,
          courseId: id
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: 'Student already enrolled' });
    }

    // Create enrollment
    const enrollment = await prisma.courseEnrollment.create({
      data: {
        studentId: student.id,
        courseId: id
      },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        course: true
      }
    });

    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

module.exports = router;

