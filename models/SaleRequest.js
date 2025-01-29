const mongoose = require('mongoose');

const saleRequestSchema = new mongoose.Schema({
    land: { type: mongoose.Schema.Types.ObjectId, ref: 'Land', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SaleRequest', saleRequestSchema); 