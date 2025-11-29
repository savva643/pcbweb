#!/bin/bash

# Скрипт для создания ZIP архива из SCORM примера

SCORM_DIR="SCORM_EXAMPLE"
OUTPUT_FILE="scorm_example.zip"

if [ ! -d "$SCORM_DIR" ]; then
    echo "Ошибка: Папка $SCORM_DIR не найдена"
    exit 1
fi

echo "📦 Создание ZIP архива из $SCORM_DIR..."

cd "$SCORM_DIR" || exit 1

if command -v zip &> /dev/null; then
    zip -r "../$OUTPUT_FILE" . -x "*.git*" -x "*.DS_Store"
    echo "✅ Архив создан: ../$OUTPUT_FILE"
elif command -v 7z &> /dev/null; then
    7z a "../$OUTPUT_FILE" *
    echo "✅ Архив создан: ../$OUTPUT_FILE"
else
    echo "Ошибка: Не найден zip или 7z. Установите один из них."
    exit 1
fi

cd ..

echo ""
echo "Для загрузки в систему используйте:"
echo "  node scripts/upload-scorm.js <courseId> $OUTPUT_FILE [email] [password]"

