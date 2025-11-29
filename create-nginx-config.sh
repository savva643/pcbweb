#!/bin/bash

# Создание конфигурации Nginx прямо на сервере
# Выполните на сервере Ubuntu

cat > /tmp/commit-to-learn-nginx.conf << 'EOF'
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

echo "✅ Конфигурация создана в /tmp/commit-to-learn-nginx.conf"
echo ""
echo "Теперь выполните:"
echo "sudo cp /tmp/commit-to-learn-nginx.conf /etc/nginx/sites-available/commit-to-learn"
echo "sudo ln -sf /etc/nginx/sites-available/commit-to-learn /etc/nginx/sites-enabled/"
echo "sudo rm -f /etc/nginx/sites-enabled/default"
echo "sudo nginx -t"
echo "sudo systemctl restart nginx"

