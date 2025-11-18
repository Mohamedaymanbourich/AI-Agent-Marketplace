import Agent from "../models/Agent.js";
import { AgentRun } from "../models/AgentRun.js";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js";
import { Webhook } from "svix";
import stripePkg from "stripe";

// Get User Data
export const getUserData = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User Not Found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Purchase Agent Run
export const purchaseAgentRun = async (req, res) => {
  try {
    const { agentId } = req.body;
    const { origin } = req.headers;
    const userId = req.auth.userId;

    const agentData = await Agent.findById(agentId);
    const userData = await User.findById(userId);

    if (!userData || !agentData) {
      return res.json({ success: false, message: "Data Not Found" });
    }

    const purchaseData = {
      agentId: agentData._id,
      userId,
      amount: parseFloat(agentData.pricePerRun).toFixed(2),
    };

    const newPurchase = await Purchase.create(purchaseData);

    const stripeInstance = new stripePkg(process.env.STRIPE_SECRET_KEY);
    // Validate currency env var (expect 3-letter ISO code). Default to 'usd' when invalid.
    let currency = (process.env.CURRENCY || 'usd').toLowerCase();
    if (!/^[a-z]{3}$/.test(currency)) {
      console.warn(`Invalid or missing CURRENCY env var: ${process.env.CURRENCY}. Falling back to 'usd'.`);
      currency = 'usd';
    }

    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: agentData.agentName,
          },
          unit_amount: Math.floor(newPurchase.amount * 100),
        },
        quantity: 1,
      },
    ];

const session = await stripeInstance.checkout.sessions.create({
  success_url: `${origin}/dashboard/runs/${newPurchase._id.toString()}`,
  cancel_url: `${origin}/`,
  line_items,
  mode: "payment",
  metadata: {
    purchaseId: newPurchase._id.toString(),
  },
});


    res.json({ success: true, session_url: session.url });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Get User Executed Agents
export const userExecutedAgents = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const agentRuns = await AgentRun.find({ userId }).populate("agentId");
    res.json({ success: true, agentRuns });
  } catch (error) {
    res.json({ success: false, message: error.message });
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

// Clerk Webhook
export const clerkWebhooks = async (req, res) => {
  console.log("heldlodo")
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    console.log("whook:", whook)
    console.log("req.body:", req.body)
    

    const { data, type } = req.body;

    switch (type) {
      case "user.created": {
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
          resume: "",
        };
        await User.create(userData);
        res.json({});
        break;
      }
      case "user.updated": {
        const userData = {
          email: data.email_addresses[0].email_address,
          name: data.first_name + " " + data.last_name,
          imageUrl: data.image_url,
        };
        await User.findByIdAndUpdate(data.id, userData);
        res.json({});
        break;
      }
      case "user.deleted": {
        await User.findByIdAndDelete(data.id);
        res.json({});
        break;
      }
      default:
        break;
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

/* ------------------------------------------------------------------
   STRIPE WEBHOOKS 
   ------------------------------------------------------------------ */


export const stripeWebhooks = async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("STRIPE_SECRET_KEY not set; skipping Stripe webhook handling.");
    return res.status(500).send("Stripe not configured on server.");
  }
  const stripeInstance = new stripePkg(process.env.STRIPE_SECRET_KEY);

  
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌  Stripe signature check failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📡  Received event ${event.type}`);

  /* -------------------------------------------------------------- */
  const updatePurchase = async (purchaseId, status, intentId) => {
    if (!purchaseId) {
      console.warn("⚠️  No purchaseId on event, skipping update.");
      return;
    }
    const doc = await Purchase.findByIdAndUpdate(
      purchaseId,
      { status, paymentIntentId: intentId },
      { new: true }
    );
    if (doc) {
      console.log(`✅  Purchase ${purchaseId} set to "${status}"`);
    } else {
      console.warn(`⚠️  Purchase ${purchaseId} not found in DB`);
    }
  };

  try {
    switch (event.type) {
      /* ---------- happiest path: Checkout complete + paid -------- */
      case "checkout.session.completed": {
        const session = event.data.object;
        await updatePurchase(
          session.metadata?.purchaseId,
          "completed",
          session.payment_intent
        );
        break;
      }

      /* ---------- async payment methods (e.g. Sofort) ------------ */
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        await updatePurchase(
          session.metadata?.purchaseId,
          "completed",
          session.payment_intent
        );
        break;
      }

      /* ---------- synchronous card payments ---------------------- */
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        await updatePurchase(
          intent.metadata?.purchaseId,   // this exists only if you pass metadata on PaymentIntent
          "completed",
          intent.id
        );
        break;
      }

      /* ---------- failures (sync + async) ------------------------ */
      case "payment_intent.payment_failed":
      case "checkout.session.async_payment_failed": {
        const obj = event.data.object;
        await updatePurchase(
          obj.metadata?.purchaseId,
          "failed",
          obj.id || obj.payment_intent
        );
        break;
      }

      default:
        console.log(`ℹ️  Event ${event.type} ignored`);
    }
  } catch (dbErr) {
    console.error("💥  DB update failed:", dbErr);
  }

  res.json({ received: true });
};
