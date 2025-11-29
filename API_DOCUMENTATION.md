# API Документация

## Обзор

API построен на REST принципах и использует JSON для обмена данными. Все endpoints требуют аутентификации через JWT токен (кроме регистрации и входа).

## Базовый URL

```
http://localhost:3001/api
```

## Аутентификация

Большинство endpoints требуют JWT токен в заголовке:

```
Authorization: Bearer <token>
```

Токен получается при регистрации или входе и действителен 7 дней.

## Swagger UI

Интерактивная документация доступна по адресу:

```
http://localhost:3001/api-docs
```

Swagger UI предоставляет:
- Полный список всех endpoints
- Описание параметров запросов
- Примеры запросов и ответов
- Возможность тестирования API прямо в браузере

## Основные endpoints

### Аутентификация

#### POST /api/auth/register
Регистрация нового пользователя

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Иван",
  "lastName": "Иванов",
  "role": "STUDENT"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "role": "STUDENT"
  },
  "token": "jwt-token"
}
```

#### POST /api/auth/login
Вход в систему

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "role": "STUDENT"
  },
  "token": "jwt-token"
}
```

### Курсы

#### GET /api/courses
Получить список курсов пользователя

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Название курса",
    "description": "Описание",
    "teacherId": "uuid",
    "isPrivate": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "teacher": {
      "id": "uuid",
      "firstName": "Имя",
      "lastName": "Фамилия"
    }
  }
]
```

#### GET /api/courses/:id
Получить детали курса

#### POST /api/courses
Создать курс (только для преподавателей)

**Request Body:**
```json
{
  "title": "Название курса",
  "description": "Описание",
  "isPrivate": false,
  "allowedEmails": "student1@example.com,student2@example.com"
}
```

#### PUT /api/courses/:id
Обновить курс (только для преподавателей)

#### POST /api/courses/:id/enroll
Записаться на курс (только для студентов)

#### POST /api/courses/:id/enroll-student
Добавить студента на курс (только для преподавателей)

**Request Body:**
```json
{
  "studentEmail": "student@example.com"
}
```

### Материалы

#### GET /api/materials/course/:courseId
Получить материалы курса

#### POST /api/materials
Создать материал (только для преподавателей)

**Request:** multipart/form-data
- `courseId` (string, required)
- `title` (string, required)
- `description` (string, optional)
- `type` (enum: video, text, scorm, file, required)
- `file` (file, optional)
- `order` (integer, optional)

#### PUT /api/materials/:id
Обновить материал (только для преподавателей)

#### GET /api/materials/:id/versions
Получить версии материала (только для преподавателей)

#### GET /api/materials/:id/versions/:version
Получить конкретную версию материала (только для преподавателей)

### Задания

#### GET /api/assignments/course/:courseId
Получить задания курса

#### GET /api/assignments/:id
Получить задание по ID

#### POST /api/assignments
Создать задание (только для преподавателей)

**Request Body:**
```json
{
  "courseId": "uuid",
  "title": "Название задания",
  "description": "Описание",
  "dueDate": "2024-12-31T23:59:59Z",
  "maxScore": 100
}
```

### Отправки заданий

#### GET /api/submissions
Получить отправки:
- Студенты: все свои отправки
- Преподаватели: отправки по заданию (query: `?assignmentId=uuid`)

#### POST /api/submissions
Отправить задание (только для студентов)

**Request:** multipart/form-data
- `assignmentId` (string, required)
- `file` (file, required)
- `comment` (string, optional)

#### POST /api/submissions/:id/grade
Выставить оценку (только для преподавателей)

**Request Body:**
```json
{
  "score": 85,
  "maxScore": 100,
  "feedback": "Хорошая работа!"
}
```

#### POST /api/submissions/:id/comments
Добавить комментарий к отправке

**Request Body:**
```json
{
  "content": "Комментарий"
}
```

#### GET /api/submissions/:id/versions
Получить версии отправки

### Тесты

#### GET /api/tests/course/:courseId
Получить тесты курса

#### GET /api/tests/:id
Получить тест по ID

#### POST /api/tests
Создать тест (только для преподавателей)

**Request Body:**
```json
{
  "courseId": "uuid",
  "title": "Название теста",
  "description": "Описание",
  "maxScore": 100,
  "timeLimit": 60
}
```

#### POST /api/tests/:id/questions
Добавить вопрос к тесту (только для преподавателей)

**Request Body:**
```json
{
  "type": "multiple_choice",
  "question": "Вопрос?",
  "points": 10,
  "answers": [
    {
      "text": "Ответ 1",
      "isCorrect": true,
      "order": 0
    },
    {
      "text": "Ответ 2",
      "isCorrect": false,
      "order": 1
    }
  ]
}
```

#### POST /api/tests/:id/start
Начать попытку теста (только для студентов)

#### POST /api/tests/:id/submit
Отправить ответы на тест (только для студентов)

**Request Body:**
```json
{
  "attemptId": "uuid",
  "answers": [
    {
      "questionId": "uuid",
      "answerIds": ["uuid"]
    }
  ]
}
```

#### GET /api/tests/:id/attempts/:attemptId
Получить результаты попытки

### Прогресс

#### GET /api/progress/course/:courseId
Получить прогресс по курсу (только для студентов)

#### POST /api/progress/material/:materialId/complete
Отметить материал как пройденный (только для студентов)

### Преподаватель

#### GET /api/teacher/courses/:courseId/stats
Получить статистику курса (только для преподавателей)

#### GET /api/teacher/courses/:courseId/students/:studentId
Получить детали студента в курсе (только для преподавателей)

### Чат

#### GET /api/chat/course/:courseId/topics
Получить темы обсуждений курса

#### POST /api/chat/course/:courseId/topics
Создать тему обсуждения

#### GET /api/chat/topics/:topicId/messages
Получить сообщения темы

#### POST /api/chat/topics/:topicId/messages
Отправить сообщение

#### PUT /api/chat/messages/:id
Обновить сообщение

#### DELETE /api/chat/messages/:id
Удалить сообщение

## Коды ответов

- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Ошибка валидации
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `500` - Внутренняя ошибка сервера

## Обработка ошибок

Все ошибки возвращаются в формате:

```json
{
  "error": "Сообщение об ошибке"
}
```

Или для ошибок валидации:

```json
{
  "errors": [
    {
      "msg": "Сообщение",
      "param": "field",
      "location": "body"
    }
  ]
}
```

## Примеры использования

### Создание курса (преподаватель)

```bash
curl -X POST http://localhost:3001/api/courses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Новый курс",
    "description": "Описание курса",
    "isPrivate": false
  }'
```

### Загрузка материала

```bash
curl -X POST http://localhost:3001/api/materials \
  -H "Authorization: Bearer <token>" \
  -F "courseId=uuid" \
  -F "title=Материал" \
  -F "type=file" \
  -F "file=@/path/to/file.pdf"
```

### Отправка задания

```bash
curl -X POST http://localhost:3001/api/submissions \
  -H "Authorization: Bearer <token>" \
  -F "assignmentId=uuid" \
  -F "file=@/path/to/homework.pdf"
```

## Дополнительная информация

Для полной документации с примерами используйте Swagger UI:
```
http://localhost:3001/api-docs
```

