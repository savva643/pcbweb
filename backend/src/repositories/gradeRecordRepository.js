const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

class GradeRecordRepository extends BaseRepository {
  constructor() {
    super('studentGradeRecord');
  }

  /**
   * Получить успеваемость студента в группе за период
   * @param {string} studentId - ID студента
   * @param {string} groupId - ID группы
   * @param {Date} startDate - Начало периода
   * @param {Date} endDate - Конец периода
   * @returns {Promise<Array>}
   */
  async getStudentGrades(studentId, groupId, startDate, endDate) {
    return prisma.studentGradeRecord.findMany({
      where: {
        studentId,
        groupId,
        gradeDate: {
          gte: startDate,
          lte: endDate
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
        }
      },
      orderBy: { gradeDate: 'asc' }
    });
  }

  /**
   * Получить успеваемость всех студентов группы за период
   * @param {string} groupId - ID группы
   * @param {Date} startDate - Начало периода
   * @param {Date} endDate - Конец периода
   * @returns {Promise<Array>}
   */
  async getGroupGrades(groupId, startDate, endDate) {
    return prisma.studentGradeRecord.findMany({
      where: {
        groupId,
        gradeDate: {
          gte: startDate,
          lte: endDate
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
        }
      },
      orderBy: [
        { student: { lastName: 'asc' } },
        { gradeDate: 'asc' }
      ]
    });
  }

  /**
   * Получить успеваемость по конкретному курсу/ДЗ/тесту
   * @param {string} groupId - ID группы
   * @param {string} gradeType - Тип оценки
   * @param {string} relatedId - ID связанного объекта
   * @returns {Promise<Array>}
   */
  async getGradesByRelated(groupId, gradeType, relatedId) {
    return prisma.studentGradeRecord.findMany({
      where: {
        groupId,
        gradeType,
        relatedId
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { student: { lastName: 'asc' } }
    });
  }

  /**
   * Создать или обновить запись успеваемости
   * @param {object} data - Данные записи
   * @returns {Promise<object>}
   */
  async upsertGradeRecord(data) {
    const { studentId, groupId, gradeDate, gradeType, relatedId } = data;
    const date = new Date(gradeDate);
    date.setHours(0, 0, 0, 0);
    
    // Ищем существующую запись
    const existing = await prisma.studentGradeRecord.findFirst({
      where: {
        studentId,
        groupId,
        gradeDate: {
          gte: date,
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
        },
        gradeType,
        relatedId
      }
    });

    if (existing) {
      return prisma.studentGradeRecord.update({
        where: { id: existing.id },
        data: {
          score: data.score,
          maxScore: data.maxScore,
          status: data.status,
          feedback: data.feedback,
          gradedBy: data.gradedBy,
          updatedAt: new Date()
        }
      });
    } else {
      return prisma.studentGradeRecord.create({
        data: {
          ...data,
          gradeDate: date
        }
      });
    }
  }

  /**
   * Удалить запись успеваемости
   * @param {string} id - ID записи
   * @returns {Promise<object>}
   */
  async deleteGradeRecord(id) {
    return prisma.studentGradeRecord.delete({
      where: { id }
    });
  }

  /**
   * Получить статистику студента в группе
   * @param {string} studentId - ID студента
   * @param {string} groupId - ID группы
   * @returns {Promise<object>}
   */
  async getStudentStats(studentId, groupId) {
    const records = await prisma.studentGradeRecord.findMany({
      where: {
        studentId,
        groupId
      }
    });

    const courses = records.filter(r => r.gradeType === 'COURSE');
    const homeworks = records.filter(r => r.gradeType === 'HOMEWORK');
    const tests = records.filter(r => r.gradeType === 'TEST');

    const calculateStats = (items) => {
      const completed = items.filter(i => i.score !== null);
      const totalScore = completed.reduce((sum, i) => sum + (i.score || 0), 0);
      const maxTotalScore = completed.reduce((sum, i) => sum + i.maxScore, 0);
      const average = completed.length > 0 ? (totalScore / maxTotalScore) * 100 : 0;

      return {
        total: items.length,
        completed: completed.length,
        average: average.toFixed(2),
        totalScore,
        maxTotalScore
      };
    };

    return {
      courses: calculateStats(courses),
      homeworks: calculateStats(homeworks),
      tests: calculateStats(tests),
      overall: calculateStats(records)
    };
  }
}

module.exports = new GradeRecordRepository();

