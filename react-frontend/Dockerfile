# Use an official Node.js runtime as the base image
FROM node:18-bullseye-slim AS base

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json  ./

# Install project dependencies
RUN npm install

# Copy the rest of the application files to the container
COPY . .