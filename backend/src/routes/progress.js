const express = require('express');
const progressController = require('../controllers/progressController');
const progressValidators = require('../validators/progressValidators');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/progress/course/{courseId}:
 *   get:
 *     summary: Получить прогресс по курсу (только для студентов)
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Прогресс по курсу
 */
router.get('/course/:courseId', authenticate, requireRole('STUDENT'), progressValidators.courseId, progressController.getCourseProgress);

/**
 * @swagger
 * /api/progress/material/{materialId}/complete:
 *   post:
 *     summary: Отметить материал как пройденный (только для студентов)
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: materialId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Прогресс обновлен
 */
router.post('/material/:materialId/complete', authenticate, requireRole('STUDENT'), progressValidators.materialId, progressController.markMaterialComplete);

module.exports = router;
