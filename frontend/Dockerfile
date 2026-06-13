FROM node:18-alpine

WORKDIR /app

# Install deps first (cached layer)
COPY package.json package-lock.json ./
RUN npm ci --silent

# Copy the rest of the source
# (src/ and public/ are overridden by the volume mount in docker-compose
#  so this COPY is only used for standalone builds)
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
