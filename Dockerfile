
# ETAPA 1: Construcción de React
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# URL del backend en Railway
ARG VITE_API_URL=https://open-day-valle-grande-production.up.railway.app
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ETAPA 2: Servidor Nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
