import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import os from "os";

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        secret: "P4-BadbeatdUri-SesionesHTTP-VariablesDeSesion",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 5 * 60 * 1000 }, // 5 minutos
    })
);

// Sesiones almacenadas en memoria 
const sessions = {};

// Función de utilidad que permite acceder a la IP del cliente
const getClientIp = (req) => {
    return (
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection?.socket?.remoteAddress
    );
};

// Función para obtener información de red del servidor
const getServerNetworkInfo = () => {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === "IPv4" && !iface.internal) {
                return { serverIp: iface.address, serverMac: iface.mac };
            }
        }
    }
};

// Login Endpoint
app.post("/login", (req, res) => {
    const { email, nickname, macAddress } = req.body;

    if (!email || !nickname || !macAddress) {
        return res.status(400).json({ message: "Falta algún campo." });
    }

    const sessionId = uuidv4();
    const now = new Date();
    const clientIp = getClientIp(req);
    const { serverIp, serverMac } = getServerNetworkInfo();

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

    res.status(200).json({
        message: "Inicio de sesión exitoso.",
        sessionId,
    });
});

// Logout Endpoint
app.post("/logout", (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ message: "No se ha encontrado una sesión activa." });
    }

    const session = sessions[sessionId];
    session.lastAccessedAt = new Date();
    session.duration = (new Date() - new Date(session.createdAt)) / 1000; // Duración final

    req.session?.destroy((err) => {
        if (err) {
            return res.status(500).send("Error al cerrar la sesión.");
        }
    });

    res.status(200).json({
        message: "Logout exitoso.",
        session,
    });
});

// Actualización de la sesión
app.put("/update", (req, res) => {
    const { sessionId, email, nickname } = req.body;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ message: "No existe una sesión activa." });
    }

    const now = new Date();
    const session = sessions[sessionId];

    if (email) session.email = email;
    if (nickname) session.nickname = nickname;

    // Cálculo de duración e inactividad
    session.duration = (now - new Date(session.createdAt)) / 1000; // en segundos
    session.inactivityTime = (now - new Date(session.lastAccessedAt)) / 1000; // en segundos

    session.lastAccessedAt = now;

    res.status(200).json({
        message: "Sesión actualizada correctamente.",
        session,
    });
});

// Estado de la sesión
app.get("/status", (req, res) => {
    const sessionId = req.query.sessionId;

    if (!sessionId || !sessions[sessionId]) {
        return res.status(404).json({ message: "No hay sesión activa." });
    }

    res.status(200).json({
        message: "Sesión activa.",
        session: sessions[sessionId],
    });
});

// Ruta principal
app.get("/", (req, res) => {
    return res.status(200).json({
        message: "Welcome! Your controls of the sessions.",
        author: "Uriel Maldonado Bernabe",
    });
});

const PORT = 3000;

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
