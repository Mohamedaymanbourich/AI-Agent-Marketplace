import { v2 as cloudinary } from 'cloudinary'
import Agent from '../models/Agent.js';
import { AgentRun } from "../models/AgentRun.js";
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';
import { getClerkClient } from '../configs/clerk.js';

// Update role to agent creator
export const updateRoleToCreator = async (req, res) => {
  try {
    console.log("hello")
    const userId = req.auth.userId;
    const client = getClerkClient();
    if (!client) {
      if (process.env.DEV_AUTH_USER) {
        // local/dev fallback: pretend update succeeded
        return res.json({ success: true, message: 'You can now publish agents' });
      }
      return res.json({ success: false, message: 'Auth not configured' });
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: 'creator' },
    });
    res.json({ success: true, message: 'You can now publish agents' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get agent run history
export const getAgentRunHistory = async (req, res) => {
  try {
    const creatorId = req.auth.userId;

    // Find all agents created by the creator
    const agents = await Agent.find({ creator: creatorId });

    // Extract agent IDs
    const agentIds = agents.map(agent => agent._id);

    // Find all agent runs for the creator's agents
    const runs = await AgentRun.find({ agentId: { $in: agentIds } })
      .populate('userId', 'name imageUrl')
      .populate('agentId', 'agentName agentThumbnail');

    res.json({ success: true, runs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add new AI agent
export const addAgent = async (req, res) => {
  try {
    const { agentData } = req.body;
    const imageFile = req.file;
    const creatorId = req.auth.userId;

    if (!imageFile) {
      return res.json({ success: false, message: 'Thumbnail not attached' });
    }

    const parsedAgentData = JSON.parse(agentData);
    parsedAgentData.creator = creatorId;

    const newAgent = await Agent.create(parsedAgentData);
    const imageUpload = await cloudinary.uploader.upload(imageFile.path);
    newAgent.agentThumbnail = imageUpload.secure_url;

    await newAgent.save();
    res.json({ success: true, message: 'Agent added' });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get all agents created by this user
export const getMyAgents = async (req, res) => {
  try {
    console.log("hello")
    const creatorId = req.auth.userId;

    const agents = await Agent.find({ creator: creatorId }).select('agentName agentDescription agentThumbnail pricePerRun ratings isPublished createdAt')
;

    res.json({ success: true, agents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// Get creator dashboard data
export const creatorDashboardData = async (req, res) => {
  try {
    const creator = req.auth.userId;
    const agents = await Agent.find({ creator });
    const totalAgents = agents.length;
    const agentIds = agents.map(agent => agent._id);

    const purchases = await Purchase.find({ agentId: { $in: agentIds }, status: 'completed' });
    const totalEarnings = purchases.reduce((sum, p) => sum + p.amount, 0);

    const executionData = [];
    for (const agent of agents) {
      const runs = await AgentRun.find({ agentId: agent._id }).populate('userId', 'name imageUrl');
      runs.forEach(run => {
        executionData.push({
          agentName: agent.agentName,
          user: run.userId,
          runDate: run.createdAt
        });
      });
    }

    res.json({
      success: true,
      dashboardData: {
        totalEarnings,
        executionData,
        totalAgents
      }
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

