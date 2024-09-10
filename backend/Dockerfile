# Use an official Node.js runtime as the base image
FROM node:18-alpine AS base

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json  ./

# Install project dependencies
RUN npm install

# Copy the rest of the application files to the container
COPY . .
# Expor a porta que o Strapi usará
EXPOSE 1337

# Comando de inicialização para garantir que a aplicação rode
CMD ["npm", "run", "start"]
