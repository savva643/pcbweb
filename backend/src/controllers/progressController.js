const progressService = require('../services/progressService');
const { validationResult } = require('express-validator');

/**
 * Контроллер для работы с прогрессом
 * @class ProgressController
 */
class ProgressController {
  /**
   * Получить прогресс по курсу
   * @route GET /api/progress/course/:courseId
   */
  async getCourseProgress(req, res) {
    try {
      const { courseId } = req.params;
      const progress = await progressService.getCourseProgress(courseId, req.user.id);
      res.json(progress);
    } catch (error) {
      console.error('Get progress error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch progress' });
    }
  }

  /**
   * Отметить материал как пройденный
   * @route POST /api/progress/material/:materialId/complete
   */
  async markMaterialComplete(req, res) {
    try {
      const { materialId } = req.params;
      const progress = await progressService.markMaterialComplete(materialId, req.user.id);
      res.json(progress);
    } catch (error) {
      console.error('Mark material complete error:', error);
      if (error.message === 'Material not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update progress' });
    }
  }
}

module.exports = new ProgressController();

