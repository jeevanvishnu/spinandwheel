const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);


const app = express();
const PORT = process.env.PORT || process.env.PORT;
const mongo_url = process.env.MONGO_URL;
// Middleware
app.use(cors());
app.use(express.json());

// Setup spinimage directory for uploads
const uploadDir = path.join(__dirname, 'spinimage');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve spinimage folder statically
app.use('/spinimage', express.static(uploadDir));

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// MongoDB Connection
mongoose.connect(mongo_url)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  invoice: { type: String, required: true, unique: true },
  prize: { type: String, default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const segmentSchema = new mongoose.Schema({
  label: { type: String, required: true },
  imageURL: { type: String },
  count: { type: Number, default: 0 },
  afterWin: { type: String, default: 'random' }
});
const Segment = mongoose.model('Segment', segmentSchema);

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
});
const Settings = mongoose.model('Settings', settingsSchema);

// Register Endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, invoice } = req.body;

    // Basic validation
    if (!name || !email || !phone || !invoice) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if invoice already exists
    const existingUser = await User.findOne({ invoice });
    if (existingUser) {
      return res.status(400).json({ error: 'Invoice already used for a spin' });
    }

    // Create new user
    const newUser = new User({ name, email, phone, invoice });
    await newUser.save();

    const spinNumber = await User.countDocuments();

    res.status(201).json({ message: 'Registration successful', user: newUser, spinNumber });
  } catch (error) {
    console.error('Error during registration:', error);
    if (error.code === 11000) {
        return res.status(400).json({ error: 'Invoice already used for a spin' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Endpoint to fetch all users
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Endpoint to update a user
app.put('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, invoice, prize } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, phone, invoice, prize },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 11000) {
        return res.status(400).json({ error: 'Invoice already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Endpoint to delete a user
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Passkey Verification Endpoint
app.post('/api/admin/verify-passkey', async (req, res) => {
  try {
    const { passkey } = req.body;
    let setting = await Settings.findOne({ key: 'adminPasskey' });
    
    if (!setting) {
      // Create default if it doesn't exist
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin2244', salt);
      setting = new Settings({ key: 'adminPasskey', value: hashedPassword });
      await setting.save();
    } else if (typeof setting.value === 'string' && !setting.value.startsWith('$2a$') && !setting.value.startsWith('$2b$')) {
      // Migrate unhashed password to hashed password if one already exists in DB
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(setting.value, salt);
      setting.value = hashedPassword;
      await setting.save();
    }
    
    // Verify using bcrypt
    const isMatch = await bcrypt.compare(passkey, setting.value);
    
    if (isMatch) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: 'Incorrect passkey' });
    }
  } catch (error) {
    console.error('Error verifying passkey:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Endpoint to fetch all segments
app.get('/api/segments', async (req, res) => {
  try {
    const segments = await Segment.find();
    res.status(200).json(segments);
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Endpoint to add a segment
app.post('/api/admin/segments', upload.single('image'), async (req, res) => {
  try {
    const { label, count } = req.body;
    let imageURL = req.body.imageURL || ''; // Allow string URL fallback if no file
    
    if (req.file) {
      imageURL = `/spinimage/${req.file.filename}`;
    }

    if (!label) {
      return res.status(400).json({ error: 'Label is required' });
    }
    const newSegment = new Segment({ label, imageURL, count: count ? Number(count) : 0 });
    await newSegment.save();
    res.status(201).json(newSegment);
  } catch (error) {
    console.error('Error creating segment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Endpoint to update a segment
app.put('/api/admin/segments/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { label, count } = req.body;
    let imageURL = req.body.imageURL;
    
    if (req.file) {
      imageURL = `/spinimage/${req.file.filename}`;
    }

    const updatedSegment = await Segment.findByIdAndUpdate(
      id,
      { label, ...(count !== undefined && { count: Number(count) }), ...(imageURL !== undefined && { imageURL }) },
      { new: true, runValidators: true }
    );
    if (!updatedSegment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.status(200).json(updatedSegment);
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Endpoint to delete a segment
app.delete('/api/admin/segments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedSegment = await Segment.findByIdAndDelete(id);
    if (!deletedSegment) {
      return res.status(404).json({ error: 'Segment not found' });
    }
    res.status(200).json({ message: 'Segment deleted successfully' });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Endpoint to bulk update counts
app.post('/api/admin/segments/bulk-counts', async (req, res) => {
  try {
    const { counts } = req.body;
    if (!Array.isArray(counts)) return res.status(400).json({ error: 'Invalid data' });
    
    for (const item of counts) {
      await Segment.findByIdAndUpdate(item._id, { 
        count: item.count,
        afterWin: item.afterWin || 'disable'
      });
    }
    res.status(200).json({ message: 'Counts updated successfully' });
  } catch (error) {
    console.error('Error updating counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start Server
app.put('/api/update-prize', async (req, res) => {
  try {
    const { invoice, prize } = req.body;
    if (!invoice || !prize) return res.status(400).json({ error: 'Invoice and prize required' });
    
    const user = await User.findOneAndUpdate({ invoice }, { prize }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating prize:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check / Keep-alive endpoint
app.get('/api/ping', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Self-ping to keep Render free tier awake
const backendUrl = process.env.BACKEND_URL;
if (backendUrl) {
  const https = require('https');
  const http = require('http');
  const client = backendUrl.startsWith('https') ? https : http;
  
  // Pings every 5 minutes (300,000 milliseconds)
  // 5 seconds is too aggressive and can cause issues with Render
  setInterval(() => {
    client.get(`${backendUrl}/api/ping`, (resp) => {
      console.log(`Self-ping to keep awake successful. Status: ${resp.statusCode}`);
    }).on("error", (err) => {
      console.error("Self-ping failed:", err.message);
    });
  }, 5 * 60 * 1000);
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
