# Use the official Bun image for best compatibility and performance
FROM oven/bun:1.1.0

# Set the working directory inside the container
WORKDIR /app

# Copy dependency files first for better Docker caching
COPY bun.lock package.json ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of your application code
COPY . .

# Expose the backend port (change if your BACKEND_PORT is different)
EXPOSE 3000

# Start the server (adjust if your entry point is different)
CMD ["bun", "run", "src/server.ts"]