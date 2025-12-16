import express from 'express';
import bcrypt from 'bcryptjs';
import { getPool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// --- PLAYERS ---

router.get('/players', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, created_at FROM players ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/players', requireAuth, requireRole('admin'), async (req, res) => {
  const { first_name, last_name } = req.body || {};
  if (!first_name || !last_name) {
    return res.status(400).json({ message: 'first_name et last_name requis' });
  }
  try {
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO players (first_name, last_name) VALUES (?, ?)',
      [first_name, last_name]
    );
    res.status(201).json({ id: result.insertId, first_name, last_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// --- CATEGORIES ---

router.get('/categories', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, code, label FROM categories ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// --- PAIRS (équipes de deux joueurs dans une catégorie) ---

router.get('/pairs', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT
         p.id,
         p.category_id,
         c.label        AS category_label,
         pl1.first_name AS p1_first,
         pl1.last_name  AS p1_last,
         pl2.first_name AS p2_first,
         pl2.last_name  AS p2_last,
         p.created_at
       FROM pairs p
       JOIN players pl1 ON p.player1_id = pl1.id
       JOIN players pl2 ON p.player2_id = pl2.id
       JOIN categories c ON p.category_id = c.id
       ORDER BY p.created_at DESC`
    );
    res.json(
      rows.map((r) => ({
        id: r.id,
        category_id: r.category_id,
        category_label: r.category_label,
        player1: `${r.p1_first} ${r.p1_last}`,
        player2: `${r.p2_first} ${r.p2_last}`,
        created_at: r.created_at
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/pairs', requireAuth, requireRole('admin'), async (req, res) => {
  const { player1_id, player2_id, category_id } = req.body || {};
  if (!player1_id || !player2_id || !category_id) {
    return res
      .status(400)
      .json({ message: 'player1_id, player2_id et category_id sont requis' });
  }
  if (player1_id === player2_id) {
    return res.status(400).json({ message: 'Un joueur ne peut pas être son propre partenaire' });
  }

  try {
    const pool = getPool();
    const [result] = await pool.query(
      'INSERT INTO pairs (player1_id, player2_id, category_id) VALUES (?, ?, ?)',
      [player1_id, player2_id, category_id]
    );
    res.status(201).json({ id: result.insertId, player1_id, player2_id, category_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// --- SUPERVISORS (users table) ---

router.get('/users/supervisors', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, username, terrain_id, created_at FROM users WHERE role = "supervisor" ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.post('/users/supervisors', requireAuth, requireRole('admin'), async (req, res) => {
  const { username, password, terrain_id } = req.body || {};
  if (!username || !password || !terrain_id) {
    return res.status(400).json({ message: 'username, password et terrain_id requis' });
  }
  try {
    const pool = getPool();
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? LIMIT 1', [
      username
    ]);
    if (existing[0]) {
      return res.status(409).json({ message: 'Nom d’utilisateur déjà utilisé' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, role, terrain_id) VALUES (?, ?, "supervisor", ?)',
      [username, hash, terrain_id]
    );
    res.status(201).json({ id: result.insertId, username, terrain_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

export default router;


