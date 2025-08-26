const mongoose = require('mongoose');

const MoveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tiles: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
});

MoveSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Move', MoveSchema);
