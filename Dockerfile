# Use a Node.js base image
FROM node:14

# Create a directory for the app
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install application dependencies
RUN apt-get update && apt-get install -y ffmpeg
RUN npm install

# Copy the entire application code to the container
COPY . .

# Create a "data" directory to store converted GIFs
RUN mkdir /app/data

# Add the "uploads" directory
COPY ./uploads /app/uploads

# Add the "views" directory with Pug templates
COPY ./views /app/views

# Expose the port on which your Node.js application runs (if applicable)
EXPOSE 3004

# Command to start the Node.js application
CMD ["node", "app.js"]
