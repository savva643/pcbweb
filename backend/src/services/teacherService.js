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

    // Получаем материалы для расчета прогресса
    const materials = await prisma.material.findMany({
      where: { courseId }
    });

    // Формируем статистику по каждому студенту
    const studentsStats = await Promise.all(
      enrollments.map(async (enrollment) => {
        const studentId = enrollment.student.id;
        
        // Получаем отправки студента
        const studentSubmissions = submissions.filter(s => s.studentId === studentId);
        const studentGraded = studentSubmissions.filter(s => s.grade);
        
        // Рассчитываем средний балл студента
        let studentScore = 0;
        let studentMaxScore = 0;
        studentGraded.forEach(submission => {
          if (submission.grade) {
            studentScore += submission.grade.score;
            studentMaxScore += submission.grade.maxScore;
          }
        });
        const studentAverage = studentMaxScore > 0 ? (studentScore / studentMaxScore) * 100 : 0;

        // Получаем прогресс по материалам
        const progressRecords = await prisma.progress.findMany({
          where: {
            courseId,
            studentId,
            completed: true,
            materialId: { not: null }
          }
        });
        const completedMaterials = progressRecords.length;
        const materialProgress = materials.length > 0 ? (completedMaterials / materials.length) * 100 : 0;
        
        // Прогресс по заданиям
        const assignmentProgress = totalAssignments > 0 ? (studentGraded.length / totalAssignments) * 100 : 0;
        const overallProgress = (materialProgress + assignmentProgress) / 2;

        return {
          studentId: enrollment.student.id,
          studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          studentEmail: enrollment.student.email,
          progress: Math.round(overallProgress),
          averageGrade: Math.round(studentAverage),
          submissionsCount: studentSubmissions.length,
          gradedCount: studentGraded.length
        };
      })
    );

    return {
      course,
      summary: {
        totalStudents,
        totalAssignments,
        totalSubmissions,
        gradedSubmissions,
        averageGrade: Math.round(averageGrade)
      },
      students: studentsStats,
      submissions
    };
  }

  /**
   * Получить список студентов курса
   * @param {string} courseId - ID курса
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<Array>} Список студентов
   */
  async getCourseStudents(courseId, teacherId) {
    const course = await courseRepository.findById(courseId);

    if (!course || course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const enrollments = await courseRepository.findEnrollmentsByCourse(courseId);
    return enrollments.map(e => e.student);
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

