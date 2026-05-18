FROM httpd:2.4-alpine

# Rimuovi file inutili 
RUN rm -rf /usr/local/apache2/htdocs/*

# Crea cartelle e imposta permessi per l'utente non-root (daemon)
RUN mkdir -p /usr/local/apache2/logs/ /usr/local/apache2/conf/certs/ \
    && chown -R daemon:daemon /usr/local/apache2/logs/ \
    && chown -R daemon:daemon /usr/local/apache2/conf/

# Copia i file e assegna la proprietà a daemon
COPY --chown=daemon:daemon httpd.conf /usr/local/apache2/conf/httpd.conf
COPY --chown=daemon:daemon certs/ /usr/local/apache2/conf/certs/

# Switch a utente non privilegiato
USER daemon

# Esponi le porte ALTE (quelle che abbiamo messo nel conf)
EXPOSE 8080 8443