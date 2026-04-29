// routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

// Ensure uploads dir exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = /pdf|doc|docx|txt|jpg|jpeg|png/i.test(
      path.extname(file.originalname)
    );
    if (ok) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX, TXT, JPG, PNG allowed'));
  }
});

// POST /api/upload/report
router.post('/report', protect, upload.single('report'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const user = await User.findById(req.user._id);
    const reportEntry = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      mimetype: req.file.mimetype
    };
    user.reports.push(reportEntry);
    await user.save();

    res.json({
      message: 'Report uploaded successfully',
      report: reportEntry,
      totalReports: user.reports.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/upload/reports — list user's reports
router.get('/reports', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json(user.reports);
});

module.exports = router;
