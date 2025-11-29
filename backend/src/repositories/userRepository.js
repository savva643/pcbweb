const BaseRepository = require('./baseRepository');
const prisma = require('../config/database');

/**
 * Репозиторий для работы с пользователями
 * @class UserRepository
 * @extends BaseRepository
 */
class UserRepository extends BaseRepository {
  constructor() {
    super('user');
  }

  /**
   * Найти пользователя по email
   * @param {string} email - Email пользователя
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email }
    });
  }

  /**
   * Найти студента по email
   * @param {string} email - Email студента
   * @returns {Promise<object|null>}
   */
  async findStudentByEmail(email) {
    return prisma.user.findFirst({
      where: {
        email,
        role: 'STUDENT'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });
  }
}

module.exports = new UserRepository();

