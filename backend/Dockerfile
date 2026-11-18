
FROM php:8.3-apache

RUN docker-php-ext-install pdo pdo_mysql

# Deshabilitar individualmente los MPM incompatibles
RUN a2dismod mpm_event || true
RUN a2dismod mpm_worker || true

# Habilitar el MPM adecuado para PHP
RUN a2enmod mpm_prefork
RUN a2enmod rewrite

WORKDIR /var/www/html

EXPOSE 80

# Verificar la configuración de Apache durante la construcción
RUN apache2ctl -M
