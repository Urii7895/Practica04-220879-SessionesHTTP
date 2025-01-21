import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Sesiones almacenadas en memoria.


app.use(
    session({
        secret: "practica-04-controlSessiones",//firma la cookie de la sesion (esto asegura que las cookies no pueden ser modificada por 3eros)
        resave:false,//evita que las sesiones se guarden nuevamente en el almacenamiento
        saveUninitialized: false,// evita que se creen sesiones vacías (no inicializadas) en el almacenamiento.
        cookie:{maxAge: 5*68*1000},//duracion de la cookie 

    })
);
// Función de utilidad que permite acceder y extraer la direccion del cliente
const getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"] || //contiene la ip del del cliente 
    req.connection.remoteAddress || //IP del cliente desde la conexión de red principal.
    req.socket.remoteAddress || //IP directamente desde el socket de la conexión.
    req.connection.socket?.remoteAddress //Otra forma de obtener la IP, en caso de que las demás no funcionen.
  );
};
const sessions = {};

// Endpoint del login  

app.post("/login", (req, res) => {
  const { email, nickname, macAddress } = req.body;//extrayendo 3 campos de la solicitud 

  if (!email || !nickname || !macAddress) {//nickname  nombreUsuario o apodo 
    return res.status(400).json({ message: "Falta algún campo." });//validacion de campos si estan vacios o no fue enviado 
  }
  const sessionId = uuidv4();//uuid indentificador unico universal ideal para identificar objetos 
  const now = new Date();//variable creada para registrar la hora en el que se crea la sesion 

  sessions[sessionId] = {//alamacenimiento de la sesion 
    sessionId,
    email,
    nickname,
    macAddress,
    ip: getClientIp(req),
    createdAt: now,
    lastAccessedAt: now,
  };

  res.status(200).json({//respuesta del usuario
    message: "Inicio de sesión exitoso.",
    sessionId,
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

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

