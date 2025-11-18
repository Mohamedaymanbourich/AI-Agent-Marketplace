// Server Entry for AI Agent Marketplace
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js';
import { getClerkMiddleware } from './configs/clerk.js';
import creatorRouter from './routes/CreatorRoutes.js';
import agentRouter from './routes/agentRoutes.js';

// Initialize Express
const app = express();


// Connect to database and optional services (safe on missing env vars)
try {
  await connectDB();
} catch (err) {
  console.warn('Database connection failed or skipped:', err && err.message ? err.message : err);
}

try {
  await connectCloudinary();
} catch (err) {
  console.warn('Cloudinary initialization failed or skipped:', err && err.message ? err.message : err);
}

// Middlewares

const corsOptions = {
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', (_req, res) => res.sendStatus(200));
// ensures that the user is auth


// Routes
app.get('/', (req, res) => res.send("API Working"));
app.post('/clerk', express.json(), clerkWebhooks);
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);

// Clerk middleware (real or fallback)
const clerkMw = await getClerkMiddleware();
app.use(clerkMw);

app.use('/api/creator', express.json(), creatorRouter);
app.use('/api/agent', express.json(), agentRouter);
app.use('/api/user', express.json(), userRouter);
// Port
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Kill the process using that port or set PORT to a different value.`);
    process.exit(1);
  }
  console.error('Server error:', err);
});
