const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit"); // 1. Importa il pacchetto per DOS

const todos = require('./todos');

// 2. Configura il limitatore (NIST SC-5)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 100, // Limite di 100 richieste per IP
    standardHeaders: true, 
    legacyHeaders: false,
    message: {
        status: 429,
        error: "Troppe richieste. Protezione DoS attiva: riprova tra 15 minuti."
    }
});

// 3. Applica il limitatore a TUTTE le rotte definite sotto
router.use(limiter);

router.get("/", (req, res) => {
  res.send("main page!");
});

router.use("/todos", todos);

module.exports = router;