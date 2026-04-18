FROM node:18-slim

# Install git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# This container will just stay alive or we can use it as a base
CMD ["node"]
