import mongoose from "mongoose";

import app from './app.js';

const mongoURI ='mongodb+srv://baduri490:kabbalamijo8@cluster1.b6s45.mongodb.net/API-AWI4_0-220879'

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Conectado a MongoDB Atlas');
        // Iniciar el servidor después de la conexión exitosa
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Error de conexión:', err);
    });
    