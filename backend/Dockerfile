FROM node:18-alpine

WORKDIR /app

# Install postgresql-client for health checks
RUN apk add --no-cache postgresql-client

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

RUN npx prisma generate

COPY . .

EXPOSE 3001

# Create uploads directory
RUN mkdir -p uploads

# Make init script executable
RUN chmod +x init-db.sh || true

CMD ["sh", "-c", "sleep 5 && npx prisma db push --accept-data-loss || npx prisma migrate deploy && npm run dev"]

