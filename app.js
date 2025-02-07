import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import cors from "cors";

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Sesiones almacenadas en memoria.


app.use(
    session({
        secret: " P4-UMBpalabrapilin",//firma la cookie de la sesion (esto asegura que las cookies no pueden ser modificada por 3eros)
        resave:false,//evita que las sesiones se guarden nuevamente en el almacenamiento
        saveUninitialized: false,// evita que se creen sesiones vacías (no inicializadas) en el almacenamiento.
        cookie:{maxAge: 5*68*1000},//duracion de la cookie 

    })
);


//endpint de hola 
app.get('/' ,(request,response) =>{
  return response.status(200).json({message:"bienvenido ala Api de control de sesiones",
                                        author:"Uriel Maldonado Bernabe."})
})




// Función de utilidad que permite acceder y extraer la direccion del cliente
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"] || // Contiene la IP del cliente
    req.connection.remoteAddress || // IP del cliente desde la conexión de red principal.
    req.socket.remoteAddress || // IP directamente desde el socket de la conexión.
    req.connection.socket?.remoteAddress // Otra forma de obtener la IP, en caso de que las demás no funcionen.
  );
};

const sessions = {};

// Funcionalidad que nos permite acceder a la información de la interfaz gráfica de red
const getServerNetworkInfo = () => {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) { // Corregido: 'interfaces[name]' en lugar de 'interfaces'
      if (iface.family === 'IPv4' && !iface.internal) { // Corregido: 'iface.internal'
        return { serverIp: iface.address, serverMac: iface.mac };
      }
    }
  }
};

app.post("/login", (req, res) => {
  const { email, nickname, macAddress } = req.body;

  if (!email || !nickname || !macAddress) {
    return res.status(400).json({ message: "Falta algún campo." });
  }
  const sessionId = uuidv4();
  const now = new Date();
  const clientIp = getClientIp(req); // IP del cliente
  const { serverIp, serverMac } = getServerNetworkInfo(); // IP y MAC del servidor

  // Guardar la sesión con la información solicitada
  sessions[sessionId] = {
    sessionId,
    email,
    nickname,
    macAddress,
    clientIp, // IP del cliente
    serverIp, // IP del servidor
    serverMac, // MAC del servidor
    createdAt: now,
    lastAccessedAt: now,
    duration: 0, // Inicializamos duración
    inactivityTime: 0, // Inicializamos inactividad
  };

  // Respuesta con las IPs y MACs
  res.status(200).json({
    message: "Inicio de sesión exitoso.",
    sessionId,
    clientIp,  // IP del cliente
    serverIp,  // IP del servidor
    serverMac, // Dirección MAC del servidor
    clientMac: macAddress, // Dirección MAC del cliente
  });
});



// Logout Endpoint para cerrar sesion 
app.post("/logout", (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId || !sessions[sessionId]) {// comprobar si hay sesiones activas con ese ID 
    return res.status(404).json({ message: "No se ha encontrado una sesión activa." });
  }

  delete sessions[sessionId];// destruccion de la sesion 

  req.session?.destroy((err) => {//Verifica si req.session existe y llama al método destroy para eliminar los datos de la sesión en el servidor.
    if (err) {
      return res.status(500).send("Error al cerrar la sesión.");//si existe una error durante la sesso lo mostrara 
    }
  });
  res.status(200).json({ message: "Logout exitoso." });//respuesta si todo sale bien 
});


// Actualización de la sesión
app.put("/update", (req, res) => { //definicion de la ruta 
  const { sessionId, email, nickname } = req.body;//aqui se extra estos datos para llenarlos y actualizar los datos 

  if (!sessionId || !sessions[sessionId]) {//verifica que exista una session activa con el ID 
    return res.status(404).json({ message: "No existe una sesión activa." });
  }
  if (email) sessions[sessionId].email = email;//actualizan de los campos 
  if (nickname) sessions[sessionId].nickname = nickname;
  sessions[sessionId].lastAccessedAt = new Date();//actualizacion de la ultima fecha de la sesion fecha y hora actual 

  res.status(200).json({//respuesta de la funcion si se realizo con exito o no 
    message: "Sesión actualizada correctamente.",
    session: {
      sessionId,
      email: sessions[sessionId].email,//respuesta de exito con los datos actualizados 
      nickname: sessions[sessionId].nickname,
      lastAccessedAt: sessions[sessionId].lastAccessedAt,
    },
  });
});

// Estado de la sesión
app.get("/status", (req, res) => {
  const sessionId = req.query.sessionId;//requiere del ID 

  if (!sessionId || !sessions[sessionId]) {//verifiacaison de la sesion existe con el ID 
    return res.status(404).json({ message: "No hay sesión activa." });
  }

  res.status(200).json({//respuesta de la funcion si se realizo el codigo 
    message: "Sesión activa.",
    session: sessions[sessionId],
  });
});




app.get("/sessions", (req, res) => {
  if (!sessions || Object.keys(sessions).length === 0) {
    return res.status(404).json({
      message: "No hay sesiones activas.",
    });
  }

  const activeSessions = Object.entries(sessions).map(([sessionId, sessionData]) => {
    return {
      sessionId,
      sessionData,
    };
  });

  res.status(200).json({
    message: "Listado de sesiones activas.",
    activeSessions,
  });
});





app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
