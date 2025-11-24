const express = require('express');
require('dotenv').config();
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const unatuhRoutes = require('./routes/unauthRoutes/unauthRoutes');
const imageRouter = require('./routes/imageRouter');
const documentRouter = require('./routes/documentRouter');
const projectRoutes = require('./routes/projectRoutes');

const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { testConnection } = require('./config/dbConnection');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

app.use('/api', authRoutes);
app.use('/api', unatuhRoutes);
app.use('/api', projectRoutes);
app.use('/api/image', imageRouter);
app.use('/api/document', documentRouter);

const PORT = process.env.PORT || 3000;

app.get('/api', (req, res) => {
  res.send('Bienvenido a la API de AportaYa');
});

const startServer = async () => {
    await testConnection();
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto http://localhost:${PORT}`);
    });
};

startServer();