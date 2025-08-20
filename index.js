const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// Serve static files from the 'public' directory
// This line serves your CSS, JS, and other assets for the UI
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON bodies
app.use(express.json());

// --- NEW ---
// This route explicitly serves your index.html file for the homepage.
// This is a robust way to fix the 404 error.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Explicit route for config.json (required for SFMC)
app.get('/config.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'config.json'));
});

// Main endpoint for Journey Builder
app.post('/execute', async (req, res) => {
    console.log('Execute endpoint called:', JSON.stringify(req.body, null, 2));
    
    const token = req.headers['x-jwt-assertion'];
    const weatherApiKey = process.env.WEATHER_API_KEY;
    const jwtSigningSecret = process.env.JWT_SIGNING_SECRET;

    if (!weatherApiKey || !jwtSigningSecret) {
        console.error('Missing configuration: Weather API Key or JWT Secret');
        return res.status(500).json({ 
            error: 'Internal Server Error: App is not configured.',
            branchResult: 'Good Weather' 
        });
    }
    
    if (!token) {
        console.error('Missing JWT token');
        return res.status(401).json({ 
            error: 'Unauthorized: Missing token.',
            branchResult: 'Good Weather' 
        });
    }

    try {
        const decoded = jwt.verify(token, jwtSigningSecret);
        console.log('JWT decoded successfully:', JSON.stringify(decoded, null, 2));
        
        const inArguments = decoded.inArguments && decoded.inArguments[0] || req.body.inArguments && req.body.inArguments[0] || {};
        console.log('inArguments:', JSON.stringify(inArguments, null, 2));
        
        const contactKey = inArguments.contactKey;
        const locationFieldValue = inArguments.locationField;
        const locationFieldType = inArguments.locationFieldType || 'coordinates';
        const weatherConditions = inArguments.weatherConditions || 'rain,snow,storm';

        if (!locationFieldValue) {
            console.error('Missing location field value');
            return res.status(400).json({ 
                error: 'Bad Request: Missing location data.',
                branchResult: 'Good Weather' 
            });
        }

        // Get coordinates based on location type
        let lat, lon;
        
        if (locationFieldType === 'coordinates') {
            // Handle coordinates in format "lat,lng" or object with lat/lng
            if (typeof locationFieldValue === 'string') {
                const coords = locationFieldValue.split(',');
                if (coords.length === 2) {
                    lat = parseFloat(coords[0].trim());
                    lon = parseFloat(coords[1].trim());
                }
            } else if (typeof locationFieldValue === 'object') {
                lat = locationFieldValue.latitude || locationFieldValue.lat;
                lon = locationFieldValue.longitude || locationFieldValue.lng || locationFieldValue.lon;
            }
        } else {
            // Use geocoding for other location types
            const geoResult = await geocodeLocation(locationFieldValue, locationFieldType, weatherApiKey);
            if (geoResult) {
                lat = geoResult.lat;
                lon = geoResult.lon;
            }
        }

        if (!lat || !lon) {
            console.error('Could not determine coordinates from location data:', locationFieldValue);
            return res.status(400).json({ 
                error: 'Bad Request: Could not determine coordinates from location data.',
                branchResult: 'Good Weather' 
            });
        }

        console.log(`Getting weather for coordinates: ${lat}, ${lon}`);
        
        // Get weather data
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
        
        const response = await axios.get(weatherUrl);
        const weatherData = response.data;
        
        console.log('Weather API response:', JSON.stringify(weatherData, null, 2));
        
        const currentWeather = weatherData.weather[0].main.toLowerCase();
        const description = weatherData.weather[0].description;
        const temperature = Math.round(weatherData.main.temp);
        const humidity = weatherData.main.humidity;
        
        // Check against configured weather conditions
        const checkConditions = weatherConditions.toLowerCase().split(',').map(c => c.trim());
        let outcome = 'Good Weather';
        
        // Map weather conditions
        const weatherMapping = {
            'rain': ['rain', 'drizzle'],
            'snow': ['snow'],
            'storm': ['thunderstorm'],
            'clear': ['clear'],
            'clouds': ['clouds']
        };
        
        for (const condition of checkConditions) {
            if (weatherMapping[condition]) {
                if (weatherMapping[condition].includes(currentWeather)) {
                    outcome = 'Adverse Weather';
                    break;
                }
            } else if (currentWeather.includes(condition)) {
                outcome = 'Adverse Weather';
                break;
            }
        }
        
        console.log(`Weather check result: ${currentWeather} -> ${outcome}`);
        
        const result = {
            branchResult: outcome,
            weatherCondition: currentWeather,
            temperature: temperature,
            humidity: humidity,
            description: description,
            coordinates: { lat, lon },
            contactKey: contactKey
        };
        
        res.status(200).json(result);
        
    } catch (error) {
        console.error('Error in execute endpoint:', error);
        res.status(500).json({ 
            error: 'Internal Server Error: ' + error.message,
            branchResult: 'Good Weather' 
        });
    }
});

// Geocoding function to convert location data to coordinates
async function geocodeLocation(locationValue, locationType, apiKey) {
    try {
        let geocodeUrl;
        
        switch (locationType) {
            case 'zipcode':
                geocodeUrl = `https://api.openweathermap.org/geo/1.0/zip?zip=${encodeURIComponent(locationValue)}&appid=${apiKey}`;
                break;
            case 'city':
                geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationValue)}&limit=1&appid=${apiKey}`;
                break;
            case 'address':
                // For full addresses, we'll try to use them as city names
                geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(locationValue)}&limit=1&appid=${apiKey}`;
                break;
            default:
                throw new Error(`Unsupported location type: ${locationType}`);
        }
        
        console.log('Geocoding URL:', geocodeUrl);
        const response = await axios.get(geocodeUrl);
        
        if (locationType === 'zipcode') {
            return {
                lat: response.data.lat,
                lon: response.data.lon
            };
        } else {
            if (response.data.length > 0) {
                return {
                    lat: response.data[0].lat,
                    lon: response.data[0].lon
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

// --- ROUTES FOR JOURNEY BUILDER UI ---

// Save endpoint - called when the activity configuration is saved
app.post('/save', (req, res) => {
    console.log('Save endpoint called:', JSON.stringify(req.body, null, 2));
    
    try {
        const config = req.body;
        
        // Validate required configuration
        if (!config.arguments || !config.arguments.execute || !config.arguments.execute.inArguments) {
            return res.status(400).json({ 
                error: 'Invalid configuration: Missing required arguments',
                success: false 
            });
        }
        
        const inArgs = config.arguments.execute.inArguments[0] || {};
        
        if (!inArgs.locationField) {
            return res.status(400).json({ 
                error: 'Invalid configuration: Location field is required',
                success: false 
            });
        }
        
        if (!inArgs.locationFieldType) {
            return res.status(400).json({ 
                error: 'Invalid configuration: Location field type is required',
                success: false 
            });
        }
        
        // Configuration is valid
        res.status(200).json({ 
            success: true,
            message: 'Weather activity configuration saved successfully' 
        });
        
    } catch (error) {
        console.error('Error in save endpoint:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            success: false 
        });
    }
});

// Validate endpoint - called when the journey is validated
app.post('/validate', (req, res) => {
    console.log('Validate endpoint called:', JSON.stringify(req.body, null, 2));
    
    try {
        const config = req.body;
        const errors = [];
        
        // Check for valid configuration
        if (!config.arguments || !config.arguments.execute || !config.arguments.execute.inArguments) {
            errors.push('Missing activity configuration');
        } else {
            const inArgs = config.arguments.execute.inArguments[0] || {};
            
            if (!inArgs.locationField) {
                errors.push('Location field must be selected');
            }
            
            if (!inArgs.locationFieldType) {
                errors.push('Location field type must be specified');
            }
            
            // Validate location field type
            const validTypes = ['coordinates', 'zipcode', 'city', 'address'];
            if (inArgs.locationFieldType && !validTypes.includes(inArgs.locationFieldType)) {
                errors.push('Invalid location field type');
            }
        }
        
        // Check if weather API key is configured
        if (!process.env.WEATHER_API_KEY) {
            errors.push('Weather API key is not configured on the server');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({ 
                valid: false, 
                errors: errors 
            });
        }
        
        res.status(200).json({ 
            valid: true,
            message: 'Weather activity configuration is valid' 
        });
        
    } catch (error) {
        console.error('Error in validate endpoint:', error);
        res.status(500).json({ 
            valid: false, 
            errors: ['Internal server error during validation'] 
        });
    }
});

// Publish endpoint - called when the journey is published
app.post('/publish', (req, res) => {
    console.log('Publish endpoint called:', JSON.stringify(req.body, null, 2));
    
    try {
        const config = req.body;
        
        // Final validation before publishing
        if (!config.arguments || !config.arguments.execute || !config.arguments.execute.inArguments) {
            return res.status(400).json({ 
                error: 'Cannot publish: Invalid activity configuration',
                success: false 
            });
        }
        
        const inArgs = config.arguments.execute.inArguments[0] || {};
        
        if (!inArgs.locationField || !inArgs.locationFieldType) {
            return res.status(400).json({ 
                error: 'Cannot publish: Location field and type must be configured',
                success: false 
            });
        }
        
        // Check environment configuration
        if (!process.env.WEATHER_API_KEY || !process.env.JWT_SIGNING_SECRET) {
            return res.status(500).json({ 
                error: 'Cannot publish: Server environment not properly configured',
                success: false 
            });
        }
        
        res.status(200).json({ 
            success: true,
            message: 'Weather activity published successfully' 
        });
        
    } catch (error) {
        console.error('Error in publish endpoint:', error);
        res.status(500).json({ 
            error: 'Internal server error during publish',
            success: false 
        });
    }
});

// Stop endpoint - called when the journey is stopped
app.post('/stop', (req, res) => {
    console.log('Stop endpoint called:', JSON.stringify(req.body, null, 2));
    
    res.status(200).json({ 
        success: true,
        message: 'Weather activity stopped successfully' 
    });
});

// Start the server if not in serverless environment
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🌦️  Weather Journey Builder Activity server running on port ${PORT}`);
        console.log(`📝 Config: http://localhost:${PORT}/config.json`);
        console.log(`🔧 UI: http://localhost:${PORT}/edit.html`);
        console.log(`🌍 Homepage: http://localhost:${PORT}/`);
    });
}

// This line allows Vercel to handle the server
module.exports = app;