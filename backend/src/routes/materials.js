const express = require('express');
const materialController = require('../controllers/materialController');
const materialValidators = require('../validators/materialValidators');
const { authenticate, requireRole } = require('../middleware/auth');
const upload = require('../utils/upload');

const router = express.Router();

/**
 * @swagger
 * /api/materials/course/{courseId}:
 *   get:
 *     summary: Получить материалы курса
 *     tags: [Materials]
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
 *         description: Список материалов
 */
router.get('/course/:courseId', authenticate, materialController.getCourseMaterials);

/**
 * @swagger
 * /api/materials:
 *   post:
 *     summary: Создать материал (только для преподавателей)
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - title
 *               - type
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [video, text, scorm, file]
 *               file:
 *                 type: string
 *                 format: binary
 *               order:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Материал создан
 */
router.post('/', authenticate, requireRole('TEACHER'), upload.single('file'), materialValidators.create, materialController.createMaterial);

/**
 * @swagger
 * /api/materials/{id}:
 *   put:
 *     summary: Обновить материал (только для преподавателей)
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [video, text, scorm, file]
 *               file:
 *                 type: string
 *                 format: binary
 *               order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Материал обновлен
 */
router.put('/:id', authenticate, requireRole('TEACHER'), upload.single('file'), materialValidators.update, materialController.updateMaterial);

/**
 * @swagger
 * /api/materials/{id}/versions:
 *   get:
 *     summary: Получить версии материала (только для преподавателей)
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Список версий
 */
router.get('/:id/versions', authenticate, requireRole('TEACHER'), materialValidators.materialId, materialController.getMaterialVersions);

/**
 * @swagger
 * /api/materials/{id}/versions/{version}:
 *   get:
 *     summary: Получить конкретную версию материала (только для преподавателей)
 *     tags: [Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Версия материала
 */
router.get('/:id/versions/:version', authenticate, requireRole('TEACHER'), materialValidators.materialId, materialValidators.version, materialController.getMaterialVersion);

module.exports = router;
