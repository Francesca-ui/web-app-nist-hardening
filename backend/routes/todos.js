const express = require("express");
const router = express.Router();
const Todo = require("../models/Todo"); 

module.exports = function(keycloak) {

  // Funzione per estrarre l'utente 
  const getUserName = (req) => {
    if (req.user && req.user.preferred_username) {
        return req.user.preferred_username;
    }
    // Fallback al metodo standard Keycloak (se mai servisse)
    if (req.kauth && req.kauth.grant && req.kauth.grant.access_token) {
        return req.kauth.grant.access_token.content.preferred_username;
    }
    return null;
  };

  // GET
  router.get("/", keycloak.enforcer(), async (req, res) => {
    console.log("--> [SUCCESS] GET approvato.");
    try {
      const currentUser = getUserName(req);
      
      // Recuperiamo i ruoli
      let roles = [];
      if (req.user && req.user.realm_access) {
          roles = req.user.realm_access.roles;
      } else if (req.kauth && req.kauth.grant && req.kauth.grant.access_token) {
          roles = req.kauth.grant.access_token.content.realm_access.roles;
      }

      const isAdmin = roles.includes('app-admin');
      
      let query = isAdmin ? {} : { owner: currentUser };
      const todos = await Todo.find(query);
      res.json(todos);
    } catch (err) {
      console.error("Errore GET:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST
  router.post("/", keycloak.enforcer(), async (req, res) => {
    console.log("--> [SUCCESS] POST approvato.");
    try {
      const currentUser = getUserName(req);

      if (!currentUser) {
          console.error("ERRORE: Utente non identificato nel token");
          return res.status(400).json({ error: "Impossibile identificare l'utente (Owner mancante)" });
      }

      const newTodo = new Todo({
        title: req.body.title,
        description: req.body.description,
        due_date: req.body.due_date,
        completed: false,
        owner: currentUser 
      });

      const savedTodo = await newTodo.save();
      res.status(201).json(savedTodo);
    } catch (err) {
      console.error("Errore POST:", err); 
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  router.delete("/:id", keycloak.enforcer(), async (req, res) => {
      console.log(`--> [SUCCESS] DELETE approvato.`);
      try {
          const todoToDelete = await Todo.findById(req.params.id);
          if (!todoToDelete) return res.status(404).json({ error: "Task non trovato" });

          const currentUser = getUserName(req);
          
          let roles = [];
          if (req.user && req.user.realm_access) roles = req.user.realm_access.roles;

          const isAdmin = roles.includes('app-admin');
          const isOwner = todoToDelete.owner === currentUser;

          if (!isAdmin && !isOwner) return res.status(403).json({ error: "Non puoi eliminare task altrui." });

          await Todo.findByIdAndDelete(req.params.id);
          res.json({ message: "Task eliminato con successo" });
      } catch (err) {
          res.status(500).json({ error: err.message });
      }
  });

  return router;
};