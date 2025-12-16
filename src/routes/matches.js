import express from 'express';
import { getPool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /match/:terrain_id (public pour spectateurs)
router.get('/match/:terrainId', async (req, res) => {
  const { terrainId } = req.params;
  try {
    const pool = getPool();

    const [rows] = await pool.query(
      `SELECT
         m.*,
         p1.id   AS t1_pair_id,
         p2.id   AS t2_pair_id,
         pl11.first_name AS t1_p1_first,
         pl11.last_name  AS t1_p1_last,
         pl12.first_name AS t1_p2_first,
         pl12.last_name  AS t1_p2_last,
         pl21.first_name AS t2_p1_first,
         pl21.last_name  AS t2_p1_last,
         pl22.first_name AS t2_p2_first,
         pl22.last_name  AS t2_p2_last,
         c1.label        AS t1_cat,
         c2.label        AS t2_cat
       FROM matches m
       LEFT JOIN pairs p1 ON m.team1_pair_id = p1.id
       LEFT JOIN pairs p2 ON m.team2_pair_id = p2.id
       LEFT JOIN players pl11 ON p1.player1_id = pl11.id
       LEFT JOIN players pl12 ON p1.player2_id = pl12.id
       LEFT JOIN players pl21 ON p2.player1_id = pl21.id
       LEFT JOIN players pl22 ON p2.player2_id = pl22.id
       LEFT JOIN categories c1 ON p1.category_id = c1.id
       LEFT JOIN categories c2 ON p2.category_id = c2.id
       WHERE m.terrain_id = ?
       LIMIT 1`,
      [terrainId]
    );

    let match = rows[0];

    if (!match) {
      const defaultState = {
        format: 'third_set',
        currentServer: 'team1',
        points: { team1: 0, team2: 0 },
        games: { team1: 0, team2: 0 },
        sets: [],
        isTieBreak: false,
        tieBreakPoints: { team1: 0, team2: 0 },
        matchFinished: false
      };
      const [result] = await pool.query(
        'INSERT INTO matches (terrain_id, score_state) VALUES (?, ?)',
        [terrainId, JSON.stringify(defaultState)]
      );
      match = {
        id: result.insertId,
        terrain_id: Number(terrainId),
        score_state: JSON.stringify(defaultState),
        t1_pair_id: null,
        t2_pair_id: null,
        t1_p1_first: null,
        t1_p1_last: null,
        t1_p2_first: null,
        t1_p2_last: null,
        t2_p1_first: null,
        t2_p1_last: null,
        t2_p2_first: null,
        t2_p2_last: null,
        t1_cat: null,
        t2_cat: null
      };
    }

    const team1Label = match.t1_pair_id
      ? `${match.t1_p1_first} ${match.t1_p1_last} & ${match.t1_p2_first} ${match.t1_p2_last}${
          match.t1_cat ? ' (' + match.t1_cat + ')' : ''
        }`
      : '';

    const team2Label = match.t2_pair_id
      ? `${match.t2_p1_first} ${match.t2_p1_last} & ${match.t2_p2_first} ${match.t2_p2_last}${
          match.t2_cat ? ' (' + match.t2_cat + ')' : ''
        }`
      : '';

    const t1p1Full =
      match.t1_p1_first && match.t1_p1_last ? `${match.t1_p1_first} ${match.t1_p1_last}` : '';
    const t1p2Full =
      match.t1_p2_first && match.t1_p2_last ? `${match.t1_p2_first} ${match.t1_p2_last}` : '';
    const t2p1Full =
      match.t2_p1_first && match.t2_p1_last ? `${match.t2_p1_first} ${match.t2_p1_last}` : '';
    const t2p2Full =
      match.t2_p2_first && match.t2_p2_last ? `${match.t2_p2_first} ${match.t2_p2_last}` : '';

    return res.json({
      id: match.id,
      terrain_id: match.terrain_id,
      phase: match.phase || null,
      team1_pair_id: match.t1_pair_id || null,
      team2_pair_id: match.t2_pair_id || null,
      score_state: JSON.parse(match.score_state),
      players: {
        team1: {
          label: team1Label,
          player1: t1p1Full,
          player2: t1p2Full,
          category: match.t1_cat || ''
        },
        team2: {
          label: team2Label,
          player1: t2p1Full,
          player2: t2p2Full,
          category: match.t2_cat || ''
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT /match/:terrain_id/score (protégé)
router.put(
  '/match/:terrainId/score',
  requireAuth,
  requireRole('admin', 'supervisor'),
  async (req, res) => {
    const { terrainId } = req.params;
    const { score_state } = req.body || {};
    const user = req.user;

    if (user.role === 'supervisor' && Number(user.terrain_id) !== Number(terrainId)) {
      return res.status(403).json({ message: 'Non autorisé sur ce terrain' });
    }

    if (!score_state) {
      return res.status(400).json({ message: 'score_state manquant' });
    }

    try {
      const pool = getPool();
      await pool.query('UPDATE matches SET score_state = ? WHERE terrain_id = ?', [
        JSON.stringify(score_state),
        terrainId
      ]);
      res.json({ message: 'Score mis à jour' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

// PUT /match/:terrain_id/players
// Interprété ici comme "assigner les paires" (réservé à l'admin à terme).
router.put(
  '/match/:terrainId/players',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    const { terrainId } = req.params;
    const { team1_pair_id, team2_pair_id } = req.body || {};

    if (!team1_pair_id || !team2_pair_id) {
      return res.status(400).json({ message: 'team1_pair_id et team2_pair_id requis' });
    }

    try {
      const pool = getPool();
      await pool.query(
        'UPDATE matches SET team1_pair_id = ?, team2_pair_id = ? WHERE terrain_id = ?',
        [team1_pair_id, team2_pair_id, terrainId]
      );
      res.json({ message: 'Paires assignées' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  }
);

export default router;


