const express = require("express");
const cors = require('cors');
const mongoose = require("mongoose");
const port = 3001;
const session = require('express-session');
const Keycloak = require('keycloak-connect');
const jwt = require('jsonwebtoken'); 
const Token = require('keycloak-connect/middleware/auth-utils/token');

const vault = require("node-vault")({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ADDR || "http://vault:8200",
  token: process.env.VAULT_TOKEN
});

main().catch((err) => console.log(err));

async function main() {
  try {
    const vaultRes = await vault.read("secret/data/mongodb");
    const { username, password } = vaultRes.data.data;
    const mongoUri = `mongodb://${username}:${password}@mongo:27017/todos?authSource=admin&tls=true&tlsAllowInvalidCertificates=true`;
    await mongoose.connect(mongoUri, { useUnifiedTopology: true, useNewUrlParser: true });
    console.log("Connesso a MongoDB!");
  } catch (err) {
    console.error("Errore DB:", err);
    process.exit(1);
  }
  
  const app = express();
  app.set('trust proxy', true); 
  const memoryStore = new session.MemoryStore();
  
  app.use(session({ secret: 'secret', resave: false, saveUninitialized: true, store: memoryStore }));
  app.use(cors());
  app.use(express.json());

  const rawPublicKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu79N0ymAUTrfSPLzN8Fvjrska8rUgcPxCcHoxe1wJMNKo7C3XPwCWFnvtT0X4VTUM4YtUVG0y5pVlSlaMhsSzs4lbE5kU8a8XrR4adMx/ap5sj6jue1rJg+wkPfWcjnljr84V1knlNbSYEJhpTT8rJ88TCh7fkLTBqXK15nXynfrFRLgWxI5zGe230Xy6QuCbfyyOTeWnbh5WrmVXyMuhIFkz/s/SiJTGOrckRGTGZrzrH9d6hEAiI1XPz1SrZNSFD/MLDHQTzqhLNAciWRfFJFRHM1FMCbah8fjP1tBFA+w7dwa6SufOOGMlICf+1oFdhQ89ie6HXDs9IlSVz6Q/wIDAQAB";
  const formatPublicKey = (key) => {
    const cleanKey = key.replace(/(\r\n|\n|\r)/gm, "").trim(); 
    return `-----BEGIN PUBLIC KEY-----\n${cleanKey.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
  };
  const PEM_KEY = formatPublicKey(rawPublicKey);

  // CONFIGURAZIONE ENFORCER
  const kcConfig = {
    "realm": "SySec",
    "auth-server-url": "http://keycloak:8080/auth",
    "ssl-required": "external",
    "resource": "backend-node",
    "public-client": false,
    "confidential-port": 0,
    "bearer-only": true,
    "credentials": { "secret": "cA4senu3bvi4NBJ6mtMXuOmyE8kBoWka" },
    "policy-enforcer": { "mode": "enforcing", "lazy-load-paths": true }
  };

  const keycloak = new Keycloak({ store: memoryStore }, kcConfig);
// VERIFICA TOKEN
  
  app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth) return next();

    const tokenStr = auth.split(' ')[1];
    
    try {
        const decoded = jwt.verify(tokenStr, PEM_KEY, { algorithms: ['RS256'] });

        req.user = decoded; //salviamo i dati dell'utente nella richiesta corrente
                            // per visualizzarlo nell'area dedicata all'utente
                            // e per il backend per capire a quale utente associare i to do
        const kToken = new Token(decoded, 'backend-node'); 
        kToken.token = tokenStr;

        req.kauth = {   //
            grant: {
                access_token: kToken,
                toString: () => JSON.stringify(decoded)
            }
        };

        console.log(`[AUTH] Token validato manualmente per: ${decoded.preferred_username}`);
        next();

    } catch (err) {
        console.error(`[AUTH ERROR] Validazione fallita: ${err.message}`);
        next();
    }
  });

  keycloak.accessDenied = (req, res) => {
    console.error(`[SECURITY] ⛔ ACCESSO NEGATO dall'Enforcer a: ${req.originalUrl}`);
    res.status(403).json({ error: "Accesso Negato (Policy Enforcer)" });
  };

  const todosRoutesFactory = require("./routes/todos");
  const routes = todosRoutesFactory(keycloak);
  app.use("/api/todos", routes); 

  app.listen(port, () => {
    console.log(`Server attivo su porta: ${port}`);
    console.log(`Enforcer collegato a: ${kcConfig["auth-server-url"]}`);
  });
}