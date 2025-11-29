#!/bin/bash

# Быстрое исправление для работы с доменом
# Выполните на сервере после клонирования проекта

set -e

echo "🔧 Настройка домена pcb.keep-pixel.ru..."

# 1. Установка Nginx
echo "📦 Установка Nginx..."
sudo apt update
sudo apt install nginx -y

# 2. Копирование конфигурации Nginx
echo "📝 Настройка Nginx..."
sudo cp nginx/nginx.conf /etc/nginx/sites-available/commit-to-learn
sudo ln -sf /etc/nginx/sites-available/commit-to-learn /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 3. Проверка и перезапуск Nginx
echo "✅ Проверка конфигурации Nginx..."
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# 4. Настройка файрвола
echo "🔥 Настройка файрвола..."
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload

# 5. Пересборка проекта
echo "🐳 Пересборка проекта..."
cd ~/pcbweb
docker compose down
docker compose up -d --build

echo ""
echo "✅ Готово!"
echo ""
echo "🌐 Откройте в браузере:"
echo "   http://pcb.keep-pixel.ru"
echo "   http://144.31.69.129"
echo ""
echo "📊 Проверка:"
echo "   docker compose logs -f"
echo "   sudo tail -f /var/log/nginx/error.log"
echo ""


