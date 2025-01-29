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

async function createAdminUser() {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@example.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

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
        console.log('Admin user created successfully!');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
        
        // Verify the admin was created
        const verifyAdmin = await User.findOne({ email: 'admin@example.com' });
        if (verifyAdmin) {
            console.log('Verified: Admin user exists in database');
        }

    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        process.exit(0);
    }
}

createAdminUser(); 