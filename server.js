const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Land = require('./models/Land');
const SaleRequest = require('./models/SaleRequest');

const app = express();
const PORT = process.env.PORT || 3000;

// Add these lines near the top of your server.js, after creating the Express app
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Add this middleware to log all requests (for debugging)
app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    next();
});

// MongoDB connection
mongoose.connect('mongodb+srv://shareenpan2:Fgouter55@cluster0.s3dpu.mongodb.net/land-marketplace', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    family: 4 // Use IPv4, skip trying IPv6
})
.then(() => {
    console.log('Successfully connected to MongoDB.');
    setupDefaultAdmin(); // Call the function to set up the default admin
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit with failure
});

// Add this to handle MongoDB connection errors after initial connection
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.set('view engine', 'ejs');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login'); // Redirect to login if not authenticated
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Unauthorized');
    }
};

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Login page route
app.get('/login', (req, res) => {
    res.render('login');
});

// Register page route
app.get('/register', (req, res) => {
    res.render('register');
});

// Registration
app.post('/register', upload.fields([{ name: 'aadharCard' }, { name: 'panCard' }]), async (req, res) => {
    try {
        console.log('Registration data:', req.body); // Log the incoming data

        const { name, email, password, aadharId, panNumber } = req.body;

        // Validate input data
        if (!name || !email || !password || !aadharId || !panNumber) {
            return res.status(400).send('All fields are required.');
        }

        const existingUser = await User.findOne({ aadharId });
        if (existingUser) {
            return res.status(400).send('A user with this Aadhar ID already exists.');
        }

        const newUser = new User({
            name,
            email,
            password, // Use plain text for testing; hash in production
            aadharId,
            panNumber,
            role: 'user',
            status: 'pending',
            documents: {
                aadharCard: req.files['aadharCard'][0].filename, // Save the filename
                panCard: req.files['panCard'][0].filename // Save the filename
            }
        });

        await newUser.save();
        res.status(201).send('User registered successfully.');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user.');
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        // Compare plain text password
        if (user.password !== req.body.password) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        if (user.status !== 'approved') {
            return res.render('login', { error: 'Your account is pending approval' });
        }

        // Store user details in session
        req.session.user = {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            aadharId: user.aadharId,
            status: user.status
        };
        
        req.session.isLoggedIn = true; // Set logged in status

        // Redirect based on user role
        if (user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else {
            res.redirect('/dashboard');
        }
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { error: 'An error occurred' });
    }
});

// Dashboard
app.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        console.log('Session Aadhar ID:', req.session.user.aadharId); // Log session Aadhar ID
        const myLands = await Land.find({ aadharId: req.session.user.aadharId }); // Fetch user's lands using aadharId

        console.log('Fetched Lands:', myLands); // Log fetched lands for debugging

        res.render('userdashboard', { 
            user: req.session.user,
            myLands: myLands, // Pass user's lands to the view
        });
    } catch (error) {
        console.error('User dashboard error:', error);
        res.status(500).send('Error loading user dashboard');
    }
});

// Admin Dashboard
app.get('/admin/dashboard', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ status: 'pending' }); // Fetch pending users
        const pendingSales = await SaleRequest.find({ status: 'pending' }); // Fetch pending sale requests

        res.render('admin/dashboard', { 
            user: req.session.user,
            pendingUsers: pendingUsers, // Pass pending users to the view
            pendingSales: pendingSales // Pass pending sales to the view
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).send('Error loading admin dashboard');
    }
});

// Route to render the lands page
app.get('/lands', isAuthenticated, async (req, res) => {
    try {
        const lands = await Land.find({ status: 'available' }); // Fetch available lands
        console.log('Available Lands:', lands); // Log the lands to check if they are fetched correctly
        res.render('lands', { lands, user: req.session.user }); // Pass lands and user data to the view
    } catch (error) {
        console.error('Error fetching lands:', error);
        res.status(500).send('Error fetching lands');
    }
});

// Approve User
app.post('/admin/approve-user/:userId', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        await User.findByIdAndUpdate(userId, { status: 'approved' });
        res.redirect('/admin/dashboard');
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).send('Error approving user');
    }
});

// Add Land
app.post('/land/add', upload.fields([{ name: 'landPicture' }, { name: 'propertyDocuments' }]), async (req, res) => {
    try {
        const { title, description, price, location, area, landno } = req.body;

        const newLand = new Land({
            title,
            description,
            price,
            location,
            area,
            landno,
            aadharId: req.session.user.aadharId,
            status: 'available',
            documents: {
                landPicture: req.files['landPicture'][0].filename,
                propertyDocuments: req.files['propertyDocuments'][0].filename
            }
        });

        await newLand.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error adding land:', error);
        res.status(500).send('Error adding land');
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});

// Add a route to check session status (useful for debugging)
app.get('/sc', (req, res) => {
    res.json({
        isLoggedIn: req.session.isLoggedIn || false,
        user: req.session.user || null
    });
});

// Function to set up default admin user
async function setupDefaultAdmin() {
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
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
}

app.get('/test-login', async (req, res) => {
    const testEmail = 'admin@example.com'; // Change to the email you want to test
    const testPassword = 'admin123'; // Change to the password you want to test

    const user = await User.findOne({ email: testEmail });
    if (!user) {
        return res.send('User not found');
    }

    // Compare plain text password
    if (user.password !== testPassword) {
        return res.send('Invalid password');
    }

    req.session.user = {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        aadharId: user.aadharId,
        status: user.status
    };
    
    req.session.isLoggedIn = true;

    res.send('Login successful');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 
