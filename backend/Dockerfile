
FROM php:8.3-apache

# Instalar las extensiones necesarias para MySQL
RUN docker-php-ext-install pdo pdo_mysql

# Eliminar todos los módulos MPM habilitados
RUN rm -f /etc/apache2/mods-enabled/mpm_*.load \
          /etc/apache2/mods-enabled/mpm_*.conf

# Habilitar únicamente prefork y rewrite
RUN a2enmod mpm_prefork rewrite

# Verificar que Apache tenga una configuración válida
RUN apache2ctl -t && apache2ctl -M

WORKDIR /var/www/html

EXPOSE 80
