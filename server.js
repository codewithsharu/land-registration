const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const User = require('./models/User');
const Land = require('./models/Land');
const SaleRequest = require('./models/SaleRequest');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    next();
});

mongoose.connect('mongodb+srv://shareenpan2:Fgouter55@cluster0.s3dpu.mongodb.net/land-marketplace', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    family: 4
})
.then(() => {
    console.log('Successfully connected to MongoDB.');
    setupDefaultAdmin();
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000
    }
}));
app.set('view engine', 'ejs');

const isAuthenticated = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
};

const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).send('Unauthorized');
    }
};

app.get('/', (req, res) => {
    res.render('login', { user: req.session.user });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/dashboard');
    }
    res.render('register', { user: req.session.user });
});

app.post('/register', upload.fields([{ name: 'aadharCard' }, { name: 'panCard' }]), async (req, res) => {
    try {
        const { name, email, password, aadharId, panNumber } = req.body;

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
            password,
            aadharId,
            panNumber,
            role: 'user',
            status: 'pending',
            documents: {
                aadharCard: req.files['aadharCard'][0].filename,
                panCard: req.files['panCard'][0].filename
            }
        });

        await newUser.save();
        res.status(201).send('User registered successfully.');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user.');
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        if (user.password !== req.body.password) {
            return res.render('login', { error: 'Invalid email or password' });
        }

        if (user.status !== 'approved') {
            return res.render('login', { error: 'Your account is pending approval' });
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

app.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const myLands = await Land.find({ aadharId: req.session.user.aadharId });
        res.render('userdashboard', { 
            user: req.session.user,
            myLands: myLands,
        });
    } catch (error) {
        console.error('User dashboard error:', error);
        res.status(500).send('Error loading user dashboard');
    }
});

app.get('/admin/dashboard', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ status: 'pending' });
        const pendingSales = await SaleRequest.find({ status: 'pending' });

        res.render('admin/dashboard', { 
            user: req.session.user,
            pendingUsers: pendingUsers,
            pendingSales: pendingSales
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).send('Error loading admin dashboard');
    }
});

app.get('/lands', isAuthenticated, async (req, res) => {
    try {
        const lands = await Land.find({ status: 'available' });
        res.render('lands', { lands, user: req.session.user });
    } catch (error) {
        console.error('Error fetching lands:', error);
        res.status(500).send('Error fetching lands');
    }
});

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

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});

app.get('/sc', (req, res) => {
    res.json({
        isLoggedIn: req.session.isLoggedIn || false,
        user: req.session.user || null
    });
});

async function setupDefaultAdmin() {
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
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
    const testEmail = 'admin@example.com';
    const testPassword = 'admin123';

    const user = await User.findOne({ email: testEmail });
    if (!user) {
        return res.send('User not found');
    }

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

app.post('/buy/:buyerAadharId/:landno', isAuthenticated, async (req, res) => {
    try {
        const { buyerAadharId, landno } = req.params;
        const transactionId = req.body.transactionId;

        const land = await Land.findOne({ landno });

        if (!land) {
            return res.status(404).send('Land not found');
        }

        land.buyerAadharId = buyerAadharId;
        land.transactionId = transactionId;
        land.buyingStatus = 'pending';
        land.status = 'pending';

        await land.save();

        res.status(200).send('Land purchase initiated successfully. Awaiting verification.');
    } catch (error) {
        console.error('Error buying land:', error);
        res.status(500).send('Error processing purchase');
    }
});

app.post('/transfer/:landno/:buyerAadharId', isAuthenticated, async (req, res) => {
    try {
        const { landno, buyerAadharId } = req.params;

        const land = await Land.findOne({ landno });

        if (!land) {
            return res.status(404).send('Land not found');
        }

        land.aadharId = buyerAadharId;
        land.status = 'owned';
        land.buyingStatus = 'completed';

        await land.save();

        res.status(200).send('Ownership transferred successfully.');
    } catch (error) {
        console.error('Error transferring ownership:', error);
        res.status(500).send('Error transferring ownership');
    }
});

app.get('/verification', isAuthenticated, async (req, res) => {
    try {
        const pendingLands = await Land.find({ aadharId: req.session.user.aadharId, status: 'pending' });
        res.render('verification', { lands: pendingLands, user: req.session.user });
    } catch (error) {
        console.error('Error fetching pending lands for verification:', error);
        res.status(500).send('Error fetching pending lands');
    }
});

app.get('/approve-land', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const lands = await Land.find();
        res.render('admin/approve-land', { lands, user: req.session.user });
    } catch (error) {
        console.error('Error fetching lands for approval:', error);
        res.status(500).send('Error fetching lands for approval');
    }
});

app.post('/approve-land/:landno', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const landno = req.params.landno;
        await Land.findOneAndUpdate({ landno }, { approved: true });
        res.redirect('/approve-land');
    } catch (error) {
        console.error('Error approving land:', error);
        res.status(500).send('Error approving land');
    }
});

app.post('/reject-land/:landno', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const landno = req.params.landno;
        await Land.findOneAndUpdate({ landno }, { rejectedstatus: true });
        res.redirect('/approve-land');
    } catch (error) {
        console.error('Error rejecting land:', error);
        res.status(500).send('Error rejecting land');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 
