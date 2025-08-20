const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware to parse JSON bodies, as SFMC sends data in this format.
app.use(express.json());

// A simple root route to confirm the app is running
app.get('/', (req, res) => {
  res.status(200).send('SFMC Weather Activity Middleware is running.');
});

// The main endpoint that Journey Builder's execute function will call
app.post('/execute', (req, res) => {
    // For Vercel, headers are converted to lowercase
    const token = req.headers['x-jwt-assertion'];
    
    // Retrieve secret keys from environment variables
    const weatherApiKey = process.env.WEATHER_API_KEY;
    const jwtSigningSecret = process.env.JWT_SIGNING_SECRET;

    if (!weatherApiKey || !jwtSigningSecret) {
        console.error('API keys are not configured in environment variables.');
        return res.status(500).send('Internal Server Error: App is not configured.');
    }
    
    if (!token) {
        console.error('Error: No JWT was provided by Journey Builder.');
        return res.status(401).send('Unauthorized: Missing token.');
    }

    // Verify that the request is genuinely from your SFMC account
    jwt.verify(token, jwtSigningSecret, (err, decoded) => {
        if (err) {
            console.error('JWT verification failed:', err);
            return res.status(401).send('Unauthorized: Invalid token.');
        }

        const inArguments = decoded.inArguments[0] || {};
        const latitude = inArguments.latitude;
        const longitude = inArguments.longitude;

        if (!latitude || !longitude) {
            console.error('Error: Latitude or Longitude not found in inArguments.');
            return res.status(400).send('Bad Request: Missing location data.');
        }

        // Construct the URL for the OpenWeather API call
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weatherApiKey}`;
        
        // Call the Weather API
        axios.get(weatherUrl)
            .then(response => {
                const weatherCondition = response.data.weather[0].main;
                console.log(`Weather for contact is: ${weatherCondition}`);

                // Determine the outcome for the journey branch
                let outcome = 'Not Raining';
                if (weatherCondition === 'Rain' || weatherCondition === 'Drizzle' || weatherCondition === 'Thunderstorm') {
                    outcome = 'Raining';
                }

                // Send the result back to Journey Builder
                res.status(200).json({ branchResult: outcome });
            })
            .catch(error => {
                console.error('Error calling weather API:', error.message);
                res.status(500).send('Internal Server Error');
            });
    });
});

// This line allows Vercel to handle the server
module.exports = app;