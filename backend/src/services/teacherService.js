const courseRepository = require('../repositories/courseRepository');
const assignmentRepository = require('../repositories/assignmentRepository');
const submissionRepository = require('../repositories/submissionRepository');
const gradeRepository = require('../repositories/gradeRepository');
const prisma = require('../config/database');

/**
 * Сервис для работы преподавателя
 * @class TeacherService
 */
class TeacherService {
  /**
   * Получить статистику курса
   * @param {string} courseId - ID курса
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<object>} Статистика
   */
  async getCourseStats(courseId, teacherId) {
    const course = await courseRepository.findById(courseId);

    if (!course || course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

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

    const assignments = await assignmentRepository.findByCourse(courseId);
    const assignmentIds = assignments.map(a => a.id);

    const submissions = await submissionRepository.findAll({
      where: {
        assignmentId: {
          in: assignmentIds
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

    const totalStudents = enrollments.length;
    const totalAssignments = assignments.length;
    const totalSubmissions = submissions.length;
    const gradedSubmissions = submissions.filter(s => s.grade).length;

    let totalScore = 0;
    let totalMaxScore = 0;
    submissions.forEach(submission => {
      if (submission.grade) {
        totalScore += submission.grade.score;
        totalMaxScore += submission.grade.maxScore;
      }
    });

    const averageGrade = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    return {
      course,
      totalStudents,
      totalAssignments,
      totalSubmissions,
      gradedSubmissions,
      averageGrade: Math.round(averageGrade),
      students: enrollments.map(e => e.student),
      submissions
    };
  }

  /**
   * Получить детали студента
   * @param {string} courseId - ID курса
   * @param {string} studentId - ID студента
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<object>} Детали студента
   */
  async getStudentDetails(courseId, studentId, teacherId) {
    const course = await courseRepository.findById(courseId);

    if (!course || course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const assignments = await assignmentRepository.findByCourse(courseId);

    const assignmentsWithSubmissions = await Promise.all(
      assignments.map(async (assignment) => {
        const submission = await submissionRepository.findByAssignmentAndStudent(
          assignment.id,
          studentId
        );

        return {
          ...assignment,
          submission: submission ? {
            ...submission,
            grade: submission.grade
          } : null
        };
      })
    );

    return {
      student,
      course,
      assignments: assignmentsWithSubmissions
    };
  }
}

module.exports = new TeacherService();

