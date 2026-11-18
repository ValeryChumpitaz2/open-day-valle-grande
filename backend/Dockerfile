
FROM php:8.3-apache

# Instalar extensiones para MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Limpiar todos los módulos MPM habilitados y activar solo prefork
RUN find /etc/apache2/mods-enabled -maxdepth 1 \
    \( -name 'mpm_*.load' -o -name 'mpm_*.conf' \) \
    -delete \
    && ln -s ../mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load \
    && ln -s ../mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf \
    && a2enmod rewrite \
    && apache2ctl -t

WORKDIR /var/www/html

EXPOSE 80
