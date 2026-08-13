const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
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

    res.status(201).json({ message: 'Registration successful', user: newUser });
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
