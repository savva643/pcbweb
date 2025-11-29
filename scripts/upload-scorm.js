#!/usr/bin/env node

/**
 * Скрипт для автоматической загрузки SCORM пакета в систему
 * 
 * Использование:
 *   node scripts/upload-scorm.js <courseId> <scormZipPath> [teacherEmail] [teacherPassword]
 * 
 * Пример:
 *   node scripts/upload-scorm.js abc123 SCORM_EXAMPLE.zip teacher@test.com password123
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    return response.data.token;
  } catch (error) {
    throw new Error(`Ошибка авторизации: ${error.response?.data?.error || error.message}`);
  }
}

async function uploadSCORM(token, courseId, scormZipPath) {
  try {
    // Читаем файл
    if (!fs.existsSync(scormZipPath)) {
      throw new Error(`Файл не найден: ${scormZipPath}`);
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(scormZipPath));
    formData.append('courseId', courseId);
    formData.append('title', path.basename(scormZipPath, '.zip'));
    formData.append('type', 'scorm');
    formData.append('description', 'SCORM пакет, загруженный автоматически');

    const response = await axios.post(`${API_URL}/materials`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return response.data;
  } catch (error) {
    throw new Error(`Ошибка загрузки: ${error.response?.data?.error || error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Использование:
  node scripts/upload-scorm.js <courseId> <scormZipPath> [teacherEmail] [teacherPassword]

Параметры:
  courseId      - ID курса, в который загрузить SCORM
  scormZipPath  - Путь к ZIP файлу SCORM пакета
  teacherEmail  - Email преподавателя (опционально, будет запрошен)
  teacherPassword - Пароль преподавателя (опционально, будет запрошен)

Пример:
  node scripts/upload-scorm.js abc123 SCORM_EXAMPLE.zip teacher@test.com password123
    `);
    process.exit(1);
  }

  const [courseId, scormZipPath, teacherEmail, teacherPassword] = args;

  try {
    let email = teacherEmail;
    let password = teacherPassword;

    // Если не указаны учетные данные, запрашиваем
    if (!email || !password) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const question = (query) => new Promise((resolve) => rl.question(query, resolve));

      if (!email) {
        email = await question('Email преподавателя: ');
      }
      if (!password) {
        password = await question('Пароль: ');
      }

      rl.close();
    }

    console.log('🔐 Авторизация...');
    const token = await login(email, password);
    console.log('✅ Авторизация успешна');

    console.log(`📦 Загрузка SCORM пакета: ${scormZipPath}`);
    const material = await uploadSCORM(token, courseId, scormZipPath);
    console.log('✅ SCORM пакет успешно загружен!');
    console.log(`\nМатериал создан:`);
    console.log(`  ID: ${material.id}`);
    console.log(`  Название: ${material.title}`);
    console.log(`  Тип: ${material.type}`);
    console.log(`  URL: ${material.contentUrl}`);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { login, uploadSCORM };

