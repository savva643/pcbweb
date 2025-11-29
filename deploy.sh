#!/bin/bash

# Скрипт развертывания проекта
# Выполните после setup-ubuntu.sh

set -e

echo "🚀 Развертывание Commit to Learn..."

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Сначала выполните setup-ubuntu.sh"
    exit 1
fi

# Проверка docker compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose не установлен"
    exit 1
fi

# Переход в директорию проекта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📦 Сборка и запуск контейнеров..."
docker compose up -d --build

echo ""
echo "✅ Проект запущен!"
echo ""
echo "🌐 Доступ:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001/api"
echo ""
echo "📊 Полезные команды:"
echo "   Просмотр логов:    docker compose logs -f"
echo "   Остановка:         docker compose down"
echo "   Перезапуск:        docker compose restart"
echo "   Статус:            docker compose ps"
echo ""


