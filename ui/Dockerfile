# STAGE 1: Build the React Application
FROM node:26-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build 

# STAGE 2: Serve internally with Nginx
FROM nginx:alpine

# 🚀 1. Forcefully delete the default Nginx welcome page!
RUN rm -rf /usr/share/nginx/html/*

# 🚀 2. Inject a custom config so the internal UI Nginx understands React Router
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

# 🚀 3. Copy your compiled Vite files into the now-empty public folder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]