const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

/**
 * Репозиторий для работы с тестами
 * @class TestRepository
 * @extends BaseRepository
 */
class TestRepository extends BaseRepository {
  constructor() {
    super('test');
  }

  /**
   * Получить тесты курса
   * @param {string} courseId - ID курса
   * @returns {Promise<Array>}
   */
  async findByCourse(courseId) {
    return prisma.test.findMany({
      where: { courseId },
      include: {
        _count: {
          select: {
            questions: true,
            attempts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Получить тест с вопросами и ответами
   * @param {string} testId - ID теста
   * @returns {Promise<object|null>}
   */
  async findByIdWithQuestions(testId) {
    return prisma.test.findUnique({
      where: { id: testId },
      include: {
        course: true,
        questions: {
          include: {
            answers: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });
  }

  /**
   * Найти попытку студента
   * @param {string} testId - ID теста
   * @param {string} studentId - ID студента
   * @returns {Promise<object|null>}
   */
  async findAttempt(testId, studentId) {
    return prisma.testAttempt.findFirst({
      where: {
        testId,
        studentId
      },
      orderBy: { startedAt: 'desc' }
    });
  }

  /**
   * Создать попытку теста
   * @param {object} data - Данные попытки
   * @returns {Promise<object>}
   */
  async createAttempt(data) {
    return prisma.testAttempt.create({
      data
    });
  }

  /**
   * Обновить попытку теста
   * @param {string} attemptId - ID попытки
   * @param {object} data - Данные для обновления
   * @returns {Promise<object>}
   */
  async updateAttempt(attemptId, data) {
    return prisma.testAttempt.update({
      where: { id: attemptId },
      data,
      include: {
        answers: {
          include: {
            question: {
              include: {
                answers: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Получить попытку с ответами
   * @param {string} attemptId - ID попытки
   * @returns {Promise<object|null>}
   */
  async findAttemptById(attemptId) {
    return prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            course: true,
            questions: {
              include: {
                answers: true
              }
            }
          }
        },
        answers: {
          include: {
            question: {
              include: {
                answers: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Создать ответы на вопросы
   * @param {Array} answers - Массив ответов
   * @returns {Promise<Array>}
   */
  async createAnswers(answers) {
    return prisma.testAttemptAnswer.createMany({
      data: answers
    });
  }
}

module.exports = new TestRepository();

