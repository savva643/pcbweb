#!/bin/bash

# Скрипт настройки Nginx для Commit to Learn

set -e

echo "🔧 Настройка Nginx..."

# Установка Nginx
sudo apt update
sudo apt install nginx -y

# Копирование конфигурации
sudo cp nginx/nginx.conf /etc/nginx/sites-available/commit-to-learn

# Создание символической ссылки
sudo ln -sf /etc/nginx/sites-available/commit-to-learn /etc/nginx/sites-enabled/

# Удаление дефолтного конфига (опционально)
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "✅ Nginx настроен!"
echo ""
echo "🌐 Доступ:"
echo "   http://pcb.keep-pixel.ru"
echo "   http://144.31.69.129"
echo ""
echo "📝 Для настройки HTTPS (SSL):"
echo "   1. Установите certbot: sudo apt install certbot python3-certbot-nginx"
echo "   2. Получите сертификат: sudo certbot --nginx -d pcb.keep-pixel.ru"
echo "   3. Раскомментируйте HTTPS секцию в nginx/nginx.conf"
echo ""

