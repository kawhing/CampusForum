FROM node:18 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm config set registry https://registry.npmmirror.com && npm install

COPY public/ ./public/
COPY src/ ./src/

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

FROM node:18 AS runtime

WORKDIR /app

COPY --from=builder /app/build ./build
COPY server.js ./server.js



EXPOSE 80

CMD ["node", "server.js"]
