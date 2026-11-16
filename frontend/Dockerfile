FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
ENV CYPRESS_INSTALL_BINARY=0
RUN npm install

COPY . .

RUN npm run build

EXPOSE 4173

CMD ["./node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "4173"]
