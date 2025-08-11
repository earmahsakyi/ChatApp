// routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');

// @route   GET api/users/search
// @desc    Search users by username or email
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        msg: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    
    const users = await User.find({
      _id: { $ne: req.user.id }, // Exclude current user
      $or: [
        { username: searchRegex },
        { email: searchRegex }
      ]
    })
    .select('-password -resetToken -resetTokenExpiry -tokenVersion')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ username: 1 });

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   GET api/users/all
// @desc    Get all users (for chat selection)
// @access  Private
router.get('/all', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const users = await User.find({ _id: { $ne: req.user.id } })
      .select('-password -resetToken -resetTokenExpiry -tokenVersion')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ username: 1 });

    // Get conversation status with each user
    const usersWithConversations = await Promise.all(
      users.map(async (user) => {
        const hasConversation = await Message.findOne({
          $or: [
            { sender: req.user.id, receiver: user._id },
            { sender: user._id, receiver: req.user.id }
          ]
        });

        const unreadCount = await Message.countDocuments({
          sender: user._id,
          receiver: req.user.id,
          read: false
        });

        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          hasConversation: !!hasConversation,
          unreadCount,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: usersWithConversations,
      count: usersWithConversations.length
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   GET api/users/profile/:userId
// @desc    Get user profile
// @access  Private
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password -resetToken -resetTokenExpiry -tokenVersion');

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Get conversation stats
    const messageCount = await Message.countDocuments({
      $or: [
        { sender: req.user.id, receiver: userId },
        { sender: userId, receiver: req.user.id }
      ]
    });

    const unreadCount = await Message.countDocuments({
      sender: userId,
      receiver: req.user.id,
      read: false
    });

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        conversationStats: {
          totalMessages: messageCount,
          unreadMessages: unreadCount
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { username, avatar, bio } = req.body;
    
    const updateFields = {};
    if (username) updateFields.username = username;
    if (avatar) updateFields.avatar = avatar;
    if (bio !== undefined) updateFields.bio = bio;

    // Check if username is already taken
    if (username) {
      const existingUser = await User.findOne({ 
        username,
        _id: { $ne: req.user.id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          msg: 'Username is already taken'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true }
    ).select('-password -resetToken -resetTokenExpiry -tokenVersion');

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   POST api/users/block/:userId
// @desc    Block a user
// @access  Private
router.post('/block/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        msg: 'Cannot block yourself'
      });
    }

    const userToBlock = await User.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        msg: 'User not found'
      });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { blockedUsers: userId }
    });

    res.json({
      success: true,
      msg: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   DELETE api/users/block/:userId
// @desc    Unblock a user
// @access  Private
router.delete('/block/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { blockedUsers: userId }
    });

    res.json({
      success: true,
      msg: 'User unblocked successfully'
    });

  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

// @route   GET api/users/blocked
// @desc    Get blocked users list
// @access  Private
router.get('/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('blockedUsers', 'username email avatar')
      .select('blockedUsers');

    res.json({
      success: true,
      data: user.blockedUsers || []
    });

  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({
      success: false,
      msg: 'Server Error'
    });
  }
});

module.exports = router;