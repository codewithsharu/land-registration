const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust the path if necessary

mongoose.connect('mongodb+srv://shareenpan2:Fgouter55@cluster0.s3dpu.mongodb.net/land-marketplace', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB connected successfully');
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

async function insertAdmin() {
    try {
        // Check if admin exists
        const adminExists = await User.findOne({ role: 'admin' });

        if (!adminExists) {
            // Create default admin user
            const adminUser = new User({
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'admin123', // Use plain text for testing; hash in production
                aadharId: '111111111111',
                panNumber: 'ABCDE1234F',
                role: 'admin',
                status: 'approved'
            });

            await adminUser.save();
            console.log('Default admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error inserting admin:', error);
    } finally {
        mongoose.connection.close();
    }
}

insertAdmin(); 