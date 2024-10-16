const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: String,
  message: String,
  timestamp: String,
  uid: String,
  roomId: String,
}, { timestamps: true });

module.exports = mongoose.model('Messages', messageSchema);
