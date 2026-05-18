import React, { useEffect, useState, useRef } from "react";
import Keycloak from "keycloak-js";
import axios from "axios";
import {
  Button, Card, CardBody, CardTitle, ListGroup, ListGroupItem,
  Modal, ModalBody, ModalHeader, Badge, Spinner, Table, Alert
} from "reactstrap";
import TodoForm from "./todo-form";

import sfondoLogin from "../sfondo.jpg";        
import sfondoInterno from "../sfondo_comune.jpeg"; 

const API_URL = process.env.REACT_APP_API_URL || "https://localhost/api";

const keycloakClient = new Keycloak({
  url: "https://localhost/auth",
  realm: "SySec",
  clientId: "react-app",
});

const Home = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const initDone = useRef(false);

  const [todos, setTodos] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('user');

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

  keycloakClient.init({
    onLoad: 'check-sso',
    pkceMethod: 'S256',
    checkLoginIframe: false, 
    enableLogging: true
  })
    .then((authenticated) => {
      setIsAuth(authenticated);
      setLoading(false);

      if (authenticated) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${keycloakClient.token}`;
        window.history.replaceState({}, document.title, window.location.pathname);
        keycloakClient.loadUserInfo().then(info => setUserInfo(info));
        getTodos('user');
      }
    })
    .catch((err) => {
      console.error("Errore Init:", err);
      setLoading(false);
    });
  }, []);

  const isAdmin = keycloakClient.hasRealmRole('app-admin') || 
                  keycloakClient.hasResourceRole('app-admin', 'react-app');

  const isTech = keycloakClient.hasRealmRole('app-tech');                

  const getTodos = async (viewType = currentView) => {
    try {
      let url = `${API_URL}/todos`;
      if (viewType === 'admin') url += '?mode=all';
      const res = await axios.get(url);
      setTodos(res.data);
    } catch (err) { console.error("Errore fetch:", err); }
  };

  const handleNewTodo = async (todo) => { 
    try { 
        await axios.post(`${API_URL}/todos`, todo); 
        await getTodos(); 
        setModalOpen(false); 
    } catch (e) { 
        console.error(e); 
        alert("Errore salvataggio.");
    } 
  };

  const handleClick = async (id, currentStatus) => { 
    try { 
        await axios.patch(`${API_URL}/todos/${id}`, { is_complete: !currentStatus }); 
        await getTodos(); 
    } catch (e) { console.error(e); } 
  };

  const handleDelete = async (id) => {
      if (!window.confirm("Sei sicuro di voler eliminare questo task?")) return;
      try { 
          await axios.delete(`${API_URL}/todos/${id}`); 
          await getTodos(); 
      } catch (e) { console.error(e); } 
  };

  const switchView = (view) => {
      setCurrentView(view);
      getTodos(view);
  };

  // --- STILE 1: LANDING PAGE (LOGIN) ---
  const landingStyle = {
    position: 'absolute', 
    top: 0,
    left: 0,
    width: '100vw',  
    minHeight: '100vh', 
    backgroundImage: `url(${sfondoLogin})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    zIndex: 1000, 
    color: 'white',
    margin: 0, padding: 0 
  };

  // --- STILE 2: APP INTERNA (DOPO IL LOGIN) ---
  const appStyle = {
    position: 'absolute', 
    top: 0,
    left: 0,
    width: '100vw', 
    minHeight: '100vh', 
    backgroundImage: `url(${sfondoInterno})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed', 
    backgroundRepeat: 'no-repeat',
    paddingTop: '50px', 
    paddingBottom: '50px',
    margin: 0
  };

  const overlayStyle = {
    backgroundColor: 'rgba(0,0,0,0.8)', padding: '40px', borderRadius: '15px', textAlign: 'center'
  };

  // --- RENDER: LOADING ---
  if (loading) return (
    <div style={{...landingStyle, backgroundColor: '#000'}}>
        <Spinner color="primary"/> <h4 className="mt-3">Caricamento...</h4>
    </div>
  );


  // --- RENDER: LOGIN RICHIESTO ---
  if (!isAuth) {
    return (
      <div style={landingStyle}>
        <div style={overlayStyle}>
          <h1 style={{ fontSize: '3rem', margin: 0 }}>ToDo WebApp</h1>
          <p style={{marginBottom: '20px', fontSize: '1.2rem'}}>Portale di Accesso Sicuro</p>
          
          {/* --- INIZIO BANNER  ---*/}
          <div style={{
              backgroundColor: 'rgba(0,0,0,0.5)', 
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '20px', 
              borderRadius: '8px', 
              fontSize: '0.85rem', 
              color: '#e0e0e0',
              maxWidth: '600px',
              margin: '0 auto 25px auto',
              textAlign: 'justify',
              lineHeight: '1.4'
          }}>
              <strong style={{color: '#ffc107', display: 'block', marginBottom: '10px', textAlign: 'center'}}>
                 ⚠️ AVVISO DI SICUREZZA E TERMINI D'USO
              </strong>
              L'accesso a questo sistema informativo è consentito esclusivamente al personale autorizzato. 
              L'utilizzo del sistema può essere <strong>monitorato, registrato e soggetto ad audit</strong> di sicurezza. 
              L'accesso non autorizzato o l'uso improprio è severamente proibito e può comportare sanzioni civili e penali ai sensi delle normative vigenti. 
              <br/><br/>
              <em>Cliccando su "Accedi", l'utente dichiara di aver letto questo avviso e acconsente esplicitamente al monitoraggio delle attività.</em>
          </div>
          {/* --- FINE BANNER --- */}

          <button onClick={() => keycloakClient.login({redirectUri: "https://localhost/"})} style={{
              padding: '15px 50px', fontSize: '18px', cursor: 'pointer',
              backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '50px', 
              fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,123,255,0.4)'
          }}>
            ACCETTA E ACCEDI
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA: AREA AMMINISTRATORE ---
  if (currentView === 'admin') {
    if (!isAdmin) {
        return (
            <div style={appStyle}>
                <div className="container text-center">
                    <Alert color="danger" className="p-5 shadow">
                        <h1 style={{fontSize: '4rem'}}>🚫</h1>
                        <h2>Accesso Negato</h2>
                        <Button color="dark" size="lg" onClick={() => switchView('user')}>&larr; Indietro</Button>
                    </Alert>
                </div>
            </div>
        );
    }

    return (
        <div style={appStyle}>
            <div className="container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="text-white" style={{textShadow: '2px 2px 4px #000'}}>Area Amministratore</h2>
                    <Button color="light" onClick={() => switchView('user')}>&larr; Torna alla Home</Button>
                </div>

                <Card className="shadow border-danger">
                    <CardBody>
                        <Table striped hover responsive>
                            <thead>
                                <tr><th>Proprietario</th><th>Task</th><th>Stato</th><th>Azioni</th></tr>
                            </thead>
                            <tbody>
                                {todos.map(todo => (
                                    <tr key={todo._id}>
                                        <td><Badge color="info">{todo.owner_name || 'N/A'}</Badge></td>
                                        <td><strong>{todo.title}</strong><br/><small>{todo.description}</small></td>
                                        <td>{todo.is_complete ? <Badge color="success">Fatto</Badge> : <Badge color="warning">In Corso</Badge>}</td>
                                        <td><Button color="danger" size="sm" onClick={() => handleDelete(todo._id)}>Elimina</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
  }


// --- VISTA: AREA TECNICA ---
  if (currentView === 'tech') {
    if (!isTech) {
        return (
            <div style={appStyle}>
                <div className="container text-center">
                    <Alert color="danger" className="p-5 shadow">
                        <h1>🚫</h1>
                        <h2>Accesso Negato</h2>
                        <p>Questa sezione è riservata ai tecnici di sistema.</p>
                        <Button color="dark" onClick={() => switchView('user')}>&larr; Indietro</Button>
                    </Alert>
                </div>
            </div>
        );
    }

  return (
      <div style={appStyle}>
          <div className="container">
              <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="text-white" style={{textShadow: '2px 2px 4px #000'}}>🛠️ Pannello Manutenzione Tecnico</h2>
                  <Button color="light" onClick={() => switchView('user')}>&larr; Torna alla Home</Button>
              </div>

              <div className="row">
                  <div className="col-md-6 mb-4">
                      <Card className="shadow h-100">
                          <CardBody>
                              <CardTitle tag="h5">Stato Infrastruttura</CardTitle>
                              <Table borderless size="sm">
                                  <tbody>
                                      <tr><td>Database:</td><td><Badge color="success">OPERATIVO</Badge></td></tr>
                                      <tr><td>Keycloak:</td><td><Badge color="success">CONNESSO</Badge></td></tr>
                                      <tr><td>API Backend:</td><td><Badge color="success">ONLINE</Badge></td></tr>
                                  </tbody>
                              </Table>
                          </CardBody>
                      </Card>
                  </div>
                  <div className="col-md-6 mb-4">
                      <Card className="shadow h-100">
                          <CardBody>
                              <CardTitle tag="h5">Log di Sistema (Live)</CardTitle>
                              <div style={{backgroundColor: '#1e1e1e', color: '#00ff00', padding: '10px', borderRadius: '5px', fontFamily: 'monospace', fontSize: '12px', height: '150px', overflowY: 'auto'}}>
                                  [INFO] User {userInfo?.preferred_username} logged in<br/>
                                  [INFO] Fetching todos for session...<br/>
                                  [DEBUG] Token validation: SUCCESS<br/>
                                  [WARN] High memory usage detected in backend...
                              </div>
                          </CardBody>
                      </Card>
                  </div>
              </div>
          </div>
      </div>
  );
}


  // --- VISTA: HOME STANDARD ---
  return (
    <div style={appStyle}>
        <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="text-white" style={{textShadow: '2px 2px 4px #000'}}>
                        Ciao, {userInfo?.given_name || 'Utente'}
                    </h2>
                    <div className="d-flex gap-2">
                        {isAdmin && <Badge color="danger" className="p-2">ADMIN</Badge>}
                        {isTech && <Badge color="info" className="p-2">TECNICO</Badge>}
                        {!isAdmin && !isTech && <Badge color="success" className="p-2">IMPIEGATO</Badge>}
                    </div>
                </div>
                <div>
                    {/* Bottone Area Admin: visibile solo agli Amministratori */}
                    {isAdmin && (
                        <Button color="light" className="me-2" onClick={() => switchView('admin')}>
                            ⚙️ Area Admin
                        </Button>
                    )}

                    {/* Bottone Area Tecnica: visibile a Tecnici e Amministratori */}
                    {isTech && (
                        <Button color="warning" className="me-2" onClick={() => switchView('tech')}>
                            🛠️ Area Tecnica
                        </Button>
                    )}

                    <Button color="danger" onClick={() => keycloakClient.logout({redirectUri: "https://localhost/"})}>
                        Logout
                    </Button>
                </div>
            </div>

            {(!isTech || isAdmin || keycloakClient.hasRealmRole('app-user')) ? (
                <Card className="shadow">
                    <CardBody>
                        <div className="d-flex justify-content-between mb-3">
                            <CardTitle tag="h3">Le tue Attività</CardTitle>
                            <Button color="primary" onClick={() => setModalOpen(true)}>+ Nuovo</Button>
                        </div>
                        <ListGroup>
                            {todos.length === 0 && <p className="text-muted text-center">Nessun task personale.</p>}
                            {todos.map((todo) => (
                                <ListGroupItem key={todo._id} className="d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center">
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input me-3" 
                                            style={{transform: 'scale(1.2)', cursor: 'pointer'}} 
                                            checked={todo.is_complete} 
                                            onChange={() => handleClick(todo._id, todo.is_complete)} 
                                        />
                                        <div>
                                            <span style={{
                                                textDecoration: todo.is_complete ? 'line-through' : 'none', 
                                                color: todo.is_complete ? '#aaa' : 'inherit'
                                            }}>
                                                {todo.title}
                                            </span>
                                            <div className="text-muted small">{todo.description}</div>
                                        </div>
                                    </div>
                                    <Button color="danger" outline size="sm" onClick={() => handleDelete(todo._id)}>&times;</Button>
                                </ListGroupItem>
                            ))}
                        </ListGroup>
                    </CardBody>
                </Card>
            ) : (
                <Card className="shadow border-info text-center p-5">
                    <CardBody>
                        <h4 className="text-info">Profilo Tecnico Rilevato</h4>
                        <p>Utilizza il pulsante in alto per accedere agli strumenti di manutenzione.</p>    
                    </CardBody>
                </Card>
            )}

            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)}>
                <ModalHeader>Nuovo Task</ModalHeader>
                <ModalBody><TodoForm saveTodo={handleNewTodo} /></ModalBody>
            </Modal>
        </div>
    </div>
  );
};

export default Home;