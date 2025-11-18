import Agent from "../models/Agent.js";
import { AgentRun } from "../models/AgentRun.js";

import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";
import stripe from "stripe";

// Get User Data
export const getUserData = async (req, res) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.json({ success: false, message: "Unauthorizedd" });
    }
    const userId = req.auth.userId;
    console.log("UserID:", userId); // Debugging line
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Remove Agent from Workspace
export const removeFromWorkspace = async (req, res) => {
  try {
    const { agentId } = req.body;
    const userId = req.auth.userId;

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("Before filter:", user.workspaceAgents);
    user.workspaceAgents = user.workspaceAgents.filter(
      (agent) => agent._id.toString() !== agentId
    );
    console.log("After filter:", user.workspaceAgents);

    await user.save();

    res.json({ success: true, message: "Agent removed from workspace" });
  } catch (error) {
    console.error("Error in removeFromWorkspace:", error);
    res.status(500).json({ success: false, message: "Failed to remove agent. Please refresh." });
  }
};

// Add Agent to Workspace
export const addToWorkspace = async (req, res) => {
  try {
    const { agentId } = req.body;
    const userId = req.auth.userId;

    const user = await User.findById(userId);
    const agent = await Agent.findById(agentId);

    if (!user || !agent) {
      return res.json({ success: false, message: "User or Agent not found" });
    }

    if (user.workspaceAgents.includes(agentId)) {
      return res.json({ success: false, message: "Agent already in workspace" });
    }

    user.workspaceAgents.push(agentId);
    await user.save();

    res.json({ success: true, message: "Agent added to workspace" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Run Agent Once (One-Time Use)
export const runAgent = async (req, res) => {
  console.log("runnign agent")
  try {
    const { purchaseId, input } = req.body;
    const userId = req.auth.userId;

    if (!purchaseId || !userId) {
      return res.status(400).json({ success: false, message: "Missing purchaseId or userId" });
    }

    // 1. Find and validate the purchase
    const purchase = await Purchase.findOne({
      _id: purchaseId,
      userId,
      // status: "completed",
      used: { $ne: true },
    }).populate("agentId");

    if (!purchase) {
      return res.status(403).json({ success: false, message: "Invalid or already used purchase." });
    }

    const agent = purchase.agentId;

    // 2. Simulate agent logic (replace with your own logic, OpenAI, etc.)
    const result = `Agent "${agent.agentName}" processed: ${input}`;

    // 3. Mark the purchase as used
    purchase.used = true;
    await purchase.save();

    // 4. Log the run (optional, for history)
    await AgentRun.create({
      agentId: agent._id,
      userId,
      modelType: agent.modelType,
      runDate: new Date(),
      status: "completed",
      agentName: agent.agentName,
      agentThumbnail: agent.agentThumbnail,
    });

    return res.json({ success: true, result });
  } catch (error) {
    console.error("Run Agent Error:", error);
    return res.status(500).json({ success: false, message: "Failed to run agent." });
  }
};



// export const purchaseAgent = async (req, res) => {
//   try {
//     const { agentId } = req.body;
//     const { origin } = req.headers;
//     const userId = req.auth.userId;

//     const agentData = await Agent.findById(agentId);
//     const userData = await User.findById(userId);

//     if (!userData || !agentData) {
//       return res.json({ success: false, message: "Data Not Found" });
//     }

//     const purchaseData = {
//       agentId: agentData._id,
//       userId,
//       amount: parseFloat(agentData.pricePerRun).toFixed(2),
//     };

//     const newPurchase = await Purchase.create(purchaseData);

//     const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
//     const currency = process.env.CURRENCY.toLowerCase();

//     const line_items = [
//       {
//         price_data: {
//           currency,
//           product_data: {
//             name: agentData.agentName,
//           },
//           unit_amount: Math.floor(newPurchase.amount * 100),
//         },
//         quantity: 1,
//       },
//     ];

//     const session = await stripeInstance.checkout.sessions.create({
//       success_url: `${origin}/dashboard/runs`,
//       cancel_url: `${origin}/`,
//       line_items: line_items,
//       mode: "payment",
//       metadata: {
//         purchaseId: newPurchase._id.toString(),
//       },
//     });

//     // Create AgentRun record after successful purchase
//     const agentRunData = {
//       agentId: agentData._id,
//       userId: userData._id,
//       modelType: agentData.modelType, // Assuming modelType is available in agentData
//       runDate: new Date(),
//       status: "completed", // Or "pending", depending on your workflow
//       agentName: agentData.agentName,
//       agentThumbnail: agentData.agentThumbnail
//     };

//     await AgentRun.create(agentRunData);

//     res.json({ success: true, session_url: session.url });
//   } catch (error) {
//     res.json({ success: false, message: error.message });
//   }
// };

// Get User Executed Agents

export const userPurchasedAgents = async (req, res) => {
  try {
    if (!req.auth?.userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }

    const userId = req.auth.userId;

    // 1) Fetch agents from workspaceAgents
    const user = await User.findById(userId).populate("workspaceAgents", "-__v");
    const agents = user?.workspaceAgents || [];

    return res.json({
      success: true,
      agents: agents,
      message:
        agents.length === 0
          ? "You haven't added any agents to your workspace yet."
          : "Agents retrieved successfully from workspace."
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

export const purchaseAgentRun = async (req, res) => {
  try {
    const { agentId } = req.body;
    const { origin }  = req.headers;
    const userId      = req.auth.userId;

    const agent = await Agent.findById(agentId);
    const user  = await User.findById(userId);

    if (!user || !agent) {
      return res.json({ success: false, message: "User or agent not found." });
    }

    /* create a pending purchase ---------------------------------- */
    const purchase = await Purchase.create({
      agentId : agent._id,
      userId,
      amount  : parseFloat(agent.pricePerRun).toFixed(2),
      status  : "pending",
    });

    /* create Stripe checkout session ----------------------------- */
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    // Validate currency env var (expect 3-letter ISO code). Default to 'usd' when invalid.
    let currency = (process.env.CURRENCY || 'usd').toLowerCase();
    if (!/^[a-z]{3}$/.test(currency)) {
      console.warn(`Invalid or missing CURRENCY env var: ${process.env.CURRENCY}. Falling back to 'usd'.`);
      currency = 'usd';
    }
    console.log("Currency:", currency);
    const line_items = [
      {
        price_data: {
          currency    : "usd",
          product_data: { name: agent.agentName },
          unit_amount : Math.floor(purchase.amount * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/dashboard/runs/${purchase._id.toString()}`+ `?agent=${encodeURIComponent(agent.agentName)}`,
      cancel_url : `${origin}/`,
      line_items,
      mode       : "payment",
      metadata   : { purchaseId: purchase._id.toString() },
    });

    return res.json({ success: true, session_url: session.url });
  } catch (err) {
    console.error("purchaseAgentRun error:", err);
    return res.json({ success: false, message: err.message });
  }
};

// Add Rating to Agent
export const addUserRating = async (req, res) => {
  const userId = req.auth.userId;
  const { agentId, rating } = req.body;

  if (!agentId || !userId || !rating || rating < 1 || rating > 5) {
    return res.json({ success: false, message: "Invalid Details" });
  }

  try {
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.json({ success: false, message: "Agent not found." });
    }

    const user = await User.findById(userId);
    const pastRuns = await AgentRun.findOne({ agentId, userId });

    if (!user || !pastRuns) {
      return res.json({ success: false, message: "You must use the agent before rating it." });
    }

    const existingRatingIndex = agent.ratings.findIndex((r) => r.userId === userId);

    if (existingRatingIndex > -1) {
      agent.ratings[existingRatingIndex].rating = rating;
    } else {
      agent.ratings.push({ userId, rating });
    }

    await agent.save();
    return res.json({ success: true, message: "Rating added" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
