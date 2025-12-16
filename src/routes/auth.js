import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../db.js';
import { config } from '../config.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Identifiants manquants' });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    const user = rows[0];
console.log(user);
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
const ok = await bcrypt.compare(password, user.password_hash);
    console.log(ok);
    if (!ok) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      terrain_id: user.terrain_id
    };

    const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    return res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;


