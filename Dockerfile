# ==============================================================================
# Anime Jeopardy - Lightweight Dockerfile for Raspberry Pi & ARM Architecture
# ==============================================================================
# Base image: Official nginx:alpine (multi-arch, ~20MB, ultra-low RAM usage)
FROM nginx:alpine

# Metadata labels
LABEL maintainer="Anime Jeopardy Game Night"
LABEL description="Offline Anime Jeopardy game for Raspberry Pi and Portainer"
LABEL architecture="arm64, armv7, amd64"

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy custom nginx configuration for optimal caching & mime types
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy standalone static web application (HTML, CSS, JS, assets)
COPY standalone/ /usr/share/nginx/html/

# Create images folder in case volume is not mounted
RUN mkdir -p /usr/share/nginx/html/images

# Expose standard HTTP port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
