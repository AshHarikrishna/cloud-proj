# # Stage 1: Build React app
# FROM node:18 AS build

# WORKDIR /app

# # Copy package.json and package-lock.json
# COPY package*.json ./

# # Install dependencies
# RUN npm install

# # Copy all source code
# COPY . .

# # Build the app
# RUN npm run build

# # Stage 2: Serve app with lightweight web server
# FROM nginx:alpine

# # Copy built files from Stage 1
# COPY --from=build /app/build /usr/share/nginx/html

# # Expose port 3000
# EXPOSE 3000

# # Start Nginx server
# CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build React app
FROM node:18 AS build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source code
COPY . .

# ✅ Accept build argument and set as environment variable
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the app (REACT_APP_API_URL will be baked into the build)
RUN npm run build

# Stage 2: Serve app with lightweight web server
FROM nginx:alpine

# Copy built files from Stage 1
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 (not 3000, since nginx serves on 80 by default)
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]