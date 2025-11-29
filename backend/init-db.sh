#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U commit_user; do
  sleep 1
done

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Database initialized successfully!"

