import mongoose from "mongoose";

// Definir el esquema de la sesión
const sessionSchema = new mongoose.Schema({
    sessionId: String,
    email: String,
    fullName: String,
    nickname: String,
    macAddress: String,
    clientIp: String,
    serverIp: String,
    serverMac: String,
    createdAt: Date,
    lastAccessedAt: Date,
    duration: Number,
    inactivityTime: Number
});

// Crear el modelo de la sesión basado en el esquema
const ControlSession = mongoose.model('ControlSessiones', sessionSchema, 'ControlSessiones'); // Aseguramos que coincida con la colección 'ControlSessiones'

export default ControlSession;
