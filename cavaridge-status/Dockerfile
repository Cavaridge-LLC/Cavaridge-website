FROM node:20-alpine

RUN addgroup --system --gid 1001 cavaridge && adduser --system --uid 1001 cavaridge

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src/ ./src/
COPY public/ ./public/

USER cavaridge
EXPOSE 3900

CMD ["node", "src/server.js"]
