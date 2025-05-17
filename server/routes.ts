import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer } from "ws";
import { WebSocket } from "ws";
import Stripe from "stripe";
import { OpenAI } from "openai";
import * as bcrypt from 'bcrypt';

// Initialize Stripe and Resend
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing required Resend secret: RESEND_API_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize OpenAI
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing required OpenAI secret: OPENAI_API_KEY');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { username, email, password, displayName } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email, and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }

      // Hash the password with bcrypt
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user with hashed password
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        displayName: displayName || username,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({ 
        success: true, 
        message: "User created successfully",
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ 
        success: false,
        message: "Error creating user: " + error.message 
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Find user by username
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Compare the provided password with the stored hash
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({ 
        success: true, 
        message: "Login successful",
        user: userWithoutPassword
      });
    } catch (error: any) {
      console.error("Error logging in:", error);
      res.status(500).json({ 
        success: false,
        message: "Error logging in: " + error.message 
      });
    }
  });

  // API routes for dashboard data
  app.get("/api/dashboard/:role", (req, res) => {
    const { role } = req.params;

    if (!['work', 'personal', 'school', 'general'].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    // This would usually fetch data from a database based on the role and user
    // For now, we're just returning a success message
    res.json({ 
      success: true, 
      message: `Successfully fetched ${role} dashboard data` 
    });
  });

  // API routes for user data
  app.get("/api/user", (req, res) => {
    // This would usually fetch the current user from a database
    // For now, we're just returning mock data
    res.json({
      id: "user-1",
      name: "Alex Morgan",
      email: "alex.morgan@example.com",
      avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5",
      role: "work",
      plan: "Pro"
    });
  });

  // Social Network API Routes
  app.get("/api/feed", async (req, res) => {
    try {
      const posts = await storage.getFeedPosts();
      res.json({ success: true, posts });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post("/api/post", async (req, res) => {
    try {
      const { content, visibility, attachedImage } = req.body;
    const post = await storage.createPost({
      content,
      visibility,
      attachedImage,
      authorId: req.user?.id // Assuming auth middleware sets this
    });
    res.status(201).json({ success: true, post });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/post/:postId/like", async (req, res) => {
  try {
    const { postId } = req.params;
    await storage.togglePostLike(postId, req.user?.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Follow/Unfollow user
app.post("/api/user/:userId/follow", async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user?.id;
    await storage.toggleFollow(parseInt(userId), followerId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get user profile
app.get("/api/user/:userId/profile", async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await storage.getUserProfile(parseInt(userId));
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/post/:postId/comment", async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const comment = await storage.createComment({
      postId,
      content,
      authorId: req.user?.id
    });
    res.json({ success: true, comment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Help & Support endpoints
app.post("/api/support/ticket", async (req, res) => {
  try {
    const { subject, message } = req.body;
    const ticket = await storage.createSupportTicket({
      subject,
      message,
      userId: req.user?.id
    });
    res.json({ success: true, ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/api/support/faq", async (req, res) => {
  try {
    const faqs = await storage.getFAQs();
    res.json({ success: true, faqs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Pricing & Subscription endpoints
app.get("/api/pricing/plans", async (req, res) => {
  try {
    const plans = await storage.getSubscriptionPlans();
    res.json({ success: true, plans });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/pricing/calculate", async (req, res) => {
  try {
    const { planId, seats, addons } = req.body;
    const quote = await storage.calculateSubscriptionPrice({
      planId,
      seats,
      addons
    });
    res.json({ success: true, quote });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

  // API routes for AI modules
  app.get("/api/modules", (req, res) => {
    // This would usually fetch module data from a database
    // For now, we're just returning a success message
    res.json({ 
      success: true, 
      message: "Successfully fetched modules data" 
    });
  });

  // API route for subscription data
  app.get("/api/subscription", (req, res) => {
    // This would usually fetch subscription data from a database or Stripe
    // For now, we're just returning a success message
    res.json({ 
      success: true, 
      message: "Successfully fetched subscription data" 
    });
  });

  // API route for chat messages with OpenAI integration
  const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

app.post("/api/chat", apiLimiter, async (req, res) => {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({ message: "No message provided" });
      }

      // Process the message through OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4", // Using stable GPT-4 model
        messages: [
          {
            role: "system",
            content: "You are EchoChat, an AI assistant in the Echoverse platform. Be helpful, friendly, and concise. Context about the user: " + (context || "Work role, using the platform for productivity")
          },
          { role: "user", content: message }
        ],
        max_tokens: 500
      });

      res.json({ 
        success: true, 
        message: "Message received",
        response: response.choices[0].message.content
      });
    } catch (error: any) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to process your message",
        error: error.message
      });
    }
});

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, description } = req.body;

      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        description: description || "Echoverse payment",
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret 
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent: " + error.message 
      });
    }
  });

  // Simplified Stripe subscription route
  app.post('/api/create-subscription', async (req, res) => {
    try {
      const { userId, email, name, priceId } = req.body;

      if (!userId || !email || !name || !priceId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get user from database
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email: email,
        name: name,
      });

      // Create a payment intent for the subscription
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 4999, // $49.99 in cents
        currency: 'usd',
        customer: customer.id,
        description: 'Echoverse Pro Subscription',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: userId.toString(),
          priceId: priceId
        }
      });

      // Update user with Stripe customer ID
      await storage.updateStripeCustomerId(userId, customer.id);

      // Return the client secret for the payment
      res.json({ clientSecret: paymentIntent.client_secret });

    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ 
        message: "Error creating subscription: " + error.message 
      });
    }
  });

  // Webhook to handle successful payments and create subscriptions
  // Send email notification
async function sendEmailNotification(to: string, subject: string, body: string) {
  try {
    await resend.emails.send({
      from: 'notifications@echoverse.com',
      to,
      subject,
      html: body,
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

app.post('/api/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    // Verify webhook signature and extract the event
    try {
      if (!endpointSecret || !sig) {
        // Development fallback when webhook secret is not available
        event = req.body;
      } else {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      }

      // Handle the event
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;

        // Create subscription for the user
        if (metadata && metadata.userId && metadata.priceId) {
          const subscription = await stripe.subscriptions.create({
            customer: paymentIntent.customer,
            items: [{ price: metadata.priceId }],
            metadata: { userId: metadata.userId }
          });

          // Update user with subscription ID
          await storage.updateUserStripeInfo(
            parseInt(metadata.userId), 
            {
              stripeCustomerId: paymentIntent.customer,
              stripeSubscriptionId: subscription.id
            }
          );
        }
      }

      // Return a 200 response to acknowledge receipt of the event
      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time features
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  function heartbeat() {
    this.isAlive = true;
  }

  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: WebSocket & { isAlive?: boolean }) => {
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    console.log('Client connected to WebSocket');

    // Send welcome message when client connects
    ws.send(JSON.stringify({
      type: 'system',
      message: 'Connected to Echoverse real-time server'
    }));

    // Handle messages from clients
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        // Echo the message back to the client
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'echo',
            data
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}