FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

RUN npm install

# Copy the entire codebase
COPY . .

CMD ["npm", "run", "dev"]