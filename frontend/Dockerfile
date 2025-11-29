FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Отключение проверки Host header для работы через домен
ENV DANGEROUSLY_DISABLE_HOST_CHECK=true
ENV HOST=0.0.0.0

CMD ["npm", "start"]

