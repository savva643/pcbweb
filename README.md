# Commit to Learn - Образовательная платформа

Образовательная платформа для управления курсами, заданиями и обучением студентов. Система поддерживает два типа пользователей: студенты и преподаватели.

## Технологический стек

### Backend
- **Node.js** 18+ с Express.js
- **PostgreSQL** - реляционная база данных
- **Prisma** - ORM для работы с базой данных
- **JWT** - аутентификация и авторизация
- **Multer** - загрузка файлов
- **Swagger** - документация API

### Frontend
- **React** 18+ с хуками
- **Material-UI** - компоненты интерфейса
- **React Router** - маршрутизация
- **Axios** - HTTP клиент

### Инфраструктура
- **Docker** и **Docker Compose** - контейнеризация
- **Nginx** - обратный прокси (для production)

## Установка и запуск

### Требования
- Docker и Docker Compose
- Node.js 18+ (для локальной разработки)

### Быстрый старт с Docker

```bash
# Клонировать репозиторий
git clone <repository-url>
cd pcbweb

# Запустить все сервисы
docker-compose up --build

# Приложение будет доступно:
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# API Documentation: http://localhost:3001/api-docs
```

### Локальная разработка

#### Backend

```bash
cd backend

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env
# Отредактировать .env файл

# Применить миграции базы данных
npx prisma migrate dev

# Сгенерировать Prisma Client
npx prisma generate

# Запустить сервер разработки
npm run dev
```

#### Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Настроить переменные окружения
cp .env.example .env
# Убедитесь, что REACT_APP_API_URL указывает на backend

# Запустить приложение
npm start
```

## Структура проекта

```
pcbweb/
├── backend/                 # Backend приложение
│   ├── src/
│   │   ├── config/          # Конфигурация (БД, Swagger)
│   │   ├── controllers/     # Контроллеры (обработка запросов)
│   │   ├── middleware/      # Промежуточное ПО (auth, валидация)
│   │   ├── repositories/    # Репозитории (доступ к данным)
│   │   ├── routes/          # Маршруты API
│   │   ├── services/        # Бизнес-логика
│   │   ├── utils/           # Утилиты (загрузка файлов)
│   │   └── server.js        # Точка входа
│   ├── prisma/
│   │   └── schema.prisma    # Схема базы данных
│   └── uploads/             # Загруженные файлы
├── frontend/                 # Frontend приложение
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы приложения
│   │   ├── context/         # React Context (Auth)
│   │   ├── services/        # API сервисы
│   │   └── App.js           # Главный компонент
│   └── public/              # Статические файлы
├── docker-compose.yml        # Конфигурация Docker
└── README.md                # Документация
```

## Архитектура

Проект следует принципам чистой архитектуры с разделением на слои:

1. **Routes** - определяют API endpoints и маршрутизацию
2. **Controllers** - обрабатывают HTTP запросы и ответы
3. **Services** - содержат бизнес-логику приложения
4. **Repositories** - абстракция для доступа к данным
5. **Models** - Prisma модели базы данных

Подробнее см. [ARCHITECTURE.md](./ARCHITECTURE.md)

## API Документация

API документация доступна через Swagger UI после запуска приложения:

```
http://localhost:3001/api-docs
```

Все endpoints документированы с примерами запросов и ответов.

Подробнее см. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Функциональность

### Для студентов
- Просмотр доступных курсов
- Запись на курсы
- Изучение материалов (видео, текст, файлы, SCORM)
- Загрузка домашних заданий
- Просмотр оценок и комментариев преподавателей
- Отслеживание прогресса обучения
- Прохождение тестов с автоматической проверкой
- Участие в обсуждениях курса

### Для преподавателей
- Создание и управление курсами
- Настройка публичности курсов (публичные/приватные)
- Добавление студентов на курсы
- Загрузка учебных материалов различных форматов
- Версионирование материалов
- Создание заданий с дедлайнами
- Просмотр и проверка работ студентов
- Версионирование отправок студентов
- Выставление оценок и комментариев
- Создание тестов с автоматической проверкой
- Просмотр статистики курса
- Управление обсуждениями курса

## База данных

База данных использует PostgreSQL и управляется через Prisma. Основные сущности:

- **User** - пользователи (студенты и преподаватели)
- **Course** - курсы
- **Material** - учебные материалы
- **MaterialVersion** - версии материалов
- **Assignment** - задания
- **Submission** - отправки заданий
- **SubmissionVersion** - версии отправок
- **Grade** - оценки
- **Comment** - комментарии
- **Test** - тесты
- **Question** - вопросы тестов
- **Answer** - ответы на вопросы
- **TestAttempt** - попытки прохождения тестов
- **Progress** - прогресс студентов
- **ChatTopic** - темы обсуждений
- **ChatMessage** - сообщения в обсуждениях

## Переменные окружения

### Backend (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/commit_to_learn"
JWT_SECRET="your-secret-key"
PORT=3001
API_URL="http://localhost:3001"
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3001
```

## Миграции базы данных

```bash
# Создать новую миграцию
npx prisma migrate dev --name migration_name

# Применить миграции
npx prisma migrate deploy

# Открыть Prisma Studio
npx prisma studio
```

## Тестирование

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## Развертывание

### Production сборка

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

### Docker Production

```bash
docker-compose -f docker-compose.prod.yml up --build
```

## Лицензия

MIT

## Контакты

Для вопросов и предложений создайте issue в репозитории.
