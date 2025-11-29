const testRepository = require('../repositories/testRepository');
const courseRepository = require('../repositories/courseRepository');
const prisma = require('../config/database');

/**
 * Сервис для работы с тестами
 * @class TestService
 */
class TestService {
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
   * Получить тесты курса
   * @param {string} courseId - ID курса
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<Array>} Список тестов
   */
  async getCourseTests(courseId, userId, userRole) {
    await this.checkCourseAccess(courseId, userId, userRole);

    const tests = await testRepository.findByCourse(courseId);

    // Для студентов добавляем статус попытки
    if (userRole === 'STUDENT') {
      const testsWithAttempts = await Promise.all(
        tests.map(async (test) => {
          const attempt = await testRepository.findAttempt(test.id, userId);
          return {
            ...test,
            myAttempt: attempt || null
          };
        })
      );

      return testsWithAttempts;
    }

    return tests;
  }

  /**
   * Получить тест по ID
   * @param {string} testId - ID теста
   * @param {string} userId - ID пользователя
   * @param {string} userRole - Роль пользователя
   * @returns {Promise<object>} Тест
   */
  async getTestById(testId, userId, userRole) {
    const test = await testRepository.findByIdWithQuestions(testId);

    if (!test) {
      throw new Error('Test not found');
    }

    await this.checkCourseAccess(test.courseId, userId, userRole);

    // Для студентов скрываем правильные ответы
    if (userRole === 'STUDENT') {
      return {
        ...test,
        questions: test.questions.map(q => ({
          ...q,
          answers: q.answers.map(a => ({
            id: a.id,
            text: a.text,
            order: a.order,
            matchKey: a.matchKey
            // isCorrect скрыт
          }))
        }))
      };
    }

    return test;
  }

  /**
   * Создать тест
   * @param {string} courseId - ID курса
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные теста
   * @returns {Promise<object>} Созданный тест
   */
  async createTest(courseId, teacherId, data) {
    await this.checkCourseAccess(courseId, teacherId, 'TEACHER');

    return testRepository.create({
      courseId,
      title: data.title,
      description: data.description,
      maxScore: data.maxScore ? parseInt(data.maxScore) : 100,
      timeLimit: data.timeLimit ? parseInt(data.timeLimit) : null
    }, {
      questions: true
    });
  }

  /**
   * Добавить вопрос к тесту
   * @param {string} testId - ID теста
   * @param {string} teacherId - ID преподавателя
   * @param {object} data - Данные вопроса
   * @returns {Promise<object>} Созданный вопрос
   */
  async addQuestion(testId, teacherId, data) {
    const test = await testRepository.findById(testId, {
      course: true
    });

    if (!test || test.course.teacherId !== teacherId) {
      throw new Error('Access denied');
    }

    const question = await prisma.question.create({
      data: {
        testId,
        type: data.type,
        question: data.question,
        points: data.points ? parseInt(data.points) : 1,
        order: data.order ? parseInt(data.order) : 0
      }
    });

    // Создать ответы
    const answerData = data.answers.map((answer, index) => ({
      questionId: question.id,
      text: answer.text,
      isCorrect: answer.isCorrect || false,
      order: answer.order !== undefined ? answer.order : index,
      matchKey: answer.matchKey || null
    }));

    await prisma.answer.createMany({
      data: answerData
    });

    return prisma.question.findUnique({
      where: { id: question.id },
      include: { answers: true }
    });
  }

  /**
   * Начать попытку теста
   * @param {string} testId - ID теста
   * @param {string} studentId - ID студента
   * @returns {Promise<object>} Попытка теста
   */
  async startAttempt(testId, studentId) {
    const test = await testRepository.findById(testId, {
      course: true
    });

    if (!test) {
      throw new Error('Test not found');
    }

    // Проверка записи на курс
    const enrollment = await courseRepository.findEnrollment(studentId, test.courseId);
    if (!enrollment) {
      throw new Error('Access denied');
    }

    // Проверка незавершенной попытки
    const existingAttempt = await testRepository.findAttempt(testId, studentId);
    if (existingAttempt && !existingAttempt.completedAt) {
      return existingAttempt;
    }

    return testRepository.createAttempt({
      testId,
      studentId,
      maxScore: test.maxScore
    });
  }

  /**
   * Отправить ответы на тест
   * @param {string} testId - ID теста
   * @param {string} attemptId - ID попытки
   * @param {string} studentId - ID студента
   * @param {Array} answers - Массив ответов
   * @returns {Promise<object>} Результат попытки
   */
  async submitTest(testId, attemptId, studentId, answers) {
    const test = await testRepository.findByIdWithQuestions(testId);

    if (!test) {
      throw new Error('Test not found');
    }

    const attempt = await testRepository.findAttemptById(attemptId);

    if (!attempt || attempt.testId !== testId || attempt.studentId !== studentId) {
      throw new Error('Access denied');
    }

    if (attempt.completedAt) {
      throw new Error('Test already completed');
    }

    let totalScore = 0;
    const answerRecords = [];

    // Проверка каждого ответа
    for (const answer of answers) {
      const question = test.questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      let isCorrect = false;
      let points = 0;

      if (question.type === 'multiple_choice') {
        const selectedAnswer = question.answers.find(a => a.id === answer.answerIds[0]);
        if (selectedAnswer && selectedAnswer.isCorrect) {
          isCorrect = true;
          points = question.points;
        }
      } else if (question.type === 'true_false') {
        const correctAnswer = question.answers.find(a => a.isCorrect);
        if (correctAnswer && answer.answerIds.includes(correctAnswer.id)) {
          isCorrect = true;
          points = question.points;
        }
      } else if (question.type === 'matching') {
        const correctPairs = question.answers.filter(a => a.isCorrect);
        const selectedPairs = answer.answerIds.map(aid => {
          const ans = question.answers.find(a => a.id === aid);
          return ans ? { id: ans.id, matchKey: ans.matchKey } : null;
        }).filter(Boolean);

        if (selectedPairs.length === correctPairs.length) {
          const allCorrect = selectedPairs.every(sp => 
            correctPairs.some(cp => cp.id === sp.id && cp.matchKey === sp.matchKey)
          );
          if (allCorrect) {
            isCorrect = true;
            points = question.points;
          }
        }
      }

      totalScore += points;

      answerRecords.push({
        attemptId,
        questionId: question.id,
        answerIds: answer.answerIds,
        isCorrect,
        points
      });
    }

    // Создать записи ответов
    await testRepository.createAnswers(answerRecords);

    // Обновить попытку
    return testRepository.updateAttempt(attemptId, {
      score: totalScore,
      completedAt: new Date()
    });
  }
}

module.exports = new TestService();

