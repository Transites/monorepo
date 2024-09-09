const path = require('path');

module.exports = ({ env }) => {
  const client = env('DATABASE_CLIENT', 'postgres');

  const connections = {
    postgres: {
      connection: {
        host: env('DATABASE_HOST', 'dpg-crfn24a3esus73f3gi2g-a.oregon-postgres.render.com'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'transites'),
        user: env('DATABASE_USERNAME', 'gygy'),
        password: env('DATABASE_PASSWORD', 'OnClYMjOuGa8NhYxf5v9ouxHJe0UEYqz'),
        ssl: {
          rejectUnauthorized: false, // Dependendo do seu ambiente, você pode precisar ajustar essa configuração
        },
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
