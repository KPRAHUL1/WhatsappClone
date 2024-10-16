// Server.js
const express = require('express');
const mongoose = require('mongoose');
const Pusher = require('pusher');
const cors = require('cors');
const Rooms = require('./dbRooms'); // Ensure you have dbRooms.js file
const Messages = require('./dbMessages'); // Ensure you have dbMessages.js file

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Pusher setup
const pusher = new Pusher({
  appId: '1332475', // Replace with your Pusher appId
  key: process.env.PUSHER_KEY || 'your-pusher-key', // Use environment variables for security
  secret: process.env.PUSHER_SECRET || 'your-pusher-secret', // Use environment variables for security
  cluster: 'ap2',
  useTLS: true,
});

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB Connection
const dbUrl = 'mongodb+srv://kprahul:kprahul@whatsapp.p3wfg.mongodb.net/?retryWrites=true&w=majority&appName=Whatsapp';
mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database connection error:', err));

// Database Change Streams for Pusher
const db = mongoose.connection;
db.once('open', () => {
  console.log('Database connection open');

  const roomCollection = db.collection('rooms');
  roomCollection.watch().on('change', (change) => {
    if (change.operationType === 'insert') {
      const roomDetails = change.fullDocument;
      pusher.trigger('room', 'inserted', roomDetails);
    }
  });

  const messageCollection = db.collection('messages');
  messageCollection.watch().on('change', (change) => {
    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;
      pusher.trigger('messages', 'inserted', messageDetails);
    }
  });
});

// API Endpoints
app.get('/', (req, res) => res.send('Hello from backend!'));

// Get a specific room by ID
app.get('/room/:id', (req, res) => {
  Rooms.findById(req.params.id, (err, data) => {
    if (err) return res.status(500).send(err);
    return res.status(200).send(data);
  });
});

// Get messages by room ID
app.get('/messages/:roomId', (req, res) => {
  Messages.find({ roomId: req.params.roomId }, (err, data) => {
    if (err) return res.status(500).send(err);
    return res.status(200).send(data);
  });
});

// Create a new group
app.post('/group/create', (req, res) => {
  const { groupName } = req.body;
  Rooms.create({ name: groupName }, (err, data) => {
    if (err) return res.status(500).send(err);
    return res.status(201).send(data);
  });
});

// Create a new message
app.post('/messages/new', (req, res) => {
  const dbMessage = req.body;
  Messages.create(dbMessage, (err, data) => {
    if (err) return res.status(500).send(err);
    return res.status(201).send(data);
  });
});

// Get all rooms
app.get('/all/rooms', (req, res) => {
  Rooms.find({}, (err, data) => {
    if (err) return res.status(500).send(err);
    return res.status(200).send(data);
  });
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
