const mongoose = require('mongoose');

const landSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    area: { type: Number, required: true }, // in square feet
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { 
        type: String, 
        enum: ['owned', 'pending_sale', 'available', 'pending', 'sold'], 
        default: 'owned' 
    },
    documents: {
        landPicture: String,
        propertyDocuments: String
    },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    transactionDetails: {
        amount: Number,
        date: Date,
        status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Land', landSchema); 