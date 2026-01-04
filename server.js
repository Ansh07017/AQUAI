
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;

if (mongoURI && mongoURI !== 'your_mongodb_uri_here') {
  mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.warn('MongoDB URI not found or not configured in .env');
}

// Basic Schema for Water Quality Logs
const WaterLogSchema = new mongoose.Schema({
  stationId: String,
  location: String,
  severity: Number,
  status: String,
  timestamp: { type: Date, default: Date.now },
  data: Object
});

const WaterLog = mongoose.model('WaterLog', WaterLogSchema);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.post('/api/logs', async (req, res) => {
  try {
    const newLog = new WaterLog(req.body);
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
