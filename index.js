import mongoose from "mongoose";
import app from './app.js';  // Importar el archivo app.js donde están las rutas

const mongoURI = 'mongodb+srv://baduri490:kabbalamijo8@cluster1.b6s45.mongodb.net/API-AWI4_0-220879?retryWrites=true&w=majority';

mongoose.connect(mongoURI)
    .then(() => {
        console.log('Conectado a MongoDB Atlas');
        // Aquí termina la conexión a la base de datos
    })
    .catch((err) => {
        console.error('Error de conexión:', err);
    });
