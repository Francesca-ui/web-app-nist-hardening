# 1. Versione Pinned e Minimale
FROM node:18.19-alpine

# 2. FONDAMENTALE: Crea la cartella e assegna i permessi all'utente node
# Senza questa riga, 'npm ci' fallisce perché non ha i permessi di scrittura
RUN mkdir -p /app && chown -R node:node /app

WORKDIR /app

# 3. Copia i file di dipendenza assegnandoli all'utente node
COPY --chown=node:node package*.json ./

# 4. Passa all'utente non-root PRIMA di installare
USER node

# 5. Installazione deterministica
RUN npm ci

# 6. Copia il resto del codice
COPY --chown=node:node . .

EXPOSE 3000
CMD ["npm", "start"]