const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Конфигурация Swagger/OpenAPI
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Commit to Learn API',
      version: '1.0.0',
      description: 'API для системы управления обучением',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT токен авторизации'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID пользователя'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email пользователя'
            },
            firstName: {
              type: 'string',
              description: 'Имя'
            },
            lastName: {
              type: 'string',
              description: 'Фамилия'
            },
            role: {
              type: 'string',
              enum: ['STUDENT', 'TEACHER'],
              description: 'Роль пользователя'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания'
            }
          }
        },
        Course: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID курса'
            },
            title: {
              type: 'string',
              description: 'Название курса'
            },
            description: {
              type: 'string',
              description: 'Описание курса'
            },
            teacherId: {
              type: 'string',
              format: 'uuid',
              description: 'ID преподавателя'
            },
            isPrivate: {
              type: 'boolean',
              description: 'Приватный курс'
            },
            allowedEmails: {
              type: 'string',
              description: 'Список разрешенных email (для приватных курсов)'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания'
            }
          }
        },
        ChatTopic: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID темы'
            },
            courseId: {
              type: 'string',
              format: 'uuid',
              description: 'ID курса'
            },
            title: {
              type: 'string',
              description: 'Название темы'
            },
            description: {
              type: 'string',
              description: 'Описание темы'
            },
            isPrivate: {
              type: 'boolean',
              description: 'Приватная тема'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания'
            },
            _count: {
              type: 'object',
              properties: {
                messages: {
                  type: 'number',
                  description: 'Количество сообщений'
                }
              }
            }
          }
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID сообщения'
            },
            topicId: {
              type: 'string',
              format: 'uuid',
              description: 'ID темы'
            },
            authorId: {
              type: 'string',
              format: 'uuid',
              description: 'ID автора'
            },
            content: {
              type: 'string',
              description: 'Содержимое сообщения'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата создания'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Дата обновления'
            },
            author: {
              $ref: '#/components/schemas/User'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Сообщение об ошибке'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  msg: {
                    type: 'string'
                  },
                  param: {
                    type: 'string'
                  },
                  location: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'] // Пути к файлам с аннотациями
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

