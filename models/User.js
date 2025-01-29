const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    aadharId: { type: String, required: true, unique: true },
    panNumber: { type: String, required: true, unique: true },
    role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    myLands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Land' }],
    documents: {
        aadharCard: String,
        panCard: String
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema); 