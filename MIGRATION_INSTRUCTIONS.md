# Инструкции по применению миграций

## Новые функции добавлены

Все недостающие функции были реализованы:

1. ✅ **Изменение публичности курса** - PUT `/api/courses/:id`
2. ✅ **Добавление ученика преподавателем** - POST `/api/courses/:id/enroll-student`
3. ✅ **Версионирование материалов курса** - GET/POST `/api/materials/:id/versions`
4. ✅ **Версионирование домашних заданий** - GET `/api/submissions/:id/versions`
5. ✅ **Тесты с автоматической проверкой** - `/api/tests/*`
6. ✅ **Встроенный чат с группами и темами** - `/api/chat/*`

## Шаги для применения изменений

### 1. Создать миграцию Prisma

```bash
cd backend
npx prisma migrate dev --name add_new_features
```

### 2. Сгенерировать Prisma Client

```bash
npx prisma generate
```

### 3. Перезапустить сервер

```bash
npm start
```

## Новые модели в базе данных

### Версионирование материалов
- `MaterialVersion` - хранит историю версий материалов

### Версионирование заданий
- `SubmissionVersion` - хранит историю версий отправленных заданий

### Тесты
- `Test` - тесты курса
- `Question` - вопросы теста
- `Answer` - варианты ответов
- `TestAttempt` - попытки прохождения теста
- `TestAttemptAnswer` - ответы студента на вопросы

### Чат
- `ChatTopic` - темы обсуждения в курсе
- `ChatMessage` - сообщения в темах

## Новые API endpoints

### Курсы
- `PUT /api/courses/:id` - обновление курса (публичность, описание)
- `POST /api/courses/:id/enroll-student` - добавление студента преподавателем

### Материалы
- `PUT /api/materials/:id` - обновление материала (создает новую версию)
- `GET /api/materials/:id/versions` - список версий материала
- `GET /api/materials/:id/versions/:version` - конкретная версия

### Задания
- `GET /api/submissions/:id/versions` - список версий задания
- `GET /api/submissions/:id/versions/:version` - конкретная версия

### Тесты
- `GET /api/tests/course/:courseId` - список тестов курса
- `GET /api/tests/:id` - получение теста
- `POST /api/tests` - создание теста (преподаватель)
- `POST /api/tests/:id/questions` - добавление вопроса
- `POST /api/tests/:id/start` - начало прохождения теста (студент)
- `POST /api/tests/:id/submit` - отправка ответов (автоматическая проверка)
- `GET /api/tests/:id/attempts/:attemptId` - результаты попытки

### Чат
- `GET /api/chat/course/:courseId/topics` - список тем курса
- `POST /api/chat/course/:courseId/topics` - создание темы
- `GET /api/chat/topics/:topicId/messages` - сообщения темы
- `POST /api/chat/topics/:topicId/messages` - отправка сообщения
- `PUT /api/chat/messages/:id` - редактирование сообщения
- `DELETE /api/chat/messages/:id` - удаление сообщения

## Важные замечания

1. При обновлении материала автоматически создается новая версия
2. При повторной отправке задания создается новая версия
3. Тесты поддерживают типы вопросов: multiple_choice, matching, true_false
4. Чат разделен по курсам (группам) и темам
5. Преподаватель может добавлять студентов в приватные курсы по email

