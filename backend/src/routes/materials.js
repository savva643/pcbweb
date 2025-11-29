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

    // Create initial version
    await prisma.materialVersion.create({
      data: {
        materialId: material.id,
        version: 1,
        title: material.title,
        description: material.description,
        contentUrl: material.contentUrl,
        order: material.order,
        createdBy: req.user.id
      }
    });

    res.status(201).json(material);
  } catch (error) {
    console.error('Create material error:', error);
    res.status(500).json({ error: 'Failed to create material' });
  }
});

// Update material (teacher only)
router.put('/:id', authenticate, requireRole('TEACHER'), upload.single('file'), [
  body('title').optional().trim().notEmpty(),
  body('description').optional(),
  body('type').optional().isIn(['video', 'text', 'scorm', 'file']),
  body('order').optional().isInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, type, order } = req.body;

    // Get material
    const material = await prisma.material.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check course ownership
    if (material.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (order !== undefined) updateData.order = parseInt(order);
    if (req.file) {
      updateData.contentUrl = `/uploads/${req.file.filename}`;
    }

    // Update material
    const updatedMaterial = await prisma.material.update({
      where: { id },
      data: updateData
    });

    // Get latest version number
    const latestVersion = await prisma.materialVersion.findFirst({
      where: { materialId: id },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const nextVersion = (latestVersion?.version || 0) + 1;

    // Create new version
    await prisma.materialVersion.create({
      data: {
        materialId: id,
        version: nextVersion,
        title: updatedMaterial.title,
        description: updatedMaterial.description,
        contentUrl: updatedMaterial.contentUrl,
        order: updatedMaterial.order,
        createdBy: req.user.id
      }
    });

    res.json(updatedMaterial);
  } catch (error) {
    console.error('Update material error:', error);
    res.status(500).json({ error: 'Failed to update material' });
  }
});

// Get material versions (teacher only)
router.get('/:id/versions', authenticate, requireRole('TEACHER'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get material
    const material = await prisma.material.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check course ownership
    if (material.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all versions
    const versions = await prisma.materialVersion.findMany({
      where: { materialId: id },
      orderBy: { version: 'desc' }
    });

    res.json(versions);
  } catch (error) {
    console.error('Get material versions error:', error);
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

// Get specific material version (teacher only)
router.get('/:id/versions/:version', authenticate, requireRole('TEACHER'), async (req, res) => {
  try {
    const { id, version } = req.params;

    // Get material
    const material = await prisma.material.findUnique({
      where: { id },
      include: { course: true }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check course ownership
    if (material.course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get version
    const materialVersion = await prisma.materialVersion.findUnique({
      where: {
        materialId_version: {
          materialId: id,
          version: parseInt(version)
        }
      }
    });

    if (!materialVersion) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json(materialVersion);
  } catch (error) {
    console.error('Get material version error:', error);
    res.status(500).json({ error: 'Failed to fetch version' });
  }
});

module.exports = router;


