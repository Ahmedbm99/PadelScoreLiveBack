export const config = {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'tramway.proxy.rlwy.net',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'eJgUgSuZrXJpejltfQTWxGPdpEykAjAl',
    database: process.env.DB_NAME || 'railway',
    port: process.env.DB_PORT || 10923,      // important car Railway n’utilise pas le port 3306 par défaut
  ssl: {
    rejectUnauthorized: true              // nécessaire pour Railway
  }
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-to-a-strong-secret-key',
    expiresIn: '24h'
  },
  corsOrigin: 'https://ahmedbm99.github.io'
};


