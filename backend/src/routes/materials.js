const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router();

// Get materials for a course
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

    const materials = await prisma.material.findMany({
      where: { courseId },
      orderBy: {
        order: 'asc'
      }
    });

    res.json(materials);
  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

// Create material (teacher only)
router.post('/', authenticate, requireRole('TEACHER'), upload.single('file'), [
  body('courseId').notEmpty(),
  body('title').trim().notEmpty(),
  body('type').isIn(['video', 'text', 'scorm', 'file'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { courseId, title, description, type, order } = req.body;

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let contentUrl = null;
    if (req.file) {
      contentUrl = `/uploads/${req.file.filename}`;
    }

    const material = await prisma.material.create({
      data: {
        courseId,
        title,
        description,
        type,
        contentUrl,
        order: order ? parseInt(order) : 0
      }
    });

    res.status(201).json(material);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

module.exports = router;

