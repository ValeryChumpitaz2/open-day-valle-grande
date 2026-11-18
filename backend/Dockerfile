
FROM php:8.3-apache

# Instalar extensiones para conectar PHP con MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Evitar que Apache cargue varios módulos MPM
RUN a2dismod mpm_event mpm_worker || true

# Habilitar únicamente el MPM compatible con PHP
RUN a2enmod mpm_prefork rewrite

WORKDIR /var/www/html

EXPOSE 80
