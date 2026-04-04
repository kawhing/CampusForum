FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com && npm install --only=production

COPY src/ ./src/

EXPOSE 5000

CMD ["node", "src/app.js"]
