FROM php:8.1-apache

RUN a2enmod rewrite

COPY . /var/www/html/

EXPOSE 80
