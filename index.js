const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path'); // Add this line

const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON bodies
app.use(express.json());

// Main endpoint for Journey Builder
app.post('/execute', (req, res) => {
    // ... all of our existing execute logic ...
    // (No changes needed inside this function)
    const token = req.headers['x-jwt-assertion'];
    const weatherApiKey = process.env.WEATHER_API_KEY;
    const jwtSigningSecret = process.env.JWT_SIGNING_SECRET;

    if (!weatherApiKey || !jwtSigningSecret) {
        return res.status(500).send('Internal Server Error: App is not configured.');
    }
    
    if (!token) {
        return res.status(401).send('Unauthorized: Missing token.');
    }

    jwt.verify(token, jwtSigningSecret, (err, decoded) => {
        if (err) {
            return res.status(401).send('Unauthorized: Invalid token.');
        }

        const inArguments = decoded.inArguments[0] || {};
        const latitude = inArguments.latitude;
        const longitude = inArguments.longitude;

        if (!latitude || !longitude) {
            return res.status(400).send('Bad Request: Missing location data.');
        }

        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weatherApiKey}`;
        
        axios.get(weatherUrl)
            .then(response => {
                const weatherCondition = response.data.weather[0].main;
                let outcome = 'Not Raining';
                if (weatherCondition === 'Rain' || weatherCondition === 'Drizzle' || weatherCondition === 'Thunderstorm') {
                    outcome = 'Raining';
                }
                res.status(200).json({ branchResult: outcome });
            })
            .catch(error => {
                res.status(500).send('Internal Server Error');
            });
    });
});

// --- NEW ROUTES FOR JOURNEY BUILDER UI ---
app.post('/save', (req, res) => {
    res.status(200).json({ success: true });
});

app.post('/validate', (req, res) => {
    res.status(200).json({ success: true });
});

app.post('/publish', (req, res) => {
    res.status(200).json({ success: true });
});

// This line allows Vercel to handle the server
module.exports = app;