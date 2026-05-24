# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL deps (including devDeps for TypeScript build)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript → compiles to dist/
RUN npm run build

# Remove devDependencies after build (keeps image small)
RUN npm prune --production

# Expose your port
EXPOSE 3001

# Run the compiled JS
CMD ["node", "dist/app.js"]