// Importamos las dependencias
const express = require('express');
const session = require('express-session');
const uuid = require('uuid');
const os = require('os');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 30 * 60 * 1000 }, // 30 minutos
}));

// Función para obtener la MAC Address del servidor
const getMacAddress = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const iface of Object.values(networkInterfaces)) {
    for (const config of iface) {
      if (!config.internal && config.mac) {
        return config.mac;
      }
    }
  }
  return 'Unknown';
};

// Endpoints

// 1. Login
app.post('/login', (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    return res.status(400).json({ message: 'Nombre completo y email son requeridos.' });
  }

  const sessionId = uuid.v4();
  const now = new Date();

  req.session.user = {
    id: sessionId,
    fullName,
    email,
    creationDate: now,
    lastAccess: now,
    ipClient: req.ip,
    macClient: '00:00:00:00:00:00', // Placeholder para obtener la MAC del cliente
    ipServer: req.hostname,
  };

  res.status(200).json({ message: 'Sesión iniciada.', sessionId });
});

// 2. Logout
app.post('/logout', (req, res) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error al cerrar la sesión.' });
      }
      res.status(200).json({ message: 'Sesión cerrada correctamente.' });
    });
  } else {
    res.status(400).json({ message: 'No hay sesión activa.' });
  }
});

// 3. Update
app.put('/update', (req, res) => {
  if (!req.session.user) {
    return res.status(400).json({ message: 'No hay sesión activa para actualizar.' });
  }

  const { fullName, email } = req.body;

  if (fullName) req.session.user.fullName = fullName;
  if (email) req.session.user.email = email;
  req.session.user.lastAccess = new Date();

  res.status(200).json({ message: 'Sesión actualizada.', session: req.session.user });
});

// 4. Status
app.get('/status', (req, res) => {
  if (!req.session.user) {
    return res.status(404).json({ message: 'No hay sesión activa.' });
  }

  const now = new Date();
  const duration = (now - req.session.user.creationDate) / 1000; // Duración en segundos
  const inactivity = (now - req.session.user.lastAccess) / 1000; // Inactividad en segundos

  res.status(200).json({
    sessionId: req.session.user.id,
    duration: `${duration} segundos`,
    inactivity: `${inactivity} segundos`,
    session: req.session.user,
  });
});

// 5. List current sessions
app.get('/listcurrent', (req, res) => {
  if (!req.session.user) {
    return res.status(404).json({ message: 'No hay sesión activa.' });
  }

  res.status(200).json({ activeSession: req.session.user });
});

// Servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log(`MAC Address del servidor: ${getMacAddress()}`);
});
