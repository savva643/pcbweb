const courseRepository = require('../repositories/courseRepository');
const userRepository = require('../repositories/userRepository');

/**
 * Сервис для работы с курсами
 * @class CourseService
 */
class CourseService {
  /**
   * Получить доступные курсы для студента
   * @param {string} studentId - ID студента
   * @param {string} studentEmail - Email студента
   * @returns {Promise<Array>} Список курсов
   */
  async getAvailableCourses(studentId, studentEmail) {
    const allCourses = await courseRepository.findAvailableForStudent(studentEmail);
    
    // Получаем записи студента
    const prisma = require('../config/database');
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId },
      select: { courseId: true }
    });

    const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

    return allCourses.map(course => ({
      ...course,
      isEnrolled: enrolledCourseIds.has(course.id)
    }));
  }

  /**
   * Получить курсы пользователя
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<Array>} Список курсов
   */
  async getUserCourses(userId, userRole) {
    if (userRole === 'STUDENT') {
      return courseRepository.findByStudent(userId);
    } else if (userRole === 'TEACHER') {
      return courseRepository.findByTeacher(userId);
    }
    throw new Error('Invalid role');
  }

  /**
   * Получить курс по ID
   * @param {string} courseId - ID курса
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<object>} Курс
   */
  async getCourseById(courseId, userId, userRole) {
    const course = await courseRepository.findByIdWithTeacher(courseId);

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
   * Создать курс
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные курса
   * @returns {Promise<object>} Созданный курс
   */
  async createCourse(teacherId, data) {
    return courseRepository.create({
      ...data,
      teacherId,
      isPrivate: data.isPrivate || false,
      allowedEmails: data.isPrivate ? data.allowedEmails : null
    }, {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    });
  }

  /**
   * Обновить курс
   * @param {string} courseId - ID курса
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные для обновления
   * @returns {Promise<object>} Обновленный курс
   */
  async updateCourse(courseId, teacherId, data) {
    const course = await courseRepository.findById(courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    if (course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isPrivate !== undefined) {
      updateData.isPrivate = data.isPrivate;
      updateData.allowedEmails = data.isPrivate ? data.allowedEmails : null;
    } else if (data.allowedEmails !== undefined) {
      updateData.allowedEmails = course.isPrivate ? data.allowedEmails : null;
    }

    // Если курс становится приватным, добавляем студентов
    if (data.isPrivate === true && data.allowedEmails) {
      const emails = data.allowedEmails.split(',').map(e => e.trim()).filter(e => e);
      for (const email of emails) {
        const student = await userRepository.findStudentByEmail(email);
        if (student) {
          await courseRepository.createEnrollment(student.id, courseId);
        }
      }
    }

    return courseRepository.update(courseId, updateData, {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    });
  }

  /**
   * Добавить студента в курс
   * @param {string} courseId - ID курса
   * @param {string} teacherId - ID преподавателя
   * @param {string} studentEmail - Email студента
   * @returns {Promise<object>} Запись о записи
   */
  async enrollStudent(courseId, teacherId, studentEmail) {
    const course = await courseRepository.findById(courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    if (course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const student = await userRepository.findStudentByEmail(studentEmail);

    if (!student) {
      throw new Error('Student not found');
    }

    const existingEnrollment = await courseRepository.findEnrollment(student.id, courseId);
    if (existingEnrollment) {
      throw new Error('Student already enrolled');
    }

    return courseRepository.createEnrollment(student.id, courseId);
  }
}

module.exports = new CourseService();

