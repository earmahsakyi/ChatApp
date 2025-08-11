const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');
const { validationResult, body } = require('express-validator');

// @route   GET api/messages/conversations
// @desc    Get all conversations for logged in user
// @access  Private
router.get('/conversations', auth, async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user.id },
            { receiver: req.user.id }
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
              { $eq: ["$sender", req.user.id] },
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
                    { $eq: ["$receiver", req.user.id] },
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

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   GET api/messages/:userId
// @desc    Get messages between logged in user and another user
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Validate if the user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    })
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    // Reverse to show oldest first
    messages.reverse();

    res.json({
      success: true,
      data: messages,
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   POST api/messages
// @desc    Send a message
// @access  Private
router.post('/', [
  auth,
  [
    body('receiver', 'Receiver is required').notEmpty(),
    body('content', 'Message content is required').notEmpty().isLength({ min: 1, max: 1000 })
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { receiver, content } = req.body;

    // Validate receiver exists
    const receiverUser = await User.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({
        success: false,
        msg: 'Receiver not found'
      });
    }

    // Create message
    const message = new Message({
      sender: req.user.id,
      receiver,
      content: content.trim()
    });

    await message.save();

    // Populate sender and receiver info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username avatar')
      .populate('receiver', 'username avatar');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   PUT api/messages/read/:userId
// @desc    Mark all messages from a user as read
// @access  Private
router.put('/read/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Update all unread messages from this user
    const result = await Message.updateMany(
      { 
        sender: userId, 
        receiver: req.user.id, 
        read: false 
      },
      { read: true }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} messages marked as read`
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   GET api/messages/unread/count
// @desc    Get total unread message count
// @access  Private
router.get('/unread/count', auth, async (req, res) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user.id,
      read: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   DELETE api/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        msg: 'Message not found'
      });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        msg: 'Not authorized to delete this message'
      });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({
      success: true,
      msg: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

module.exports = router;