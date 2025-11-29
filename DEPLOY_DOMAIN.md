# 🌐 Настройка домена pcb.keep-pixel.ru

## Текущая ситуация

- **IP сервера**: 144.31.69.129
- **Домен**: pcb.keep-pixel.ru (A запись уже настроена в Cloudflare)
- **Проблема**: Frontend пытается обращаться к localhost:3001 вместо домена

## Решение

### 1. Обновить docker-compose.yml

Уже обновлен: `REACT_APP_API_URL` теперь использует домен `https://pcb.keep-pixel.ru/api`

### 2. Настроить Nginx как reverse proxy

Выполните на сервере:

```bash
# Установка Nginx
sudo apt install nginx -y

# Копирование конфигурации
sudo cp nginx/nginx.conf /etc/nginx/sites-available/commit-to-learn

# Активация конфигурации
sudo ln -sf /etc/nginx/sites-available/commit-to-learn /etc/nginx/sites-enabled/

# Удаление дефолтного конфига
sudo rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

Или используйте скрипт:
```bash
chmod +x setup-nginx.sh
./setup-nginx.sh
```

### 3. Пересобрать и перезапустить проект

```bash
cd ~/pcbweb

# Остановить текущие контейнеры
docker compose down

# Пересобрать с новыми настройками
docker compose up -d --build

# Проверить логи
docker compose logs -f
```

### 4. Настройка файрвола

```bash
# Разрешить HTTP и HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

### 5. Проверка работы

Откройте в браузере:
- http://pcb.keep-pixel.ru
- http://144.31.69.129

Оба должны работать и обращаться к API через домен.

## Настройка HTTPS (SSL) - опционально

### Вариант 1: Cloudflare SSL (проще)

Если используете Cloudflare, включите "Flexible SSL" или "Full SSL" в настройках Cloudflare. Тогда HTTPS будет работать автоматически.

### Вариант 2: Let's Encrypt (рекомендуется для production)

```bash
# Установка certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d pcb.keep-pixel.ru

# Автоматическое обновление
sudo certbot renew --dry-run
```

После получения сертификата:
1. Раскомментируйте HTTPS секцию в `nginx/nginx.conf`
2. Скопируйте обновленный конфиг: `sudo cp nginx/nginx.conf /etc/nginx/sites-available/commit-to-learn`
3. Перезапустите Nginx: `sudo systemctl restart nginx`

## Структура URL

После настройки:
- **Frontend**: http://pcb.keep-pixel.ru (или https://)
- **Backend API**: http://pcb.keep-pixel.ru/api
- **Uploads**: http://pcb.keep-pixel.ru/uploads

## Проверка конфигурации

```bash
# Проверить статус Nginx
sudo systemctl status nginx

# Проверить логи Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Проверить конфигурацию
sudo nginx -t

# Перезагрузить конфигурацию без перезапуска
sudo nginx -s reload
```

## Troubleshooting

### Если не работает:

1. Проверьте, что порты 3000 и 3001 открыты локально:
```bash
curl http://localhost:3000
curl http://localhost:3001/api/health
```

2. Проверьте, что Nginx запущен:
```bash
sudo systemctl status nginx
```

3. Проверьте логи:
```bash
sudo tail -f /var/log/nginx/error.log
docker compose logs backend
docker compose logs frontend
```

4. Проверьте, что домен указывает на правильный IP:
```bash
nslookup pcb.keep-pixel.ru
# Должен вернуть 144.31.69.129
```

