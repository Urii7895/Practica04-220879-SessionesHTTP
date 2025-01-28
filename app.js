import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import os from "os";
import ControlSession from "./model.js"; // Importar el modelo de la sesión
import './index.js'; // Asegurarnos de que index.js (conexión) se ejecute antes

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
    session({
        secret: "P4-UbadbeatdUri-SesionesHTTP-VariablesDeSesion",
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 5 * 60 * 1000 } // Tiempo de expiración de la sesión (5 minutos)
    })
);

// Función para obtener la IP del cliente
const getClientIp = (req) => {
    return (
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket?.remoteAddress
    );
};

// Función para obtener la IP y MAC del servidor
const getServerNetworkInfo = () => {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return { serverIp: iface.address, serverMac: iface.mac };
            }
        }
    }
};

// Endpoint para login
app.post("/login", async (req, res) => {
    const { email, nickname, macAddress, fullName } = req.body;

    if (!email || !nickname || !macAddress || !fullName) {
        return res.status(400).json({ message: "Falta algún campo." });
    }

    const sessionId = uuidv4();
    const now = new Date();
    const clientIp = getClientIp(req);
    const { serverIp, serverMac } = getServerNetworkInfo();

    // Crear el documento de sesión en MongoDB
    try {
        const session = new ControlSession({
            sessionId,
            email,
            fullName,
            nickname,
            macAddress,
            clientIp,
            serverIp,
            serverMac,
            createdAt: now,
            lastAccessedAt: now,
            duration: 0,
            inactivityTime: 0
        });

        // Guardar la sesión en la base de datos
        await session.save();

        res.status(200).json({
            message: "Inicio de sesión exitoso.",
            sessionId,
        });
    } catch (error) {
        console.error("Error al guardar la sesión en la base de datos:", error);
        res.status(500).json({ message: "Error al registrar la sesión." });
    }
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
// Actualización de la sesión en MongoDB
app.put("/update", async (req, res) => {
    const { sessionId, email, nickname } = req.body;

    if (!sessionId) {
        return res.status(400).json({ message: "El campo sessionId es obligatorio." });
    }

    try {
        // Buscar la sesión en la base de datos por sessionId
        const session = await ControlSession.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({ message: "Sesión no encontrada." });
        }

        // Actualizar los campos necesarios
        if (email) session.email = email;
        if (nickname) session.nickname = nickname;

        const now = new Date();

        // Calcular duración e inactividad
        session.duration = (now - new Date(session.createdAt)) / 1000; // en segundos
        session.inactivityTime = (now - new Date(session.lastAccessedAt)) / 1000; // en segundos
        session.lastAccessedAt = now;

        // Guardar los cambios en la base de datos
        await session.save();

        res.status(200).json({
            message: "Sesión actualizada correctamente.",
            session,
        });
    } catch (error) {
        console.error("Error al actualizar la sesión en la base de datos:", error);
        res.status(500).json({ message: "Error al actualizar la sesión." });
    }
});
// Estado de la sesión
app.get("/status", async (req, res) => {
    const sessionId = req.query.sessionId;
//condicional para encontrar el ID 
    if (!sessionId) {
        return res.status(400).json({ message: "El campo sessionId es obligatorio." });
    }

    try {
        // Buscar la sesión en la base de datos por sessionId
        const session = await ControlSession.findOne({ sessionId });

        if (!session) {
            return res.status(404).json({ message: "No hay sesión activa." });
        }

        res.status(200).json({
            message: "Sesión activa.",
            session,
        });
    } catch (error) {
        console.error("Error al verificar el estado de la sesión:", error);
        res.status(500).json({ message: "Error al obtener el estado de la sesión." });
    }
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

export default app;
