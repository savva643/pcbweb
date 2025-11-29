const authService = require('../services/authService');
const { validationResult } = require('express-validator');

/**
 * Контроллер для аутентификации
 * @class AuthController
 */
class AuthController {
  /**
   * Регистрация
   * @route POST /api/auth/register
   */
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Registration error:', error);
      if (error.message === 'User already exists') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  /**
   * Вход
   * @route POST /api/auth/login
   */
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.login(req.body.email, req.body.password);
      res.json(result);
    } catch (error) {
      console.error('Login error:', error);
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: error.message });
      }
      res.status(500).json({ error: 'Login failed' });
    }
  }
}

module.exports = new AuthController();

