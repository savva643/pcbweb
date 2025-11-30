const assignmentRepository = require('../repositories/assignmentRepository');
const submissionRepository = require('../repositories/submissionRepository');
const courseRepository = require('../repositories/courseRepository');

/**
 * Сервис для работы с заданиями
 * @class AssignmentService
 */
class AssignmentService {
  /**
   * Проверка доступа к курсу
   * @param {string} courseId - ID курса
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<object>} Курс
   * @throws {Error} Если доступ запрещен
   */
  async checkCourseAccess(courseId, userId, userRole) {
    const course = await courseRepository.findById(courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    if (userRole === 'STUDENT') {
      const enrollment = await courseRepository.findEnrollment(userId, courseId);
      if (!enrollment) {
        throw new Error('Access denied');
      }
    } else if (userRole === 'TEACHER' && course.teacherId !== userId) {
      throw new Error('Access denied');
    }

    return course;
  }

  /**
   * Получить задания курса
   * @param {string} courseId - ID курса
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<Array>} Список заданий
   */
  async getCourseAssignments(courseId, userId, userRole) {
    await this.checkCourseAccess(courseId, userId, userRole);

    const assignments = await assignmentRepository.findByCourse(courseId);

    // Для студентов добавляем статус их отправки
    if (userRole === 'STUDENT') {
      const assignmentsWithStatus = await Promise.all(
        assignments.map(async (assignment) => {
          const submission = await submissionRepository.findByAssignmentAndStudent(
            assignment.id,
            userId
          );

          return {
            ...assignment,
            mySubmission: submission || null
          };
        })
      );

      return assignmentsWithStatus;
    }

    return assignments;
  }

  /**
   * Получить задание по ID
   * @param {string} assignmentId - ID задания
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<object>} Задание
   */
  async getAssignmentById(assignmentId, userId, userRole) {
    const assignment = await assignmentRepository.findByIdWithCourse(assignmentId);

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    await this.checkCourseAccess(assignment.courseId, userId, userRole);

    if (userRole === 'TEACHER') {
      return assignmentRepository.findByIdWithSubmissions(assignmentId);
    }

    // Для студентов добавляем их отправку
    const submission = await submissionRepository.findByAssignmentAndStudent(
      assignmentId,
      userId
    );

    return {
      ...assignment,
      mySubmission: submission || null
    };
  }

  /**
   * Создать задание
   * @param {string} courseId - ID курса
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные задания
   * @returns {Promise<object>} Созданное задание
   */
  async createAssignment(courseId, teacherId, data) {
    await this.checkCourseAccess(courseId, teacherId, 'TEACHER');

    return assignmentRepository.create({
      courseId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      maxScore: data.maxScore ? parseInt(data.maxScore) : 100,
      difficulty: data.difficulty || 'MEDIUM'
    });
  }
}

module.exports = new AssignmentService();

