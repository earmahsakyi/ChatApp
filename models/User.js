const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
   email : {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: 160,
      default: ''
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    blockedUsers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    resetToken : String,
    verifyToken: String,
    resetTokenExpiry: Date,
    tokenVersion: {
        type: Number,
        default: 0
    },
     
  

},
{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
     }
);

// Index for better search performance
userSchema.index({ username: 'text', email: 'text' });


module.exports = mongoose.model('User', userSchema);
