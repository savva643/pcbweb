const submissionRepository = require('../repositories/submissionRepository');
const assignmentRepository = require('../repositories/assignmentRepository');
const gradeRepository = require('../repositories/gradeRepository');
const commentRepository = require('../repositories/commentRepository');
const courseRepository = require('../repositories/courseRepository');

/**
 * Сервис для работы с отправками заданий
 * @class SubmissionService
 */
class SubmissionService {
  /**
   * Отправить задание
   * @param {string} assignmentId - ID задания
   * @param {string} studentId - ID студента
   * @param {string} fileUrl - URL файла
   * @param {string} [comment] - Комментарий к версии
   * @returns {Promise<object>} Созданная/обновленная отправка
   */
  async submitAssignment(assignmentId, studentId, fileUrl, comment = null) {
    const assignment = await assignmentRepository.findByIdWithCourse(assignmentId);

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    // Проверка записи на курс
    const enrollment = await courseRepository.findEnrollment(studentId, assignment.courseId);
    if (!enrollment) {
      throw new Error('Access denied');
    }

    // Проверка существующей отправки
    const existingSubmission = await submissionRepository.findByAssignmentAndStudent(
      assignmentId,
      studentId
    );

    let submission;
    if (existingSubmission) {
      // Обновить существующую отправку
      submission = await submissionRepository.update(existingSubmission.id, {
        fileUrl,
        status: 'SUBMITTED'
      }, {
        assignment: true,
        grade: true
      });

      // Создать новую версию
      const latestVersion = await submissionRepository.findLatestVersion(existingSubmission.id);
      const nextVersion = (latestVersion?.version || 0) + 1;

      await submissionRepository.createVersion({
        submissionId: existingSubmission.id,
        version: nextVersion,
        fileUrl,
        comment
      });
    } else {
      // Создать новую отправку
      submission = await submissionRepository.create({
        assignmentId,
        studentId,
        fileUrl,
        status: 'SUBMITTED'
      }, {
        assignment: true,
        grade: true
      });

      // Создать начальную версию
      await submissionRepository.createVersion({
        submissionId: submission.id,
        version: 1,
        fileUrl,
        comment
      });
    }

    return submission;
  }

  /**
   * Выставить оценку
   * @param {string} submissionId - ID отправки
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные оценки
   * @returns {Promise<object>} Оценка
   */
  async gradeSubmission(submissionId, teacherId, data) {
    const submission = await submissionRepository.findById(submissionId, {
      assignment: {
        course: true
      }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (submission.assignment.course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const grade = await gradeRepository.upsertGrade(submissionId, {
      studentId: submission.studentId,
      score: parseInt(data.score),
      maxScore: data.maxScore || submission.assignment.maxScore,
      feedback: data.feedback,
      gradedBy: teacherId
    });

    await submissionRepository.update(submissionId, {
      status: 'GRADED'
    });

    return grade;
  }

  /**
   * Получить отправки по заданию
   * @param {string} assignmentId - ID задания
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<Array>} Список отправок
   */
  async getAssignmentSubmissions(assignmentId, teacherId) {
    const assignment = await assignmentRepository.findByIdWithCourse(assignmentId);

    if (!assignment || assignment.course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    return submissionRepository.findByAssignment(assignmentId);
  }

  /**
   * Получить версии отправки
   * @param {string} submissionId - ID отправки
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<Array>} Список версий
   */
  async getSubmissionVersions(submissionId, userId, userRole) {
    const submission = await submissionRepository.findById(submissionId, {
      assignment: {
        course: true
      }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    if (userRole === 'STUDENT' && submission.studentId !== userId) {
      throw new Error('Access denied');
    }

    if (userRole === 'TEACHER' && submission.assignment.course.teacherId !== userId) {
      throw new Error('Access denied');
    }

    return submissionRepository.findVersions(submissionId);
  }

  /**
   * Добавить комментарий
   * @param {string} submissionId - ID отправки
   * @param {string} authorId - ID автора
   * @param {string} content - Содержимое комментария
   * @returns {Promise<object>} Созданный комментарий
   */
  async addComment(submissionId, authorId, content) {
    const submission = await submissionRepository.findById(submissionId, {
      assignment: {
        course: true
      }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Проверка доступа
    if (submission.studentId !== authorId && 
        submission.assignment.course.teacherId !== authorId) {
      throw new Error('Access denied');
    }

    return commentRepository.create({
      submissionId,
      authorId,
      content
    }, {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    });
  }
}

module.exports = new SubmissionService();

