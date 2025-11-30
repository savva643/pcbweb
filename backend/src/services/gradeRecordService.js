const gradeRecordRepository = require('../repositories/gradeRecordRepository');
const groupRepository = require('../repositories/groupRepository');
const prisma = require('../config/database');

class GradeRecordService {
  /**
   * Получить успеваемость студента в группе
   * @param {string} studentId - ID студента
   * @param {string} groupId - ID группы
   * @param {number} year - Год
   * @param {number} month - Месяц (1-12)
   * @param {string} userId - ID пользователя (для проверки доступа)
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<Array>}
   */
  async getStudentGrades(studentId, groupId, year, month, userId, userRole) {
    // Проверка доступа
    if (userRole === 'STUDENT' && studentId !== userId) {
      throw new Error('Access denied');
    }
    if (userRole === 'TEACHER') {
      const hasAccess = await groupRepository.isMember(groupId, userId, userRole);
      if (!hasAccess) {
        throw new Error('Access denied');
      }
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return gradeRecordRepository.getStudentGrades(studentId, groupId, startDate, endDate);
  }

  /**
   * Получить успеваемость всех студентов группы
   * @param {string} groupId - ID группы
   * @param {number} year - Год
   * @param {number} month - Месяц (1-12)
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<Array>}
   */
  async getGroupGrades(groupId, year, month, teacherId) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const records = await gradeRecordRepository.getGroupGrades(groupId, startDate, endDate);
    
    // Группируем по студентам и датам
    const grouped = {};
    records.forEach(record => {
      const dateKey = record.gradeDate.toISOString().split('T')[0];
      if (!grouped[record.studentId]) {
        grouped[record.studentId] = {
          student: record.student,
          grades: {}
        };
      }
      if (!grouped[record.studentId].grades[dateKey]) {
        grouped[record.studentId].grades[dateKey] = [];
      }
      grouped[record.studentId].grades[dateKey].push(record);
    });

    return Object.values(grouped);
  }

  /**
   * Получить успеваемость по курсу/ДЗ/тесту
   * @param {string} groupId - ID группы
   * @param {string} gradeType - Тип оценки
   * @param {string} relatedId - ID связанного объекта
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<Array>}
   */
  async getGradesByRelated(groupId, gradeType, relatedId, teacherId) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    return gradeRecordRepository.getGradesByRelated(groupId, gradeType, relatedId);
  }

  /**
   * Создать или обновить запись успеваемости
   * @param {string} groupId - ID группы
   * @param {object} data - Данные записи
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<object>}
   */
  async upsertGradeRecord(groupId, data, teacherId) {
    const group = await groupRepository.findById(groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    return gradeRecordRepository.upsertGradeRecord({
      ...data,
      groupId,
      gradedBy: teacherId
    });
  }

  /**
   * Удалить запись успеваемости
   * @param {string} recordId - ID записи
   * @param {string} teacherId - ID преподавателя
   * @returns {Promise<void>}
   */
  async deleteGradeRecord(recordId, teacherId) {
    const record = await gradeRecordRepository.findById(recordId);
    if (!record) {
      throw new Error('Record not found');
    }

    const group = await groupRepository.findById(record.groupId);
    if (!group || group.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    return gradeRecordRepository.deleteGradeRecord(recordId);
  }

  /**
   * Получить статистику студента в группе
   * @param {string} studentId - ID студента
   * @param {string} groupId - ID группы
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<object>}
   */
  async getStudentStats(studentId, groupId, userId, userRole) {
    // Проверка доступа
    if (userRole === 'STUDENT' && studentId !== userId) {
      throw new Error('Access denied');
    }
    if (userRole === 'TEACHER') {
      const hasAccess = await groupRepository.isMember(groupId, userId, userRole);
      if (!hasAccess) {
        throw new Error('Access denied');
      }
    }

    return gradeRecordRepository.getStudentStats(studentId, groupId);
  }

  /**
   * Создать запись успеваемости при выставлении оценки
   * @param {string} studentId - ID студента
   * @param {string} groupId - ID группы
   * @param {string} gradeType - Тип оценки
   * @param {string} relatedId - ID связанного объекта
   * @param {number} score - Оценка
   * @param {number} maxScore - Максимальная оценка
   * @param {string} teacherId - ID преподавателя
   * @param {string} status - Статус посещения
   * @returns {Promise<object>}
   */
  async createGradeRecordFromGrade(studentId, groupId, gradeType, relatedId, score, maxScore, teacherId, status = 'PRESENT') {
    return gradeRecordRepository.upsertGradeRecord({
      studentId,
      groupId,
      gradeDate: new Date(),
      gradeType,
      relatedId,
      score,
      maxScore,
      status,
      gradedBy: teacherId
    });
  }
}

module.exports = new GradeRecordService();

