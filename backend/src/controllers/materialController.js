const materialService = require('../services/materialService');
const { validationResult } = require('express-validator');

/**
 * Контроллер для работы с материалами
 * @class MaterialController
 */
class MaterialController {
  /**
   * Получить материалы курса
   * @route GET /api/materials/course/:courseId
   */
  async getCourseMaterials(req, res) {
    try {
      const { courseId } = req.params;
      const materials = await materialService.getCourseMaterials(courseId, req.user.id, req.user.role);
      res.json(materials);
    } catch (error) {
      console.error('Get materials error:', error);
      if (error.message === 'Course not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch materials' });
    }
  }

  /**
   * Создать материал
   * @route POST /api/materials
   */
  async createMaterial(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const material = await materialService.createMaterial(req.body.courseId, req.user.id, {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        contentUrl: req.file ? `/uploads/${req.file.filename}` : null,
        order: req.body.order
      });

      res.status(201).json(material);
    } catch (error) {
      console.error('Create material error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create material' });
    }
  }

  /**
   * Обновить материал
   * @route PUT /api/materials/:id
   */
  async updateMaterial(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const material = await materialService.updateMaterial(id, req.user.id, {
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        order: req.body.order,
        contentUrl: req.file ? `/uploads/${req.file.filename}` : undefined
      });

      res.json(material);
    } catch (error) {
      console.error('Update material error:', error);
      if (error.message === 'Material not found' || error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to update material' });
    }
  }

  /**
   * Получить версии материала
   * @route GET /api/materials/:id/versions
   */
  async getMaterialVersions(req, res) {
    try {
      const { id } = req.params;
      const versions = await materialService.getMaterialVersions(id, req.user.id);
      res.json(versions);
    } catch (error) {
      console.error('Get material versions error:', error);
      if (error.message === 'Access denied') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch versions' });
    }
  }

  /**
   * Получить конкретную версию материала
   * @route GET /api/materials/:id/versions/:version
   */
  async getMaterialVersion(req, res) {
    try {
      const { id, version } = req.params;
      const materialVersion = await materialService.getMaterialVersion(id, version, req.user.id);
      res.json(materialVersion);
    } catch (error) {
      console.error('Get material version error:', error);
      if (error.message === 'Access denied' || error.message === 'Version not found') {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to fetch version' });
    }
  }
}

module.exports = new MaterialController();

