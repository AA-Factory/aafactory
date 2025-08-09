FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Install wait-port to wait for MongoDB port
RUN npm install -g wait-port

EXPOSE 3000

CMD sh -c "wait-port mongodb:27017 && node scripts/check-db.js && npm run dev"
