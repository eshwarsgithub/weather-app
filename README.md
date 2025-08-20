# SFMC Weather-Based Journey Builder Activity

A professional-grade custom activity for Salesforce Marketing Cloud Journey Builder that routes contacts based on real-time weather conditions at their location.

## 🌟 Features

- **Dynamic Field Selection**: Choose any field from your Journey entry data as the location source
- **Multiple Location Types**: Supports coordinates, ZIP codes, city names, and full addresses
- **Smart Geocoding**: Automatically converts location data to coordinates using OpenWeatherMap API
- **Real-time Weather Data**: Fetches current weather conditions for accurate routing decisions
- **Configurable Weather Conditions**: Set custom weather criteria for journey branching
- **Rich Data Output**: Returns weather data as journey variables for use in subsequent activities
- **Professional UI**: Lightning Design System-styled configuration interface
- **Robust Error Handling**: Comprehensive validation and error management
- **SFMC 2025 Compliant**: Built according to latest Salesforce Marketing Cloud standards

## 🚀 Quick Start

### 1. Prerequisites

- Salesforce Marketing Cloud account with Journey Builder
- OpenWeatherMap API key (free at [openweathermap.org](https://openweathermap.org/api))
- Hosting platform with HTTPS support (Vercel, Heroku, AWS, etc.)

### 2. Deployment

1. **Clone or download this repository**
2. **Deploy to your hosting platform**
3. **Set environment variables:**
   ```
   WEATHER_API_KEY=your_openweather_api_key
   JWT_SIGNING_SECRET=your_secure_jwt_secret
   ```

### 3. SFMC Installation

1. **Update URLs in config.json:**
   - Replace `https://your-vercel-app-url.vercel.app` with your deployed application URL

2. **Create an Installed Package in SFMC:**
   - Go to Setup → Apps → Installed Packages
   - Create New Package
   - Add Component → Journey Builder Activity
   - Set Endpoint URL to: `https://your-app-url.com/config.json`

3. **Configure the Activity:**
   - The activity will appear in Journey Builder under "Custom Activities"
   - Drag into your journey and configure location field and weather conditions

## 📋 How It Works

### Data Flow

1. **Journey Entry**: Contact enters the journey with location data in any supported format
2. **Field Selection**: The activity reads the configured location field from the contact record
3. **Geocoding**: If needed, converts location data to coordinates using OpenWeatherMap's geocoding API
4. **Weather Check**: Fetches current weather data for the coordinates
5. **Decision Logic**: Compares weather conditions against configured criteria
6. **Journey Routing**: Routes contact down "Adverse Weather" or "Good Weather" path
7. **Data Output**: Saves weather details as journey variables for subsequent use

### Supported Location Data Types

| Type | Format | Examples |
|------|--------|----------|
| Coordinates | "lat,lng" | "40.7128,-74.0060" |
| ZIP Code | "12345" or "12345-6789" | "10001", "90210" |
| City Name | "City, State" or "City, Country" | "New York, NY", "London, UK" |
| Address | Full street address | "123 Main St, New York, NY" |

### Weather Conditions

The activity can check for these weather conditions:

- **Rain**: Rain, Drizzle
- **Snow**: Snow, Sleet
- **Storm**: Thunderstorm, Severe Weather
- **Clear**: Clear skies
- **Clouds**: Cloudy, Overcast
- **Custom**: Any OpenWeatherMap weather condition

## 🔧 Configuration

### Activity Configuration

In Journey Builder, configure these settings:

1. **Location Data Field**: Select the field containing location information
2. **Location Data Type**: Specify the format of your location data
3. **Weather Conditions**: Choose which conditions trigger "Adverse Weather" path

### Output Variables

The activity returns these variables for use in subsequent activities:

- `weatherCondition`: Main weather condition (e.g., "Rain", "Clear")
- `temperature`: Temperature in Celsius
- `humidity`: Humidity percentage
- `description`: Detailed weather description

### Journey Paths

- **Adverse Weather**: Contact has matching adverse weather conditions
- **Good Weather**: Contact has clear or mild weather conditions

## 🛠️ Technical Details

### Architecture

```
Journey Builder → Custom Activity UI → Server Endpoints → Weather API
                     ↓
                 Configuration
                     ↓
                 Execution Logic
                     ↓
                Journey Routing
```

### Server Endpoints

| Endpoint | Method | Purpose |
|----------|---------|---------|
| `/config.json` | GET | Activity configuration |
| `/edit.html` | GET | Configuration UI |
| `/execute` | POST | Execute weather check |
| `/save` | POST | Save configuration |
| `/validate` | POST | Validate settings |
| `/publish` | POST | Publish journey |
| `/stop` | POST | Stop journey |

### Security

- JWT token validation for all execution requests
- Environment variable protection for API keys
- Input validation and sanitization
- Error handling with fallback routing

## 🧪 Testing

### Local Testing

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Test endpoints:**
   ```bash
   # Check configuration
   curl https://your-app-url.com/config.json
   
   # Test execution (requires valid JWT)
   curl -X POST https://your-app-url.com/execute \
     -H "Content-Type: application/json" \
     -H "x-jwt-assertion: your-jwt-token" \
     -d '{"inArguments":[{"locationField":"New York, NY","locationFieldType":"city"}]}'
   ```

### SFMC Testing

1. Create a test journey with your custom activity
2. Use a test contact with valid location data
3. Verify the contact routes correctly based on weather conditions
4. Check output variables in subsequent activities

## 🔍 Troubleshooting

### Common Issues

**Activity doesn't appear in Journey Builder:**
- Check that config.json is accessible at the correct URL
- Verify the Installed Package is properly configured
- Ensure all URLs in config.json match your deployment

**Configuration UI doesn't load:**
- Check that edit.html is accessible
- Verify HTTPS is enabled on your hosting platform
- Check browser console for JavaScript errors

**Weather check fails:**
- Verify WEATHER_API_KEY environment variable is set
- Check that location data is in the expected format
- Review server logs for geocoding errors

**Journey validation errors:**
- Ensure location field and type are configured
- Check that environment variables are properly set
- Verify all required endpoints are responding

### Debugging

Enable debug logging by checking server logs during execution. All endpoints log request bodies and responses for troubleshooting.

## 📝 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `WEATHER_API_KEY` | Yes | OpenWeatherMap API key |
| `JWT_SIGNING_SECRET` | Yes | Secret for JWT token validation |
| `NODE_ENV` | No | Environment (development/production) |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For questions or issues:

1. Check this README and troubleshooting section
2. Review Salesforce Marketing Cloud documentation
3. Open an issue on the GitHub repository
4. Contact your Salesforce administrator

## 🔗 Resources

- [Salesforce Marketing Cloud Journey Builder Documentation](https://help.salesforce.com/s/articleView?id=sf.mc_jb_journey_builder.htm)
- [Custom Activities Development Guide](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/creating-activities.html)
- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [Lightning Design System](https://www.lightningdesignsystem.com/)

---

**Built with ❤️ for Salesforce Marketing Cloud**