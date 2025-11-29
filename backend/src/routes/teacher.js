const express = require('express');
const prisma = require('../config/database');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get course statistics (teacher only)
router.get('/courses/:courseId/stats', authenticate, requireRole('TEACHER'), async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all enrollments
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Get all assignments
    const assignments = await prisma.assignment.findMany({
      where: { courseId }
    });

    // Get all submissions with grades
    const submissions = await prisma.submission.findMany({
      where: {
        assignmentId: {
          in: assignments.map(a => a.id)
        }
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignment: true,
        grade: true
      }
    });

    // Calculate statistics
    const totalStudents = enrollments.length;
    const totalAssignments = assignments.length;
    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter(s => s.grade).length;

    // Average grade
    let totalScore = 0;
    let totalMaxScore = 0;
    submissions.forEach(submission => {
      if (submission.grade) {
        totalScore += submission.grade.score;
        totalMaxScore += submission.grade.maxScore;
      }
    });
    const averageGrade = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    // Statistics per student
    const studentStats = enrollments.map(enrollment => {
      const studentSubmissions = submissions.filter(s => s.studentId === enrollment.studentId);
      const studentGraded = studentSubmissions.filter(s => s.grade);
      
      let studentScore = 0;
      let studentMaxScore = 0;
      studentGraded.forEach(submission => {
        if (submission.grade) {
          studentScore += submission.grade.score;
          studentMaxScore += submission.grade.maxScore;
        }
      });
      const studentAverage = studentMaxScore > 0 ? (studentScore / studentMaxScore) * 100 : 0;

      // Get progress
      const progressRecords = prisma.progress.findMany({
        where: {
          courseId,
          studentId: enrollment.studentId
        }
      }).then(records => {
        const materials = prisma.material.findMany({
          where: { courseId }
        }).then(materials => {
          const completedMaterials = records.filter(r => r.completed && r.materialId).length;
          const materialProgress = materials.length > 0 ? (completedMaterials / materials.length) * 100 : 0;
          const assignmentProgress = totalAssignments > 0 ? (studentGraded.length / totalAssignments) * 100 : 0;
          return (materialProgress + assignmentProgress) / 2;
        });
        return materials;
      });

      return {
        studentId: enrollment.studentId,
        studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        studentEmail: enrollment.student.email,
        submissionsCount: studentSubmissions.length,
        gradedCount: studentGraded.length,
        averageGrade: Math.round(studentAverage),
        totalScore: studentScore,
        totalMaxScore: studentMaxScore
      };
    });

    // Wait for all progress calculations
    const studentStatsWithProgress = await Promise.all(
      studentStats.map(async (stat) => {
        const progressRecords = await prisma.progress.findMany({
          where: {
            courseId,
            studentId: stat.studentId
          }
        });

        const materials = await prisma.material.findMany({
          where: { courseId }
        });

        const completedMaterials = progressRecords.filter(r => r.completed && r.materialId).length;
        const materialProgress = materials.length > 0 ? (completedMaterials / materials.length) * 100 : 0;
        const assignmentProgress = totalAssignments > 0 ? (stat.gradedCount / totalAssignments) * 100 : 0;
        const overallProgress = (materialProgress + assignmentProgress) / 2;

        return {
          ...stat,
          progress: Math.round(overallProgress)
        };
      })
    );

    res.json({
      course: {
        id: course.id,
        title: course.title
      },
      summary: {
        totalStudents,
        totalAssignments,
        totalSubmissions,
        gradedSubmissions,
        averageGrade: Math.round(averageGrade)
      },
      students: studentStatsWithProgress
    });
  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get student details in course (teacher only)
router.get('/courses/:courseId/students/:studentId', authenticate, requireRole('TEACHER'), async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Student not enrolled in this course' });
    }

    // Get student info
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    // Get all assignments
    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' }
    });

    // Get all submissions for this student
    const submissions = await prisma.submission.findMany({
      where: {
        studentId,
        assignmentId: {
          in: assignments.map(a => a.id)
        }
      },
      include: {
        assignment: true,
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    // Get progress
    const materials = await prisma.material.findMany({
      where: { courseId },
      orderBy: { order: 'asc' }
    });

    const progressRecords = await prisma.progress.findMany({
      where: {
        courseId,
        studentId
      }
    });

    const completedMaterials = progressRecords.filter(p => p.completed && p.materialId).length;
    const materialProgress = materials.length > 0 ? (completedMaterials / materials.length) * 100 : 0;
    const assignmentProgress = assignments.length > 0 
      ? (submissions.filter(s => s.grade).length / assignments.length) * 100 
      : 0;
    const overallProgress = (materialProgress + assignmentProgress) / 2;

    // Calculate average grade
    const gradedSubmissions = submissions.filter(s => s.grade);
    let totalScore = 0;
    let totalMaxScore = 0;
    gradedSubmissions.forEach(submission => {
      if (submission.grade) {
        totalScore += submission.grade.score;
        totalMaxScore += submission.grade.maxScore;
      }
    });
    const averageGrade = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    res.json({
      student,
      course: {
        id: course.id,
        title: course.title
      },
      progress: {
        materials: {
          completed: completedMaterials,
          total: materials.length,
          progress: Math.round(materialProgress)
        },
        assignments: {
          completed: gradedSubmissions.length,
          total: assignments.length,
          progress: Math.round(assignmentProgress)
        },
        overall: Math.round(overallProgress),
        averageGrade: Math.round(averageGrade),
        totalScore,
        totalMaxScore
      },
      assignments: assignments.map(assignment => {
        const submission = submissions.find(s => s.assignmentId === assignment.id);
        return {
          ...assignment,
          submission: submission || null
        };
      })
    });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
});

// Search students in course (teacher only)
router.get('/courses/:courseId/students', authenticate, requireRole('TEACHER'), async (req, res) => {
  try {
    const { courseId } = req.params;
    const { search } = req.query;

    // Check course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.teacherId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get enrollments
    let enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      enrollments = enrollments.filter(enrollment => {
        const student = enrollment.student;
        return (
          student.firstName.toLowerCase().includes(searchLower) ||
          student.lastName.toLowerCase().includes(searchLower) ||
          student.email.toLowerCase().includes(searchLower) ||
          `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchLower)
        );
      });
    }

    res.json(enrollments.map(e => e.student));
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({ error: 'Failed to search students' });
  }
});

module.exports = router;


