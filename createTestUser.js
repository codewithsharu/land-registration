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

async function createTestUser() {
    try {
        const hashedPassword = await bcrypt.hash('test123', 10);
        
        const testUser = new User({
            name: 'Test User',
            email: 'test@example.com',
            password: hashedPassword,
            aadharId: 'TEST001',
            panNumber: 'TESTPAN001',
            role: 'user',
            status: 'pending',
            documents: {
                aadharCard: 'test_aadhar.jpg',
                panCard: 'test_pan.jpg'
            }
        });

        await testUser.save();
        console.log('Test user created successfully');
        console.log('Email: test@example.com');
        console.log('Password: test123');
        
        // Verify test user creation
        const verifyUser = await User.findOne({ email: 'test@example.com' });
        console.log('Verified test user:', verifyUser);

    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        mongoose.connection.close();
    }
}

createTestUser(); 