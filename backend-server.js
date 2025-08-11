const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8081;
const SIGNUPS_FILE = path.join(__dirname, 'beta-signups.json');

// Initialize signups file if it doesn't exist
if (!fs.existsSync(SIGNUPS_FILE)) {
    fs.writeFileSync(SIGNUPS_FILE, JSON.stringify([], null, 2));
}

// Load existing signups
let betaSignups = JSON.parse(fs.readFileSync(SIGNUPS_FILE, 'utf8'));

// Middleware
// Configure CORS for production
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Save signups to file
const saveSignups = () => {
    fs.writeFileSync(SIGNUPS_FILE, JSON.stringify(betaSignups, null, 2));
};

// Pre-signup endpoint
app.post('/v1/auth/pre-signup', (req, res) => {
    const { username, email } = req.body;
    
    console.log('Received signup request:', { username, email });
    
    if (!username || !email) {
        return res.status(400).json({
            success: false,
            message: "All fields must be completed",
            data: null
        });
    }
    
    // Check if email already exists
    const exists = betaSignups.find(signup => signup.email === email);
    if (exists) {
        console.log('Duplicate email detected:', email);
        return res.status(401).json({
            success: false,
            message: "User with this email already exists",
            data: null
        });
    }
    
    // Add to signups
    const newSignup = { username, email, timestamp: new Date().toISOString() };
    betaSignups.push(newSignup);
    saveSignups();
    
    console.log('New beta signup added:', newSignup);
    console.log('Total signups:', betaSignups.length);
    
    return res.status(200).json({
        success: true,
        message: "User registered successfully",
        data: null
    });
});

// Status endpoint
app.get('/v1/status', (req, res) => {
    res.json({
        status: 'ok',
        signups: betaSignups.length,
        uptime: process.uptime()
    });
});

// List signups (for testing)
app.get('/v1/signups', (req, res) => {
    res.json({
        success: true,
        count: betaSignups.length,
        data: betaSignups
    });
});

// Health check
app.get('/', (req, res) => {
    res.send('Beta Signup Backend Server is running!');
});

app.listen(PORT, () => {
    console.log(`\n🚀 Beta Signup Backend Server is running!`);
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`\n📌 Available endpoints:`);
    console.log(`   POST /v1/auth/pre-signup - Register for beta`);
    console.log(`   GET  /v1/status         - Check server status`);
    console.log(`   GET  /v1/signups        - List all signups`);
    console.log(`\n💾 Signups are saved to: ${SIGNUPS_FILE}`);
    console.log(`📊 Current signups: ${betaSignups.length}`);
    console.log('\n✨ Ready to accept beta signups!\n');
});