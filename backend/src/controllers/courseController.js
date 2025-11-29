const courseRepository = require('../repositories/courseRepository');
const userRepository = require('../repositories/userRepository');
const prisma = require('../config/database');
const { validationResult } = require('express-validator');

/**
 * Контроллер для работы с курсами
 * @class CourseController
 */
class CourseController {
  /**
   * Получить доступные курсы (для студентов)
   * @route GET /api/courses/available
   */
  async getAvailableCourses(req, res) {
    try {
      const allCourses = await courseRepository.findAvailableForStudent(req.user.email);

      const enrollments = await prisma.courseEnrollment.findMany({
        where: { studentId: req.user.id },
        select: { courseId: true }
      });

      const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

      const coursesWithEnrollment = allCourses.map(course => ({
        ...course,
        isEnrolled: enrolledCourseIds.has(course.id)
      }));

      res.json(coursesWithEnrollment);
    } catch (error) {
      console.error('Get available courses error:', error);
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  }

  /**
   * Получить курсы пользователя
   * @route GET /api/courses
   */
  async getCourses(req, res) {
    try {
      let courses;

      if (req.user.role === 'STUDENT') {
        courses = await courseRepository.findByStudent(req.user.id);
      } else if (req.user.role === 'TEACHER') {
        courses = await courseRepository.findByTeacher(req.user.id);
      } else {
        return res.status(403).json({ error: 'Invalid role' });
      }

      res.json(courses);
    } catch (error) {
      console.error('Get courses error:', error);
      res.status(500).json({ error: 'Failed to fetch courses' });
    }
  }

  /**
   * Получить курс по ID
   * @route GET /api/courses/:id
   */
  async getCourseById(req, res) {
    try {
      const { id } = req.params;

      const course = await courseRepository.findByIdWithTeacher(id);

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      // Проверка доступа
      if (req.user.role === 'STUDENT') {
        const enrollment = await courseRepository.findEnrollment(req.user.id, id);
        if (!enrollment) {
          return res.status(403).json({ error: 'Access denied' });
        }
      } else if (req.user.role === 'TEACHER' && course.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Добавить материалы и задания
      const courseWithDetails = await prisma.course.findUnique({
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
            orderBy: { order: 'asc' }
          },
          assignments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      res.json(courseWithDetails);
    } catch (error) {
      console.error('Get course error:', error);
      res.status(500).json({ error: 'Failed to fetch course' });
    }
  }

  /**
   * Создать курс
   * @route POST /api/courses
   */
  async createCourse(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, isPrivate, allowedEmails } = req.body;

      const course = await courseRepository.create({
        title,
        description,
        teacherId: req.user.id,
        isPrivate: isPrivate || false,
        allowedEmails: isPrivate ? allowedEmails : null
      }, {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      });

      res.status(201).json(course);
    } catch (error) {
      console.error('Create course error:', error);
      res.status(500).json({ error: 'Failed to create course' });
    }
  }

  /**
   * Обновить курс
   * @route PUT /api/courses/:id
   */
  async updateCourse(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, description, isPrivate, allowedEmails } = req.body;

      const course = await courseRepository.findById(id);

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      if (course.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (isPrivate !== undefined) {
        updateData.isPrivate = isPrivate;
        updateData.allowedEmails = isPrivate ? allowedEmails : null;
      } else if (allowedEmails !== undefined) {
        updateData.allowedEmails = course.isPrivate ? allowedEmails : null;
      }

      // Если курс становится приватным, записать студентов из allowedEmails
      if (isPrivate === true && allowedEmails) {
        const emails = allowedEmails.split(',').map(e => e.trim()).filter(e => e);
        
        const students = await prisma.user.findMany({
          where: {
            email: { in: emails },
            role: 'STUDENT'
          }
        });

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

      const updatedCourse = await courseRepository.update(id, updateData, {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      });

      res.json(updatedCourse);
    } catch (error) {
      console.error('Update course error:', error);
      res.status(500).json({ error: 'Failed to update course' });
    }
  }

  /**
   * Записаться на курс (для студентов)
   * @route POST /api/courses/:id/enroll
   */
  async enrollInCourse(req, res) {
    try {
      const { id } = req.params;

      const course = await courseRepository.findById(id);

      if (!course) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const existingEnrollment = await courseRepository.findEnrollment(req.user.id, id);

      if (existingEnrollment) {
        return res.status(400).json({ error: 'Already enrolled' });
      }

      const enrollment = await courseRepository.createEnrollment(req.user.id, id);

      res.status(201).json(enrollment);
    } catch (error) {
      console.error('Enroll error:', error);
      res.status(500).json({ error: 'Failed to enroll' });
    }
  }

  /**
   * Добавить студента на курс (для преподавателей)
   * @route POST /api/courses/:id/enroll-student
   */
  async enrollStudent(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { studentEmail } = req.body;

      const course = await courseRepository.findById(id);

      if (!course || course.teacherId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const student = await userRepository.findStudentByEmail(studentEmail);

      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const existingEnrollment = await courseRepository.findEnrollment(student.id, id);

      if (existingEnrollment) {
        return res.status(400).json({ error: 'Student already enrolled' });
      }

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
  }
}

module.exports = new CourseController();
