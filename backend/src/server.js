const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Commit to Learn API Documentation'
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/homeworks', require('./routes/homeworks'));

// Health check
/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Проверка работоспособности API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API работает
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Commit to Learn API is running
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Commit to Learn API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

