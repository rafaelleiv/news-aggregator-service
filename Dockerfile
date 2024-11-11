# Use the official Node.js image based on Alpine Linux
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json files to the working directory
COPY package*.json ./

# Copy all files from the current directory to the working directory
COPY . .

# Install dependencies specified in package.json
RUN npm install

# Build the application
RUN npm run build

# Expose port 3001 to the outside world
EXPOSE 3001

# Command to run the application in production mode
#CMD ["npm", "run", "start:prod"]
