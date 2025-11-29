# 🚀 Развертывание на Ubuntu Server

## Команды для установки и запуска

Выполните команды последовательно на сервере Ubuntu:

### 1. Обновление системы
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка Git
```bash
sudo apt install git -y
```

### 3. Установка Docker
```bash
# Установка зависимостей
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Добавление официального GPG ключа Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавление репозитория Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Запуск Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавление текущего пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER
```

**Важно**: После добавления в группу docker нужно выйти и войти заново, либо выполнить:
```bash
newgrp docker
```

### 4. Установка Docker Compose (если не установлен через плагин)
```bash
# Проверка версии (должна быть установлена через docker-compose-plugin)
docker compose version

# Если не установлен, установите отдельно:
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 5. Клонирование проекта (если есть Git репозиторий)
```bash
# Перейдите в нужную директорию
cd ~
# Или создайте директорию для проектов
mkdir -p ~/projects
cd ~/projects

# Клонируйте репозиторий (замените URL на ваш)
git clone <ваш-git-repo-url> pcbweb
cd pcbweb
```

**Или если у вас уже есть файлы проекта:**
```bash
# Создайте директорию
mkdir -p ~/pcbweb
cd ~/pcbweb

# Загрузите файлы проекта (через scp, sftp или другим способом)
# Затем перейдите в директорию
cd ~/pcbweb
```

### 6. Настройка файрвола (если используется)
```bash
# Разрешить порты 3000 (frontend) и 3001 (backend)
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 5432/tcp  # PostgreSQL (если нужен внешний доступ)
sudo ufw reload
```

### 7. Запуск проекта
```bash
# Перейдите в директорию проекта
cd ~/pcbweb

# Запустите все сервисы
docker compose up -d --build

# Просмотр логов
docker compose logs -f
```

### 8. Проверка работы
```bash
# Проверка статуса контейнеров
docker compose ps

# Проверка логов
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

### 9. Остановка проекта
```bash
docker compose down
```

### 10. Перезапуск проекта
```bash
docker compose restart
```

### 11. Обновление проекта (если используете Git)
```bash
cd ~/pcbweb
git pull
docker compose up -d --build
```

## Быстрый скрипт (все команды подряд)

Создайте файл `setup.sh` и выполните:

```bash
#!/bin/bash

# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Git
sudo apt install git -y

# Установка зависимостей Docker
sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

# Добавление репозитория Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Установка Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Запуск Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER

echo "Установка завершена! Выполните 'newgrp docker' или перезайдите в систему"
echo "Затем перейдите в директорию проекта и выполните: docker compose up -d --build"
```

Выполните:
```bash
chmod +x setup.sh
./setup.sh
```

## Настройка для production

### Изменение портов (если нужно)

Отредактируйте `docker-compose.yml`:
```yaml
ports:
  - "80:3000"    # Frontend на порт 80
  - "3001:3001"  # Backend
```

### Использование Nginx как reverse proxy (рекомендуется)

```bash
sudo apt install nginx -y
```

Создайте конфиг `/etc/nginx/sites-available/commit-to-learn`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Активируйте:
```bash
sudo ln -s /etc/nginx/sites-available/commit-to-learn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Полезные команды

```bash
# Просмотр логов в реальном времени
docker compose logs -f

# Остановка всех контейнеров
docker compose down

# Пересоздание контейнеров (удалит volumes!)
docker compose down -v
docker compose up -d --build

# Вход в контейнер backend
docker exec -it commit-to-learn-backend sh

# Вход в контейнер postgres
docker exec -it commit-to-learn-db psql -U commit_user -d commit_to_learn

# Просмотр использования ресурсов
docker stats
```


