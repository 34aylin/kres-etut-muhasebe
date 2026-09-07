# NOT: Bu, Faz 0/1 için basit bir geliştirme imajıdır.
# Çok aşamalı (multi-stage) production imajı Faz 6 kapsamındadır.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* .npmrc* ./
RUN npm install

COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
