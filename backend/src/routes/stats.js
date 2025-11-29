const express = require('express');
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get student statistics
router.get('/student', authenticate, requireRole('STUDENT'), async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get enrolled courses
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            _count: {
              select: {
                materials: true,
                assignments: true
              }
            }
          }
        }
      }
    });

    // Get all submissions with grades
    const submissions = await prisma.submission.findMany({
      where: { studentId },
      include: {
        grade: true,
        assignment: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    // Calculate statistics
    const totalCourses = enrollments.length;
    const gradedSubmissions = submissions.filter(s => s.grade);
    const totalAssignments = submissions.length;
    const completedAssignments = gradedSubmissions.length;

    // Calculate average grade
    let totalScore = 0;
    let totalMaxScore = 0;
    gradedSubmissions.forEach(submission => {
      if (submission.grade) {
        totalScore += submission.grade.score;
        totalMaxScore += submission.grade.maxScore;
      }
    });
    const averageGrade = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    // Get progress for all courses
    const courseProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseId = enrollment.courseId;
        
        // Get materials
        const materials = await prisma.material.findMany({
          where: { courseId }
        });

        // Get progress records
        const progressRecords = await prisma.progress.findMany({
          where: {
            courseId,
            studentId,
            completed: true
          }
        });

        const completedMaterials = progressRecords.filter(p => p.materialId).length;
        const materialProgress = materials.length > 0 ? (completedMaterials / materials.length) * 100 : 0;

        // Get assignments for this course
        const courseAssignments = await prisma.assignment.findMany({
          where: { courseId }
        });

        const courseSubmissions = submissions.filter(s => 
          courseAssignments.some(a => a.id === s.assignmentId)
        );
        const gradedCourseSubmissions = courseSubmissions.filter(s => s.grade);
        const assignmentProgress = courseAssignments.length > 0 
          ? (gradedCourseSubmissions.length / courseAssignments.length) * 100 
          : 0;

        const overallProgress = (materialProgress + assignmentProgress) / 2;

        return {
          courseId,
          courseTitle: enrollment.course.title,
          progress: overallProgress
        };
      })
    );

    // Count completed courses (progress > 80%)
    const completedCourses = courseProgress.filter(cp => cp.progress >= 80).length;

    res.json({
      totalCourses,
      completedCourses,
      totalAssignments,
      completedAssignments,
      averageGrade: Math.round(averageGrade),
      totalScore,
      totalMaxScore,
      courseProgress
    });
  } catch (error) {
    console.error('Get student stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;


