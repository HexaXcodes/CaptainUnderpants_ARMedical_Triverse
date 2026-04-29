// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },

    // Medical profile (the LLM uses this for personalization)
    medicalInfo: {
      age: Number,
      gender: String,
      bloodGroup: String,
      conditions: [String],     // e.g. ["diabetes", "hypertension"]
      medications: [String],    // e.g. ["metformin 500mg", "aspirin 75mg"]
      allergies: [String],      // e.g. ["penicillin"]
      notes: String
    },

    // Uploaded reports (file paths only — not parsed in MVP)
    reports: [
      {
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password helper
userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
