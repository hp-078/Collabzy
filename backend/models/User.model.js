import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: ['brand', 'influencer', 'admin'],
      required: [true, 'User role is required'],
      default: 'influencer'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'banned', 'deleted'],
      default: 'active'
    },
    lastLogin: {
      type: Date,
      default: null
    },
    profileCompleted: {
      type: Boolean,
      default: false
    },
    // Reference to role-specific profile
    brandProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BrandProfile'
    },
    influencerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InfluencerProfile'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash if password is modified or new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Virtual for profile based on role
userSchema.virtual('profile', {
  refPath: (doc) => {
    if (doc.role === 'brand') return 'BrandProfile';
    if (doc.role === 'influencer') return 'InfluencerProfile';
    return null;
  },
  localField: (doc) => {
    if (doc.role === 'brand') return 'brandProfile';
    if (doc.role === 'influencer') return 'influencerProfile';
    return null;
  },
  foreignField: '_id',
  justOne: true
});

const User = mongoose.model('User', userSchema);

export default User;
