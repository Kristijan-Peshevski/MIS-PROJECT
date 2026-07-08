# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Run npm install with legacy-peer-deps to avoid any potential resolution blocks
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Run stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
