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
        default: 'owned' 
    },
    documents: {
        landPicture: String,
        propertyDocuments: String
    },
    buyer: { type: String }, // Change from ObjectId to String for buyer's Aadhar ID
    transactionDetails: {
        amount: Number,
        date: Date,
        status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
        buyerAadharId: String // Ensure this field is included
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Land', landSchema);