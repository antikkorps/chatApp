#!/bin/sh
echo "Running Prisma db push..."
npx prisma db push
echo "Starting the application..."
exec "$@"