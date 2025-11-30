const homeworkRepository = require('../repositories/homeworkRepository');
const groupRepository = require('../repositories/groupRepository');
const gradeRecordService = require('./gradeRecordService');
const prisma = require('../config/database');

class HomeworkService {
  /**
   * Получить домашние задания группы
   * @param {string} groupId - ID группы
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<Array>}
   */
  async getGroupHomeworks(groupId, userId, userRole) {
    const hasAccess = await groupRepository.isMember(groupId, userId, userRole);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return homeworkRepository.findByGroup(groupId);
  }

  /**
   * Получить детали домашнего задания
   * @param {string} homeworkId - ID домашнего задания
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<object>}
   */
  async getHomeworkDetails(homeworkId, userId, userRole) {
    const homework = await homeworkRepository.findByIdWithDetails(homeworkId);
    if (!homework) {
      throw new Error('Homework not found');
    }

    const hasAccess = await groupRepository.isMember(homework.groupId, userId, userRole);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return homework;
  }

  /**
   * Нормализовать дату в ISO-8601 формат для Prisma
   * @param {string|null} dateString - Дата в формате datetime-local или ISO
   * @returns {Date|null}
   */
  normalizeDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Если дата уже в правильном формате ISO-8601 с Z или +, используем как есть
      if (dateString.includes('Z') || (dateString.includes('+') && dateString.length > 19)) {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Если дата в формате datetime-local (YYYY-MM-DDTHH:mm или YYYY-MM-DDTHH:mm:ss)
      if (dateString.includes('T')) {
        // Добавляем секунды если их нет
        let normalized = dateString;
        const parts = normalized.split('T');
        if (parts.length === 2) {
          const timePart = parts[1];
          const timeParts = timePart.split(':');
          if (timeParts.length === 2) {
            // Добавляем секунды
            normalized = parts[0] + 'T' + timePart + ':00';
          }
        }
        
        // Создаем Date объект из локального времени
        // Prisma принимает Date объекты и преобразует их в ISO-8601
        const date = new Date(normalized);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      
      // Пробуем создать Date из строки
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      console.warn('Invalid date format:', dateString);
      return null;
    } catch (error) {
      console.error('Error normalizing date:', dateString, error);
      return null;
    }
  }

  /**
   * Создать домашнее задание
   * @param {string} groupId - ID группы
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные домашнего задания
   * @returns {Promise<object>}
   */
  async createHomework(groupId, teacherId, data) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    return homeworkRepository.create({
      title: data.title,
      description: data.description,
      instructions: data.instructions || null,
      requirements: data.requirements || null,
      resources: data.resources || null,
      dueDate: this.normalizeDate(data.dueDate),
      maxScore: data.maxScore || 100,
      difficulty: data.difficulty || 'MEDIUM',
      groupId
    });
  }

  /**
   * Обновить домашнее задание
   * @param {string} homeworkId - ID домашнего задания
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные для обновления
   * @returns {Promise<object>}
   */
  async updateHomework(homeworkId, teacherId, data) {
    const homework = await homeworkRepository.findById(homeworkId);
    if (!homework) {
      throw new Error('Homework not found');
    }

    const group = await groupRepository.findById(homework.groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const updateData = { ...data };
    if (updateData.dueDate !== undefined) {
      updateData.dueDate = this.normalizeDate(updateData.dueDate);
    }

    return homeworkRepository.update(homeworkId, updateData);
  }

  /**
   * Удалить домашнее задание
   * @param {string} homeworkId - ID домашнего задания
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<void>}
   */
  async deleteHomework(homeworkId, teacherId) {
    const homework = await homeworkRepository.findById(homeworkId);
    if (!homework) {
      throw new Error('Homework not found');
    }

    const group = await groupRepository.findById(homework.groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    return homeworkRepository.delete(homeworkId);
  }

  /**
   * Отправить домашнее задание
   * @param {string} homeworkId - ID домашнего задания
   * @param {string} studentId - ID студента
   * @param {string} fileUrl - URL файла
   * @returns {Promise<object>}
   */
  async submitHomework(homeworkId, studentId, fileUrl) {
    const homework = await homeworkRepository.findById(homeworkId);
    if (!homework) {
      throw new Error('Homework not found');
    }

    // Проверяем, является ли студент участником группы
    const hasAccess = await groupRepository.isMember(homework.groupId, studentId, 'STUDENT');
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    // Проверяем, можно ли еще отправлять
    if (!homework.isActive) {
      throw new Error('Homework is closed');
    }

    // Проверяем, есть ли уже отправка
    const existingSubmission = await homeworkRepository.findSubmission(homeworkId, studentId);
    
    if (existingSubmission) {
      // Обновляем существующую отправку
      return homeworkRepository.updateSubmission(existingSubmission.id, {
        fileUrl,
        status: 'SUBMITTED',
        updatedAt: new Date()
      });
    } else {
      // Создаем новую отправку
      return homeworkRepository.createSubmission({
        homeworkId,
        studentId,
        fileUrl,
        status: 'SUBMITTED'
      });
    }
  }

  /**
   * Оценить домашнее задание
   * @param {string} submissionId - ID отправки
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные оценки
   * @returns {Promise<object>}
   */
  async gradeHomework(submissionId, teacherId, data) {
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: {
        homework: {
          include: {
            group: true
          }
        }
      }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    const group = submission.homework.group;
    if (group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    // Проверяем, есть ли уже оценка
    const existingGrade = await prisma.homeworkGrade.findUnique({
      where: { submissionId }
    });

    if (existingGrade) {
      // Обновляем существующую оценку
      await homeworkRepository.updateGrade(submissionId, {
        ...data,
        gradedBy: teacherId
      });
    } else {
      // Создаем новую оценку
      await homeworkRepository.createGrade({
        submissionId,
        studentId: submission.studentId,
        ...data,
        gradedBy: teacherId
      });
    }

    // Обновляем статус отправки
    await homeworkRepository.updateSubmission(submissionId, {
      status: 'GRADED'
    });

    // Создаем запись успеваемости
    try {
      await gradeRecordService.createGradeRecordFromGrade(
        submission.studentId,
        submission.homework.groupId,
        'HOMEWORK',
        submission.homeworkId,
        data.score,
        data.maxScore || submission.homework.maxScore,
        teacherId,
        'PRESENT'
      );
    } catch (error) {
      console.error('Failed to create grade record:', error);
      // Не прерываем выполнение, если не удалось создать запись
    }

    return homeworkRepository.findSubmission(submission.homeworkId, submission.studentId);
  }

  /**
   * Закрыть/открыть домашнее задание
   * @param {string} homeworkId - ID домашнего задания
   * @param {string} teacherId - ID преподавателя
   * @param {boolean} isActive - Активно ли задание
   * @returns {Promise<object>}
   */
  async setHomeworkActive(homeworkId, teacherId, isActive) {
    const homework = await homeworkRepository.findById(homeworkId);
    if (!homework) {
      throw new Error('Homework not found');
    }

    const group = await groupRepository.findById(homework.groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    return homeworkRepository.update(homeworkId, { isActive });
  }

  /**
   * Добавить комментарий к отправке ДЗ
   * @param {string} submissionId - ID отправки
   * @param {string} authorId - ID автора
   * @param {string} content - Содержимое комментария
   * @returns {Promise<object>} Созданный комментарий
   */
  async addComment(submissionId, authorId, content) {
    const prisma = require('../config/database');
    const submission = await prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: {
        homework: {
          include: {
            group: true
          }
        }
      }
    });

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Проверка доступа
    if (submission.studentId !== authorId && 
        submission.homework.group.teacherId !== authorId) {
      throw new Error('Access denied');
    }

    return prisma.homeworkComment.create({
      data: {
        submissionId,
        authorId,
        content
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  /**
   * Обновить комментарий к отправке ДЗ
   * @param {string} submissionId - ID отправки
   * @param {string} commentId - ID комментария
   * @param {string} userId - ID пользователя
   * @param {string} content - Новое содержимое комментария
   * @returns {Promise<object>} Обновленный комментарий
   */
  async updateComment(submissionId, commentId, userId, content) {
    const prisma = require('../config/database');
    const comment = await prisma.homeworkComment.findUnique({
      where: { id: commentId },
      include: {
        submission: {
          include: {
            homework: {
              include: {
                group: true
              }
            }
          }
        }
      }
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    // Проверка доступа - только автор может изменить комментарий
    if (comment.authorId !== userId) {
      throw new Error('Access denied');
    }

    return prisma.homeworkComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }
}

module.exports = new HomeworkService();

