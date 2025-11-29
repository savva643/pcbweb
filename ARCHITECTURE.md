# Архитектура системы Commit to Learn

## Обзор

Система построена по принципам многослойной архитектуры (Layered Architecture) с четким разделением ответственности между слоями.

## Структура архитектуры

```
┌─────────────────────────────────────────┐
│           Presentation Layer             │
│         (Routes + Controllers)           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Application Layer               │
│              (Services)                  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           Domain Layer                   │
│         (Repositories)                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Infrastructure Layer             │
│      (Database via Prisma)               │
└──────────────────────────────────────────┘
```

## Слои архитектуры

### 1. Presentation Layer (Routes + Controllers)

**Назначение**: Обработка HTTP запросов и ответов

**Компоненты**:
- **Routes** (`backend/src/routes/`) - определяют API endpoints
- **Controllers** (`backend/src/controllers/`) - обрабатывают запросы и вызывают сервисы
- **Validators** (`backend/src/validators/`) - валидация входных данных
- **Middleware** (`backend/src/middleware/`) - аутентификация, авторизация

**Принципы**:
- Routes только определяют маршруты и применяют middleware
- Controllers делегируют бизнес-логику сервисам
- Валидация происходит до передачи данных в сервисы

**Пример**:
```javascript
// routes/courses.js
router.post('/', authenticate, requireRole('TEACHER'), 
  courseValidators.create, 
  courseController.createCourse);

// controllers/courseController.js
async createCourse(req, res) {
  const course = await courseService.createCourse(req.user.id, req.body);
  res.status(201).json(course);
}
```

### 2. Application Layer (Services)

**Назначение**: Бизнес-логика приложения

**Компоненты**:
- **Services** (`backend/src/services/`) - содержат бизнес-логику

**Принципы**:
- Сервисы не зависят от HTTP слоя
- Сервисы могут использовать несколько репозиториев
- Сервисы обрабатывают бизнес-правила и валидацию на уровне приложения

**Пример**:
```javascript
// services/courseService.js
async createCourse(teacherId, data) {
  // Проверка прав доступа
  // Валидация бизнес-правил
  // Создание курса через репозиторий
  return courseRepository.create({ ...data, teacherId });
}
```

### 3. Domain Layer (Repositories)

**Назначение**: Абстракция доступа к данным

**Компоненты**:
- **Repositories** (`backend/src/repositories/`) - инкапсулируют работу с БД
- **BaseRepository** - базовый класс с общими методами

**Принципы**:
- Репозитории предоставляют простой интерфейс для работы с данными
- Скрывают детали реализации Prisma
- Могут содержать специфичные запросы для сущности

**Пример**:
```javascript
// repositories/courseRepository.js
async findByTeacher(teacherId) {
  return prisma.course.findMany({
    where: { teacherId },
    include: { _count: { select: { enrollments: true } } }
  });
}
```

### 4. Infrastructure Layer (Database)

**Назначение**: Хранение данных

**Компоненты**:
- **Prisma Schema** (`backend/prisma/schema.prisma`) - определение моделей
- **Prisma Client** - автоматически генерируемый клиент

**Принципы**:
- Все изменения схемы через миграции
- Prisma обеспечивает типобезопасность

## Поток данных

### Типичный запрос

1. **HTTP Request** → Route
2. **Route** → Middleware (auth, validation)
3. **Route** → Controller
4. **Controller** → Service
5. **Service** → Repository(ies)
6. **Repository** → Database (Prisma)
7. **Response** ← Controller ← Service ← Repository

### Пример: Создание курса

```
POST /api/courses
  ↓
routes/courses.js (маршрутизация)
  ↓
middleware/auth.js (проверка JWT токена)
  ↓
middleware/requireRole.js (проверка роли TEACHER)
  ↓
validators/courseValidators.js (валидация данных)
  ↓
controllers/courseController.js (обработка запроса)
  ↓
services/courseService.js (бизнес-логика)
  ↓
repositories/courseRepository.js (сохранение в БД)
  ↓
Database (PostgreSQL через Prisma)
```

## Принципы проектирования

### 1. Separation of Concerns
Каждый слой отвечает за свою область:
- Routes - маршрутизация
- Controllers - HTTP обработка
- Services - бизнес-логика
- Repositories - доступ к данным

### 2. Dependency Inversion
Высокоуровневые модули не зависят от низкоуровневых:
- Controllers зависят от Services (интерфейсов)
- Services зависят от Repositories (интерфейсов)
- Реализация скрыта в Infrastructure слое

### 3. Single Responsibility
Каждый класс/модуль имеет одну причину для изменения:
- Controller - только обработка HTTP
- Service - только бизнес-логика
- Repository - только доступ к данным

### 4. DRY (Don't Repeat Yourself)
Общая функциональность вынесена в:
- BaseRepository - общие методы работы с БД
- Middleware - общая обработка запросов
- Validators - переиспользуемые правила валидации

## Модули системы

### Authentication & Authorization
- JWT токены для аутентификации
- Role-based access control (RBAC)
- Middleware для проверки прав доступа

### File Management
- Multer для загрузки файлов
- Хранение в `backend/uploads/`
- Поддержка различных типов файлов

### Versioning
- Версионирование материалов курса
- Версионирование отправок заданий
- История изменений

### Testing System
- Автоматическая проверка тестов
- Поддержка различных типов вопросов
- Отслеживание попыток

### Chat System
- Темы обсуждений
- Сообщения в темах
- Приватные обсуждения для преподавателей

## Расширяемость

Архитектура позволяет легко:

1. **Добавлять новые endpoints**: создать route → controller → service → repository
2. **Изменять бизнес-логику**: модифицировать только Services
3. **Менять источник данных**: заменить Repository реализацию
4. **Добавлять валидацию**: расширить Validators
5. **Добавлять middleware**: создать новый middleware

## Тестирование

Архитектура поддерживает тестирование на каждом уровне:

- **Unit Tests**: Services, Repositories
- **Integration Tests**: Controllers + Services
- **E2E Tests**: Полный поток через API

## Безопасность

- JWT токены для аутентификации
- Хеширование паролей (bcrypt)
- Валидация всех входных данных
- Проверка прав доступа на каждом уровне
- SQL injection защита через Prisma

## Производительность

- Индексы в базе данных для частых запросов
- Оптимизация запросов через Prisma includes
- Кэширование на уровне приложения (при необходимости)

