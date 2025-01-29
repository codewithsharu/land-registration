const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb+srv://shareenpan2:Fgouter55@cluster0.s3dpu.mongodb.net/land-marketplace', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected successfully');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function checkAdmin() {
    try {
        const users = await User.find({});
        console.log('All users in database:', users);
        
        const admin = await User.findOne({ email: 'admin@example.com' });
        if (admin) {
            console.log('Admin found:', {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                status: admin.status
            });
        } else {
            console.log('No admin user found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
}

checkAdmin(); 