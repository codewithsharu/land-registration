const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

async function resetDatabase() {
    try {
        // Delete all users
        await User.deleteMany({});
        console.log('Deleted all users');

        // Create new admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedPassword,
            aadharId: 'ADMIN001',
            panNumber: 'ADMINPAN001',
            role: 'admin',
            status: 'approved',
            documents: {
                aadharCard: 'admin_aadhar.jpg',
                panCard: 'admin_pan.jpg'
            }
        });

        await adminUser.save();
        console.log('New admin user created successfully');
        
        // Verify admin creation
        const verifyAdmin = await User.findOne({ email: 'admin@example.com' });
        console.log('Verified admin:', verifyAdmin);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

resetDatabase(); 