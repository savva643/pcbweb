#!/bin/bash

# Полное исправление Nginx на сервере
# Скопируйте и выполните на сервере

set -e

echo "🔧 Настройка Nginx для Commit to Learn..."

# 1. Создание конфигурации
echo "📝 Создание конфигурации Nginx..."
sudo tee /etc/nginx/sites-available/commit-to-learn > /dev/null << 'EOF'
server {
    listen 80;
    server_name pcb.keep-pixel.ru 144.31.69.129;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 2. Активация конфигурации
echo "🔗 Активация конфигурации..."
sudo ln -sf /etc/nginx/sites-available/commit-to-learn /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 3. Проверка конфигурации
echo "✅ Проверка конфигурации..."
sudo nginx -t

# 4. Перезапуск Nginx
echo "🔄 Перезапуск Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# 5. Проверка статуса
echo "📊 Проверка статуса..."
sudo systemctl status nginx --no-pager -l

# 6. Проверка контейнеров
echo "🐳 Проверка Docker контейнеров..."
cd ~/projects/pcbweb 2>/dev/null || cd ~/pcbweb 2>/dev/null || echo "⚠️  Перейдите в директорию проекта вручную"
docker compose ps

echo ""
echo "✅ Готово!"
echo ""
echo "📝 Проверьте:"
echo "   1. Контейнеры запущены: docker compose ps"
echo "   2. Backend доступен: curl http://localhost:3001/api/health"
echo "   3. Frontend доступен: curl http://localhost:3000"
echo "   4. Nginx работает: sudo systemctl status nginx"
echo ""
echo "🌐 Откройте в браузере:"
echo "   http://pcb.keep-pixel.ru"
echo "   http://144.31.69.129"
echo ""

