const mongoose = require('mongoose');

const landSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    area: { type: Number, required: true }, // in square feet
    landno: { type: String, required: true }, // New field for land number
    aadharId: { type: String, required: true }, // New field for owner's Aadhar ID
    status: { 
        type: String, 
        enum: ['owned', 'pending_sale', 'available', 'pending', 'sold'], 
        default: 'available' // Default to 'available'
    },
    documents: {
        landPicture: String,
        propertyDocuments: String
    },
    buyerAadharId: { type: String }, // New field for buyer's Aadhar ID
    transactionId: { type: String }, // New field for transaction ID
    buyingStatus: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' }, // New field for buying status
    approved: { type: Boolean, default: false }, // New field for approval status
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Land', landSchema);