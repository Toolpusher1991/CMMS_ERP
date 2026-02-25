FROM node:22-alpine

# Install system dependencies for pdf2pic
RUN apk add --no-cache graphicsmagick ghostscript

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose port (actual port is set via PORT env var)
EXPOSE 10000

# Start command
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
