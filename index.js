const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();

// CORS middleware for cross-origin requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-jwt-assertion');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Serve static files from the 'public' directory
// This line serves your CSS, JS, and other assets for the UI
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- NEW ---
// This route explicitly serves your index.html file for the homepage.
// This is a robust way to fix the 404 error.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route for edit.html (SFMC configuration UI)
app.get('/edit.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'edit.html'));
});

// Explicit route for config.json (required for SFMC)
app.get('/config.json', (req, res) => {
    try {
        const configPath = path.join(__dirname, 'public', 'config.json');
        const fs = require('fs');
        
        if (fs.existsSync(configPath)) {
            const configData = fs.readFileSync(configPath, 'utf8');
            res.setHeader('Content-Type', 'application/json');
            res.send(configData);
        } else {
            // Fallback: serve the config directly
            const config = {
                "workflowApiVersion": "1.1",
                "metaData": {
                    "icon": "https://weather-app-kappa-three-25.vercel.app/images/weather-icon.png",
                    "iconSmall": "https://weather-app-kappa-three-25.vercel.app/images/weather-icon-small.png",
                    "category": "messaging",
                    "isConfigured": false
                },
                "type": "RESTDECISION",
                "lang": {
                    "en-US": {
                        "name": "Weather-Based Decision Split",
                        "description": "Routes journey participants based on current weather conditions at their location"
                    }
                },
                "arguments": {
                    "execute": {
                        "inArguments": [
                            {
                                "contactKey": "{{Contact.Key}}",
                                "locationField": "",
                                "locationFieldType": "coordinates",
                                "weatherConditions": "rain,snow,storm"
                            }
                        ],
                        "outArguments": [
                            {
                                "weatherCondition": {
                                    "dataType": "Text",
                                    "isNullable": false,
                                    "direction": "out"
                                },
                                "temperature": {
                                    "dataType": "Number",
                                    "isNullable": true,
                                    "direction": "out"
                                },
                                "humidity": {
                                    "dataType": "Number", 
                                    "isNullable": true,
                                    "direction": "out"
                                },
                                "description": {
                                    "dataType": "Text",
                                    "isNullable": true,
                                    "direction": "out"
                                }
                            }
                        ],
                        "url": "https://weather-app-kappa-three-25.vercel.app/execute",
                        "verb": "POST",
                        "body": "",
                        "header": "",
                        "format": "json",
                        "useJwt": true,
                        "timeout": 30000,
                        "retryCount": 3,
                        "retryDelay": 2000,
                        "concurrentRequests": 5
                    }
                },
                "configurationArguments": {
                    "applicationExtensionKey": "d6b98705-3047-4869-8419-89691fdaec3a",
                    "save": {
                        "url": "https://weather-app-kappa-three-25.vercel.app/save",
                        "verb": "POST",
                        "body": "",
                        "format": "json",
                        "useJwt": false
                    },
                    "publish": {
                        "url": "https://weather-app-kappa-three-25.vercel.app/publish",
                        "verb": "POST",
                        "body": "",
                        "format": "json",
                        "useJwt": false
                    },
                    "validate": {
                        "url": "https://weather-app-kappa-three-25.vercel.app/validate",
                        "verb": "POST",
                        "body": "",
                        "format": "json",
                        "useJwt": false
                    },
                    "stop": {
                        "url": "https://weather-app-kappa-three-25.vercel.app/stop",
                        "verb": "POST",
                        "body": "",
                        "format": "json",
                        "useJwt": false
                    }
                },
                "edit": {
                    "url": "https://weather-app-kappa-three-25.vercel.app/edit.html",
                    "height": 600,
                    "width": 800
                },
                "outcomes": [
                    {
                        "arguments": { 
                            "branchResult": "Adverse Weather" 
                        },
                        "metaData": { 
                            "label": "Adverse Weather",
                            "description": "Contact is experiencing rain, snow, storms, or other configured adverse weather conditions"
                        }
                    },
                    {
                        "arguments": { 
                            "branchResult": "Good Weather" 
                        },
                        "metaData": { 
                            "label": "Good Weather",
                            "description": "Contact has clear or mild weather conditions"
                        }
                    }
                ],
                "wizardSteps": [
                    {
                        "key": "configuration",
                        "label": "Weather Configuration",
                        "active": true
                    }
                ],
                "schema": {
                    "arguments": {
                        "execute": {
                            "inArguments": [
                                {
                                    "contactKey": {
                                        "dataType": "Text",
                                        "isNullable": false,
                                        "direction": "in"
                                    },
                                    "locationField": {
                                        "dataType": "Text",
                                        "isNullable": false,
                                        "direction": "in"
                                    },
                                    "locationFieldType": {
                                        "dataType": "Text",
                                        "isNullable": false,
                                        "direction": "in"
                                    },
                                    "weatherConditions": {
                                        "dataType": "Text",
                                        "isNullable": true,
                                        "direction": "in"
                                    }
                                }
                            ],
                            "outArguments": [
                                {
                                    "weatherCondition": {
                                        "dataType": "Text",
                                        "isNullable": false,
                                        "direction": "out"
                                    },
                                    "temperature": {
                                        "dataType": "Number",
                                        "isNullable": true,
                                        "direction": "out"
                                    },
                                    "humidity": {
                                        "dataType": "Number",
                                        "isNullable": true,
                                        "direction": "out"
                                    },
                                    "description": {
                                        "dataType": "Text",
                                        "isNullable": true,
                                        "direction": "out"
                                    }
                                }
                            ]
                        }
                    }
                }
            };
            res.json(config);
        }
    } catch (error) {
        console.error('Config.json error:', error);
        res.status(500).json({ error: 'Unable to load configuration' });
    }
});

// Main endpoint for Journey Builder - Enhanced with comprehensive logging
app.post('/execute', async (req, res) => {
    const startTime = new Date();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    console.log(`\n🌦️ [${requestId}] Weather Activity Execute Started at ${startTime.toISOString()}`);
    console.log(`📨 [${requestId}] Request Headers:`, {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'x-jwt-assertion': req.headers['x-jwt-assertion'] ? 'Present' : 'Missing'
    });
    console.log(`📝 [${requestId}] Request Body:`, JSON.stringify(req.body, null, 2));
    
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
    
    // JWT disabled for testing - remove this comment to re-enable JWT
    if (!token && false) {
        console.error('Missing JWT token');
        return res.status(401).json({ 
            error: 'Unauthorized: Missing token.',
            branchResult: 'Good Weather' 
        });
    }

    try {
        let decoded = {};
        let inArguments = {};
        
        if (token) {
            decoded = jwt.verify(token, jwtSigningSecret);
            console.log('JWT decoded successfully:', JSON.stringify(decoded, null, 2));
            inArguments = decoded.inArguments && decoded.inArguments[0] || {};
        } else {
            console.log('No JWT token, using request body directly');
            inArguments = req.body.inArguments && req.body.inArguments[0] || {};
        }
        
        console.log('inArguments:', JSON.stringify(inArguments, null, 2));
        
        // Extract data extension fields
        const contactKey = inArguments.contactKey;
        const emailAddress = inArguments.emailAddress;
        const city = inArguments.city;
        const state = inArguments.state;
        const postalCode = inArguments.postalCode;
        const country = inArguments.country || 'US';
        const latitude = inArguments.latitude;
        const longitude = inArguments.longitude;
        const weatherConditions = inArguments.weatherConditions || 'rain,thunderstorm,snow,drizzle';

        console.log('Extracted data extension fields:', {
            contactKey, emailAddress, city, state, postalCode, country, latitude, longitude
        });

        // Build weather API URL based on available data
        let weatherUrl = "";
        let locationDescription = "";

        // Priority: 1. lat/long, 2. city+state, 3. postal code, 4. city only
        if (latitude && longitude) {
            weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weatherApiKey}&units=metric`;
            locationDescription = `coordinates ${latitude},${longitude}`;
        } else if (city && state) {
            const location = `${city},${state},${country}`;
            weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${weatherApiKey}&units=metric`;
            locationDescription = `city+state: ${location}`;
        } else if (postalCode) {
            const zipLocation = `${postalCode},${country}`;
            weatherUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${encodeURIComponent(zipLocation)}&appid=${weatherApiKey}&units=metric`;
            locationDescription = `postal code: ${zipLocation}`;
        } else if (city) {
            weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherApiKey}&units=metric`;
            locationDescription = `city: ${city}`;
        } else {
            console.error('No valid location data found');
            return res.status(400).json({ 
                error: "Missing location data - need city, postal code, or coordinates",
                branchResult: 'Good Weather',
                received: { city, state, postalCode, country, latitude, longitude }
            });
        }

        console.log(`Getting weather for ${locationDescription}`);
        console.log('Weather API URL:', weatherUrl);
        
        // Get weather data
        
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
        
        const processingTime = new Date() - startTime;
        console.log(`🎯 [${requestId}] Weather Analysis: ${currentWeather} -> ${outcome}`);
        console.log(`🌡️ [${requestId}] Weather Details:`, {
            condition: currentWeather,
            description: description,
            temperature: `${temperature}°C`,
            humidity: `${humidity}%`,
            location: `${lat}, ${lon}`
        });
        console.log(`✅ [${requestId}] Request completed in ${processingTime}ms`);
        
        const result = {
            branchResult: outcome,
            weatherCondition: currentWeather,
            temperature: temperature,
            humidity: humidity,
            description: description,
            coordinates: { lat, lon },
            contactKey: contactKey,
            requestId: requestId,
            processingTime: processingTime,
            timestamp: startTime.toISOString()
        };
        
        console.log(`📤 [${requestId}] Response:`, JSON.stringify(result, null, 2));
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

// Health check endpoint for status verification
app.get('/health', (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: {
            weatherApiConfigured: !!process.env.WEATHER_API_KEY,
            jwtSecretConfigured: !!process.env.JWT_SIGNING_SECRET
        },
        endpoints: {
            config: '/config.json',
            execute: '/execute',
            save: '/save',
            publish: '/publish',
            validate: '/validate',
            stop: '/stop'
        }
    };
    
    res.status(200).json(health);
});

// Test endpoint for validating weather activity functionality
app.post('/test', async (req, res) => {
    console.log('\n🧪 TEST ENDPOINT CALLED');
    console.log('Test request:', JSON.stringify(req.body, null, 2));
    
    try {
        const { testType, ...testData } = req.body;
        
        switch (testType) {
            case 'weather':
                return await testWeatherAPI(req, res, testData);
            case 'execute':
                return await testExecuteEndpoint(req, res, testData);
            case 'geocoding':
                return await testGeocodingAPI(req, res, testData);
            default:
                return res.json({
                    status: 'success',
                    message: 'Weather Activity Test Endpoint',
                    availableTests: [
                        'weather - Test weather API with coordinates',
                        'execute - Test full execute flow with mock data', 
                        'geocoding - Test location geocoding'
                    ],
                    examples: {
                        weather: {
                            testType: 'weather',
                            lat: 40.7128,
                            lon: -74.0060
                        },
                        execute: {
                            testType: 'execute',
                            contactKey: 'test-contact-123',
                            locationField: 'New York',
                            locationFieldType: 'city',
                            weatherConditions: 'rain,snow'
                        },
                        geocoding: {
                            testType: 'geocoding',
                            location: 'New York',
                            type: 'city'
                        }
                    }
                });
        }
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test weather API functionality
async function testWeatherAPI(req, res, { lat = 40.7128, lon = -74.0060 }) {
    const weatherApiKey = process.env.WEATHER_API_KEY;
    
    if (!weatherApiKey) {
        return res.status(500).json({ error: 'Weather API key not configured' });
    }
    
    try {
        console.log(`🧪 Testing weather API for coordinates: ${lat}, ${lon}`);
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;
        const response = await axios.get(weatherUrl);
        
        return res.json({
            status: 'success',
            test: 'Weather API',
            coordinates: { lat, lon },
            weather: {
                condition: response.data.weather[0].main,
                description: response.data.weather[0].description,
                temperature: `${Math.round(response.data.main.temp)}°C`,
                humidity: `${response.data.main.humidity}%`
            },
            rawResponse: response.data
        });
    } catch (error) {
        console.error('Weather API test failed:', error);
        return res.status(500).json({
            status: 'error',
            test: 'Weather API',
            error: error.message
        });
    }
}

// Test geocoding functionality
async function testGeocodingAPI(req, res, { location = 'New York', type = 'city' }) {
    const weatherApiKey = process.env.WEATHER_API_KEY;
    
    if (!weatherApiKey) {
        return res.status(500).json({ error: 'Weather API key not configured' });
    }
    
    try {
        console.log(`🧪 Testing geocoding for: ${location} (${type})`);
        const geoResult = await geocodeLocation(location, type, weatherApiKey);
        
        return res.json({
            status: 'success',
            test: 'Geocoding API',
            input: { location, type },
            result: geoResult
        });
    } catch (error) {
        console.error('Geocoding test failed:', error);
        return res.status(500).json({
            status: 'error',
            test: 'Geocoding API',
            error: error.message
        });
    }
}

// Test execute endpoint with mock data
async function testExecuteEndpoint(req, res, testData) {
    const mockRequest = {
        inArguments: [{
            contactKey: testData.contactKey || 'test-contact-123',
            locationField: testData.locationField || 'New York',
            locationFieldType: testData.locationFieldType || 'city',
            weatherConditions: testData.weatherConditions || 'rain,snow'
        }]
    };
    
    console.log('🧪 Testing execute endpoint with mock data:', mockRequest);
    
    return res.json({
        status: 'test_info',
        test: 'Execute Endpoint',
        mockRequest: mockRequest,
        message: 'To fully test execute endpoint, use SFMC Journey Builder or make a direct POST to /execute',
        instructions: 'Monitor server logs for detailed execution results when the activity runs in SFMC'
    });
}

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler for unmatched routes
app.use((req, res) => {
    console.log(`404 - Route not found: ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`,
        availableEndpoints: [
            'GET /',
            'GET /config.json',
            'GET /edit.html',
            'POST /execute',
            'POST /save',
            'POST /publish',
            'POST /validate',
            'POST /stop'
        ]
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
        console.log(`🔐 Environment check: ${process.env.WEATHER_API_KEY ? 'Weather API configured' : 'Weather API missing'}`);
        console.log(`🔑 JWT Secret check: ${process.env.JWT_SIGNING_SECRET ? 'JWT configured' : 'JWT secret missing'}`);
    });
}

// This line allows Vercel to handle the server
module.exports = app;