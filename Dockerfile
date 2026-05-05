# Use official Node.js LTS image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build frontend if present
RUN if [ -d "client" ]; then cd client && npm ci && npm run build && cd ..; fi

ENV NODE_ENV=production

EXPOSE 5000

CMD ["node", "server.js"]
