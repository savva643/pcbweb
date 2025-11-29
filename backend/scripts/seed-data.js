const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем создание тестовых данных...');

  // Создание тестового преподавателя
  const teacherEmail = 'teacher@test.com';
  let teacher = await prisma.user.findUnique({
    where: { email: teacherEmail }
  });

  if (!teacher) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    teacher = await prisma.user.create({
      data: {
        email: teacherEmail,
        password: hashedPassword,
        firstName: 'Иван',
        lastName: 'Преподавателев',
        role: 'TEACHER'
      }
    });
    console.log('✅ Создан преподаватель:', teacher.email);
  } else {
    console.log('ℹ️  Преподаватель уже существует:', teacher.email);
  }

  // Создание тестового студента
  const studentEmail = 'student@test.com';
  let student = await prisma.user.findUnique({
    where: { email: studentEmail }
  });

  if (!student) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    student = await prisma.user.create({
      data: {
        email: studentEmail,
        password: hashedPassword,
        firstName: 'Петр',
        lastName: 'Студентов',
        role: 'STUDENT'
      }
    });
    console.log('✅ Создан студент:', student.email);
  } else {
    console.log('ℹ️  Студент уже существует:', student.email);
  }

  // Создание тестовых курсов
  const coursesData = [
    {
      title: 'Введение в программирование',
      description: 'Базовый курс по программированию для начинающих. Изучите основы алгоритмов, структур данных и объектно-ориентированного программирования.',
      teacherId: teacher.id
    },
    {
      title: 'Веб-разработка с React',
      description: 'Современный курс по созданию веб-приложений с использованием React. Изучите компоненты, хуки, роутинг и управление состоянием.',
      teacherId: teacher.id
    },
    {
      title: 'Базы данных и SQL',
      description: 'Изучите проектирование баз данных, SQL запросы, нормализацию и оптимизацию. Практические задания на PostgreSQL.',
      teacherId: teacher.id
    }
  ];

  for (const courseData of coursesData) {
    let course = await prisma.course.findFirst({
      where: {
        title: courseData.title,
        teacherId: teacher.id
      }
    });

    if (!course) {
      course = await prisma.course.create({
        data: courseData
      });
      console.log('✅ Создан курс:', course.title);

      // Запись студента на курс
      await prisma.courseEnrollment.create({
        data: {
          studentId: student.id,
          courseId: course.id
        }
      });
      console.log('✅ Студент записан на курс:', course.title);

      // Создание материалов для курса
      const materials = [
        {
          title: 'Введение в курс',
          description: 'Обзор курса и основные понятия. В этом разделе вы узнаете о структуре курса, целях обучения и требованиях.',
          type: 'text',
          order: 1
        },
        {
          title: 'Методическое пособие',
          description: 'Подробное методическое пособие по курсу. Содержит все необходимые материалы для изучения.',
          type: 'file',
          order: 2
        },
        {
          title: 'Лекция 1: Основы',
          description: 'Первая лекция курса. Видеоматериал с объяснением основных концепций.',
          type: 'video',
          order: 3
        },
        {
          title: 'Дополнительные материалы',
          description: 'Дополнительные файлы и ресурсы для углубленного изучения темы.',
          type: 'file',
          order: 4
        }
      ];

      for (const materialData of materials) {
        await prisma.material.create({
          data: {
            ...materialData,
            courseId: course.id
          }
        });
      }
      console.log('✅ Созданы материалы для курса:', course.title);

      // Создание заданий
      const assignments = [
        {
          title: 'Домашнее задание 1',
          description: `Выполните домашнее задание по теме курса "${course.title}".

Задание:
1. Изучите предоставленные материалы
2. Выполните практические упражнения
3. Ответьте на вопросы
4. Загрузите файл с решением

Требования:
- Формат файла: PDF, DOCX или ZIP
- Максимальный размер: 100 МБ
- Срок сдачи указан ниже`,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // через 7 дней
          maxScore: 100
        },
        {
          title: 'Практическая работа',
          description: `Практическая работа по пройденному материалу курса "${course.title}".

Цель работы:
- Применить полученные знания на практике
- Продемонстрировать понимание материала
- Развить практические навыки

Инструкции:
1. Внимательно прочитайте задание
2. Выполните все пункты работы
3. Оформите результаты согласно требованиям
4. Загрузите выполненную работу`,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // через 14 дней
          maxScore: 50
        }
      ];

      for (const assignmentData of assignments) {
        await prisma.assignment.create({
          data: {
            ...assignmentData,
            courseId: course.id
          }
        });
      }
      console.log('✅ Созданы задания для курса:', course.title);
    } else {
      console.log('ℹ️  Курс уже существует:', course.title);
    }
  }

  console.log('');
  console.log('✅ Тестовые данные созданы успешно!');
  console.log('');
  console.log('📝 Тестовые аккаунты:');
  console.log('   Преподаватель:');
  console.log('     Email: teacher@test.com');
  console.log('     Пароль: password123');
  console.log('');
  console.log('   Студент:');
  console.log('     Email: student@test.com');
  console.log('     Пароль: password123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

