const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Сервис для аутентификации
 * @class AuthService
 */
class AuthService {
  /**
   * Регистрация пользователя
   * @param {object} data - Данные пользователя
   * @param {string} data.email - Email
   * @param {string} data.password - Пароль
   * @param {string} data.firstName - Имя
   * @param {string} data.lastName - Фамилия
   * @param {string} data.role - Роль (STUDENT или TEACHER)
   * @returns {Promise<object>} Пользователь и токен
   */
  async register(data) {
    const existingUser = await userRepository.findByEmail(data.email);

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await userRepository.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role.toUpperCase()
    }, {});

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    };
  }

  /**
   * Вход пользователя
   * @param {string} email - Email
   * @param {string} password - Пароль
   * @returns {Promise<object>} Пользователь и токен
   */
  async login(email, password) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    };
  }
}

module.exports = new AuthService();

