# 1. Usiamo un'immagine specifica per evitare aggiornamenti imprevisti
FROM hashicorp/vault:1.21.1

# 2. Crea le cartelle necessarie
RUN mkdir -p /vault/file /vault/logs

# 3. ASSEGNA I PERMESSI DURANTE LA BUILD
# L'utente 'vault' ha UID 100 e GID 1000 standard nell'immagine Hashicorp
RUN chown -R 100:1000 /vault

# 4. Diciamo a Docker che questa immagine deve usare l'utente 100 di default
USER 100

# 5. Definiamo l'entrypoint pulito
ENTRYPOINT ["vault", "server", "-config=/vault/config/vault.json"]