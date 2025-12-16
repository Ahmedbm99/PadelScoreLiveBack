import express from 'express';
import { getPool } from '../db.js';

const router = express.Router();

// Public: liste des terrains (spectateurs non authentifiés)
router.get('/terrains', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, name FROM terrains ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;


