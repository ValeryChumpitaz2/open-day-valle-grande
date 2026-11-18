
FROM php:8.3-apache

# Instalar extensiones necesarias para MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Configurar Apache con un único módulo MPM
RUN find /etc/apache2/mods-enabled -maxdepth 1 \
    \( -name 'mpm_*.load' -o -name 'mpm_*.conf' \) \
    -delete \
    && ln -s ../mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load \
    && ln -s ../mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf \
    && a2enmod rewrite \
    && apache2ctl -t

WORKDIR /var/www/html

# Copiar los archivos del backend al contenedor
COPY . /var/www/html/

EXPOSE 80
