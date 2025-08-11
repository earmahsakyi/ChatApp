// server.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const Message = require('./models/Message');
const User = require('./models/User');
const config = require('./config/default.json');

const app = express();

// Connect to Database
connectDB();

app.use(cors());
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.json({ msg: 'Welcome to SwiftChat API...' }));

const server = http.createServer(app);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/messages', require('./routes/message')); 
app.use('/api/users', require('./routes/users')); 

// Setup Socket.io with authentication
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

// Store active connections
const activeUsers = new Map(); // userId -> socketId
const userSockets = new Map(); // socketId -> userId
const typingUsers = new Map(); // userId -> Set of users they're typing to

// Socket middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Handle socket connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);
  
  // Store user connection
  const userId = socket.user._id.toString();
  activeUsers.set(userId, socket.id);
  userSockets.set(socket.id, userId);

  // Join user to their own room
  socket.join(userId);

  // Notify about user coming online
  socket.emit("user_online", socket.user._id);
  socket.broadcast.emit("user_connected", socket.user._id);

  // Send list of online users to everyone
  const onlineUserIds = Array.from(activeUsers.keys());
  io.emit("online_users", onlineUserIds);

  // Handle explicit user online event (for reconnections)
  socket.on("user_online", (incomingUserId) => {
    const userIdStr = incomingUserId.toString();
    activeUsers.set(userIdStr, socket.id);
    userSockets.set(socket.id, userIdStr);
    socket.broadcast.emit("user_connected", incomingUserId);
    
    const onlineUserIds = Array.from(activeUsers.keys());
    io.emit("online_users", onlineUserIds);
    console.log(`User ${socket.user.username} marked as online`);
  });

  // Handle joining conversation rooms
  socket.on("join_conversation", ({ conversationId }) => {
    socket.join(conversationId);
    console.log(`User ${socket.user.username} joined conversation ${conversationId}`);
  });

  // Handle sending messages
  socket.on("send_message", async (data) => {
    try {
      const { receiver, content } = data;
      
      // Create and save message to database
      const message = new Message({
        sender: socket.user._id,
        receiver: receiver,
        content: content.trim(),
      });

      await message.save();

      // Populate sender and receiver information
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username email avatar')
        .populate('receiver', 'username email avatar');

      // Send to receiver if they're online
      const receiverSocketId = activeUsers.get(receiver);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", {
          _id: populatedMessage._id,
          sender: populatedMessage.sender._id,
          receiver: populatedMessage.receiver._id,
          content: populatedMessage.content,
          timestamp: populatedMessage.createdAt,
          read: false
        });
      }

      // Send confirmation back to sender
      socket.emit("message_sent", {
        _id: populatedMessage._id,
        sender: populatedMessage.sender._id,
        receiver: populatedMessage.receiver._id,
        content: populatedMessage.content,
        timestamp: populatedMessage.createdAt,
        read: false
      });

      console.log(`Message sent from ${socket.user.username} to ${receiver}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit("message_error", { error: "Failed to send message" });
    }
  });

  // Handle typing indicators with improved cleanup
  socket.on("typing", ({ receiverId, isTyping }) => {
    const receiverSocketId = activeUsers.get(receiverId);
    const senderUserId = socket.user._id.toString();
    
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", {
        userId: socket.user._id,
        isTyping
      });
      
      // Track typing status
      if (isTyping) {
        if (!typingUsers.has(senderUserId)) {
          typingUsers.set(senderUserId, new Set());
        }
        typingUsers.get(senderUserId).add(receiverId);
        
        // Auto-clear typing after 3 seconds as fallback
        setTimeout(() => {
          if (typingUsers.has(senderUserId) && typingUsers.get(senderUserId).has(receiverId)) {
            typingUsers.get(senderUserId).delete(receiverId);
            if (typingUsers.get(senderUserId).size === 0) {
              typingUsers.delete(senderUserId);
            }
            
            const receiverSocketId = activeUsers.get(receiverId);
            if (receiverSocketId) {
              io.to(receiverSocketId).emit("typing", {
                userId: socket.user._id,
                isTyping: false
              });
            }
          }
        }, 3000);
      } else {
        if (typingUsers.has(senderUserId)) {
          typingUsers.get(senderUserId).delete(receiverId);
          if (typingUsers.get(senderUserId).size === 0) {
            typingUsers.delete(senderUserId);
          }
        }
      }
    }
  });

  // Handle marking messages as read
  socket.on("mark_messages_read", async ({ senderId }) => {
    try {
      await Message.updateMany(
        { 
          sender: senderId, 
          receiver: socket.user._id, 
          read: false 
        },
        { read: true }
      );

      // Notify sender that messages were read
      const senderSocketId = activeUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages_read", {
          readBy: socket.user._id
        });
      }
      
      console.log(`Messages marked as read by ${socket.user.username} from ${senderId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  });

  // Handle getting user's conversations
  socket.on("get_conversations", async () => {
    try {
      // Get all conversations for this user
      const conversations = await Message.aggregate([
        {
          $match: {
            $or: [
              { sender: socket.user._id },
              { receiver: socket.user._id }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ["$sender", socket.user._id] },
                "$receiver",
                "$sender"
              ]
            },
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$receiver", socket.user._id] },
                      { $eq: ["$read", false] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $project: {
            _id: "$user._id",
            name: "$user.username",
            email: "$user.email",
            avatar: "$user.avatar",
            lastMessage: {
              content: "$lastMessage.content",
              timestamp: "$lastMessage.createdAt",
              sender: "$lastMessage.sender"
            },
            unreadCount: 1
          }
        },
        {
          $sort: { "lastMessage.timestamp": -1 }
        }
      ]);

      socket.emit("conversations_loaded", conversations);
      console.log(`Loaded ${conversations.length} conversations for ${socket.user.username}`);
    } catch (error) {
      console.error('Error loading conversations:', error);
      socket.emit("conversations_error", { error: "Failed to load conversations" });
    }
  });

  // Handle getting messages for a specific conversation
  socket.on("get_messages", async ({ userId, page = 1, limit = 50 }) => {
    try {
      const messages = await Message.find({
        $or: [
          { sender: socket.user._id, receiver: userId },
          { sender: userId, receiver: socket.user._id }
        ]
      })
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

      // Reverse to show oldest first
      messages.reverse();

      socket.emit("messages_loaded", {
        messages: messages.map(msg => ({
          _id: msg._id,
          sender: msg.sender._id,
          receiver: msg.receiver._id,
          content: msg.content,
          timestamp: msg.createdAt,
          read: msg.read
        })),
        hasMore: messages.length === limit
      });
      
      console.log(`Loaded ${messages.length} messages for ${socket.user.username} with ${userId}`);
    } catch (error) {
      console.error('Error loading messages:', error);
      socket.emit("messages_error", { error: "Failed to load messages" });
    }
  });

  // Handle explicit user offline
  socket.on("user_offline", (incomingUserId) => {
    const userIdToRemove = incomingUserId || userId;
    console.log(`User going offline: ${userIdToRemove}`);
    
    // Clear all typing statuses for this user
    if (typingUsers.has(userIdToRemove)) {
      const typingTo = typingUsers.get(userIdToRemove);
      typingTo.forEach(receiverId => {
        const receiverSocketId = activeUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing", {
            userId: userIdToRemove,
            isTyping: false
          });
        }
      });
      typingUsers.delete(userIdToRemove);
    }
    
    activeUsers.delete(userIdToRemove);
    userSockets.delete(socket.id);
    socket.broadcast.emit("user_disconnected", userIdToRemove);
    
    // Update online users list
    const onlineUserIds = Array.from(activeUsers.keys());
    io.emit("online_users", onlineUserIds);
  });

  // Handle disconnect with improved cleanup
  socket.on("disconnect", (reason) => {
    console.log(`User disconnected: ${socket.user?.username || socket.id} - Reason: ${reason}`);
    
    const disconnectedUserId = userSockets.get(socket.id);
    if (disconnectedUserId) {
      // Clear all typing statuses for this user
      if (typingUsers.has(disconnectedUserId)) {
        const typingTo = typingUsers.get(disconnectedUserId);
        typingTo.forEach(receiverId => {
          const receiverSocketId = activeUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", {
              userId: disconnectedUserId,
              isTyping: false
            });
          }
        });
        typingUsers.delete(disconnectedUserId);
      }
      
      activeUsers.delete(disconnectedUserId);
      userSockets.delete(socket.id);
      socket.broadcast.emit("user_disconnected", disconnectedUserId);
      
      // Update online users list
      const onlineUserIds = Array.from(activeUsers.keys());
      io.emit("online_users", onlineUserIds);
    }
  });

  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.log("Connection error:", error);
  });

  // Handle reconnection
  socket.on("reconnect", () => {
    console.log(`User reconnected: ${socket.user.username}`);
    const userId = socket.user._id.toString();
    activeUsers.set(userId, socket.id);
    userSockets.set(socket.id, userId);
    
    socket.broadcast.emit("user_connected", socket.user._id);
    const onlineUserIds = Array.from(activeUsers.keys());
    io.emit("online_users", onlineUserIds);
  });

  // Send initial data to newly connected user
  socket.emit("get_conversations");
});

// Cleanup function for graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  // Clear all active connections
  activeUsers.clear();
  userSockets.clear();
  typingUsers.clear();
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📱 Socket.io server ready for connections`);
  console.log(`💬 Chat features: Real-time messaging, typing indicators, online status`);
});