# 1. Specifica versione esplicita e minimale (Pilastro: Minimalismo/Immutabilità)
FROM node:18.19-alpine

# 2. Crea la cartella e imposta i permessi (Pilastro: Least Privilege)
# Creiamo la cartella come root ma la assegniamo subito all'utente 'node'
RUN mkdir -p /app && chown -R node:node /app

WORKDIR /app

# 3. Copia solo i file di definizione delle dipendenze
# Fondamentale: copiamo anche package-lock.json per far funzionare 'npm ci'
COPY --chown=node:node package*.json ./

# 4. Passa all'utente non-root PRIMA di installare qualsiasi cosa
USER node

# 5. Installazione pulita e limitata
# 'ci' usa il lockfile esatto. '--only=production' evita devDependencies (meno roba = meno rischi)
RUN npm ci --only=production

# 6. Copia il resto del codice
COPY --chown=node:node . .

EXPOSE 3001

CMD ["node", "server.js"]