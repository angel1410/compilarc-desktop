import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execFile } from 'child_process';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'ac-local-dev-api',
      configureServer(server) {
        server.middlewares.use('/api/ac/consultar', (req, res) => {
          const url = new URL(req.url || '', `http://${req.headers.host}`);
          const nac = (url.searchParams.get('nacionalidad') || 'V').toUpperCase();
          const cedula = parseInt(url.searchParams.get('cedula') || '0', 10);

          res.setHeader('Content-Type', 'application/json');

          if (!cedula) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Cédula inválida' }));
            return;
          }

          // Consultar PostgreSQL local directo (Padrón de 36.6M de registros)
          const query = `SELECT nu_cedula, co_nacionalidad, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, fe_nacimiento, co_sexo FROM core.i001t_ac WHERE co_nacionalidad = '${nac}' AND nu_cedula = ${cedula} LIMIT 1;`;

          execFile(
            'psql',
            ['-h', 'localhost', '-U', 'postgres', '-d', 'registro_civil_bd', '-t', '-A', '-F', '|', '-c', query],
            { env: { ...process.env, PGPASSWORD: 'root' } },
            (err, stdout) => {
              if (err || !stdout.trim()) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Ciudadano no encontrado en AC' }));
                return;
              }

              const parts = stdout.trim().split('|');
              if (parts.length >= 8) {
                const data = {
                  cedula: parseInt(parts[0], 10),
                  nacionalidad: parts[1],
                  primer_nombre: parts[2] || '',
                  segundo_nombre: parts[3] || '',
                  primer_apellido: parts[4] || '',
                  segundo_apellido: parts[5] || '',
                  fecha_nacimiento: parts[6] || '',
                  sexo: parts[7] || '',
                };
                res.statusCode = 200;
                res.end(JSON.stringify(data));
              } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Formato inválido' }));
              }
            }
          );
        });
      },
    },
  ],
});
