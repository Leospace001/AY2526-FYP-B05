# Use the official Node.js version from https://hub.docker.com/
FROM node:18-alpine3.17

# Set the working directory inside the container to /app
WORKDIR /app

# Copy only the package.json file to the working directory
COPY . /app
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm config set strict-ssl false
# Install npm dependencies based on the package.json
RUN npm ci

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 5002 to allow external access
EXPOSE 5173

# Specify the command to run the application when the container starts
CMD [ "npm", "run", "dev"]