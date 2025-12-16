-- Base de données : padel_score

CREATE DATABASE IF NOT EXISTS padel_score
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE padel_score;

-- Utilisateurs : admin / superviseurs / spectateurs

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'supervisor', 'spectator') NOT NULL,
  terrain_id INT UNSIGNED NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Terrains

CREATE TABLE IF NOT EXISTS terrains (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- Matches : état complet du score sérialisé + noms des équipes

CREATE TABLE IF NOT EXISTS matches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  terrain_id INT UNSIGNED NOT NULL,
  score_state JSON NOT NULL,
  player1 VARCHAR(100) DEFAULT '',
  player2 VARCHAR(100) DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_matches_terrain FOREIGN KEY (terrain_id) REFERENCES terrains(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Données de démo : 2 terrains + 1 admin

INSERT INTO terrains (name) VALUES
  ('Terrain 1'),
  ('Terrain 2');

-- Mot de passe : 123456789 (bcrypt, coût 10)
INSERT INTO users (username, password_hash, role, terrain_id)
VALUES (
  'admin',
  '$2b$10$QeG6ZxWwK0pLwJ9MjT4j7e0xgA5sKzQp5E7JxGv0nM3iT9PqvH32W',
  'admin',
  NULL
);


