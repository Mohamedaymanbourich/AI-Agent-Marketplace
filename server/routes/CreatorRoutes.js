import express from 'express';
import { addAgent, creatorDashboardData, updateRoleToCreator, getAgentRunHistory, getMyAgents } from '../controllers/creatorController.js';
import upload from '../configs/multer.js';
import { protectCreator } from '../middlewares/authMiddleware.js';
// Clerk `requireAuth` removed to avoid importing Clerk at module load; using local middleware instead

const creatorRouter = express.Router();

// Add Creator Role 
creatorRouter.get('/update-role', protectCreator, updateRoleToCreator);

// Add Agents 
creatorRouter.post('/add-agent', upload.single('image'), protectCreator, addAgent);

// Get Creator's Agents 
creatorRouter.get('/my-agents', protectCreator, getMyAgents);

// Get Dashboard Data
creatorRouter.get('/dashboard', protectCreator, creatorDashboardData);

// Get Run History
creatorRouter.get('/runs', protectCreator, getAgentRunHistory);

creatorRouter.get('/', protectCreator, (req, res) => {
  res.json({ success: true, message: 'Creator route working' });
});

export default creatorRouter;
