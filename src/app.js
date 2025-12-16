import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import terrainRoutes from './routes/terrains.js';
import matchRoutes from './routes/matches.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(authRoutes);
app.use(terrainRoutes);
app.use(matchRoutes);
app.use(adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.listen(config.port, '0.0.0.0' ,  () => {
  console.log(`Node backend listening on http://0.0.0.0:${config.port}`);
});


