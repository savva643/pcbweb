#!/bin/bash

# Скрипт установки для Ubuntu Server
# Commit to Learn - Развертывание

set -e

echo "🚀 Начинаем установку Commit to Learn на Ubuntu..."

# 1. Обновление системы
echo "📦 Обновление системы..."
sudo apt update && sudo apt upgrade -y

# 2. Установка Git
echo "📥 Установка Git..."
sudo apt install git -y

# 3. Установка зависимостей Docker
echo "🔧 Установка зависимостей Docker..."
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# 4. Добавление репозитория Docker
echo "➕ Добавление репозитория Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Установка Docker
echo "🐳 Установка Docker..."
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# 6. Запуск Docker
echo "▶️  Запуск Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# 7. Добавление пользователя в группу docker
echo "👤 Добавление пользователя в группу docker..."
sudo usermod -aG docker $USER

# 8. Настройка файрвола
echo "🔥 Настройка файрвола..."
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw --force enable || true

echo ""
echo "✅ Установка завершена!"
echo ""
echo "⚠️  ВАЖНО: Выполните одну из команд:"
echo "   1. newgrp docker  (для применения изменений группы)"
echo "   2. Или перезайдите в систему"
echo ""
echo "📝 Затем:"
echo "   1. Перейдите в директорию проекта: cd ~/pcbweb"
echo "   2. Запустите проект: docker compose up -d --build"
echo "   3. Проверьте логи: docker compose logs -f"
echo ""


