import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api', routes);

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Backend corriendo en  http://localhost:${env.port}`);
});

export default app;
