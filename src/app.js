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

// === Middleware CORS ===
const allowedOrigins = [config.corsOrigin]; // ex: 'https://ahmedbm99.github.io'

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // autorise les requêtes directes (Postman, serveur)
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Gérer les preflight OPTIONS pour toutes les routes
app.options('*', cors());

// === Middleware JSON ===
app.use(express.json());

// === Routes ===
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(authRoutes);
app.use(terrainRoutes);
app.use(matchRoutes);
app.use(adminRoutes);

// === 404 ===
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// === Export pour Vercel serverless ===
export default app;
