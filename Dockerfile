FROM node:18-alpine

# Install git
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# We don't COPY anything here because we clone the repo dynamically
# But we can pre-set some environment variables if needed

# This container will just stay alive or we can use it as a base
CMD ["node"]
