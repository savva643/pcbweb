const express = require('express');
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get progress for a course (student only)
router.get('/course/:courseId', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check enrollment
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

    // Get all materials for the course
    const materials = await prisma.material.findMany({
      where: { courseId },
      orderBy: { order: 'asc' }
    });

    // Get progress records
    const progressRecords = await prisma.progress.findMany({
      where: {
        courseId,
        studentId: req.user.id
      }
    });

    // Get assignments and submissions
    const assignments = await prisma.assignment.findMany({
      where: { courseId }
    });

    const submissions = await prisma.submission.findMany({
      where: {
        studentId: req.user.id,
        assignmentId: {
          in: assignments.map(a => a.id)
        }
      },
      include: {
        grade: true
      }
    });

    // Calculate progress
    const completedMaterials = progressRecords.filter(p => p.completed && p.materialId).length;
    const totalMaterials = materials.length;
    const completedAssignments = submissions.filter(s => s.status === 'GRADED').length;
    const totalAssignments = assignments.length;

    const materialProgress = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;
    const assignmentProgress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
    const overallProgress = (materialProgress + assignmentProgress) / 2;

    res.json({
      courseId,
      materials: {
        completed: completedMaterials,
        total: totalMaterials,
        progress: materialProgress
      },
      assignments: {
        completed: completedAssignments,
        total: totalAssignments,
        progress: assignmentProgress
      },
      overallProgress,
      progressRecords,
      submissions
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Mark material as completed
router.post('/material/:materialId/complete', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const { materialId } = req.params;

    const material = await prisma.material.findUnique({
      where: { id: materialId },
      include: { course: true }
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: req.user.id,
          courseId: material.courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const progress = await prisma.progress.upsert({
      where: {
        studentId_courseId_materialId: {
          studentId: req.user.id,
          courseId: material.courseId,
          materialId: material.id
        }
      },
      update: {
        completed: true,
        completedAt: new Date()
      },
      create: {
        courseId: material.courseId,
        studentId: req.user.id,
        materialId: material.id,
        completed: true,
        completedAt: new Date()
      }
    });

    res.json(progress);
  } catch (error) {
    console.error('Mark material complete error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

module.exports = router;

