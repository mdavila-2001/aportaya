const express = require('express');
const cors = require('cors');

const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { testConnection } = require('./config/dbConnection');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'))

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Bienvenido a la API de AportaYa');
});

const startServer = async () => {
    await testConnection();
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
    });
};

startServer();