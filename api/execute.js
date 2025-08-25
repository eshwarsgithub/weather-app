// Node 18+ has native fetch support

export default async function handler(req, res) {
  console.log('Weather Execute API called');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const inArgs = req.body.inArguments?.[0];
    if (!inArgs) {
      console.error('No inArguments found');
      return res.status(400).json({ error: "No input arguments provided" });
    }

    const contactKey = inArgs.contactKey;
    const emailAddress = inArgs.emailAddress;
    const city = inArgs.city;
    const state = inArgs.state;
    const postalCode = inArgs.postalCode;
    const country = inArgs.country;
    const latitude = inArgs.latitude;
    const longitude = inArgs.longitude;

    console.log('Extracted data:', {
      contactKey, emailAddress, city, state, postalCode, country, latitude, longitude
    });

    // Build weather API URL based on available data
    let weatherUrl = "";
    const apiKey = process.env.OPENWEATHER_KEY;

    if (!apiKey) {
      console.error('OPENWEATHER_KEY environment variable not set');
      return res.status(500).json({ error: "Weather API key not configured" });
    }

    // Priority: 1. lat/long, 2. city+state, 3. postal code, 4. city only
    if (latitude && longitude) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
      console.log('Using coordinates for weather lookup');
    } else if (city && state) {
      const location = `${city},${state},${country || 'US'}`;
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`;
      console.log('Using city+state for weather lookup:', location);
    } else if (postalCode) {
      const zipLocation = `${postalCode},${country || 'US'}`;
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${encodeURIComponent(zipLocation)}&appid=${apiKey}&units=metric`;
      console.log('Using postal code for weather lookup:', zipLocation);
    } else if (city) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
      console.log('Using city only for weather lookup:', city);
    } else {
      console.error('No valid location data found');
      return res.status(400).json({ 
        error: "Missing location data - need city, postal code, or coordinates",
        received: { city, state, postalCode, country, latitude, longitude }
      });
    }

    console.log('Weather API URL:', weatherUrl);

    // Call OpenWeatherMap API
    const response = await fetch(weatherUrl);
    const data = await response.json();

    console.log('Weather API response:', JSON.stringify(data, null, 2));

    if (data.cod !== 200) {
      console.error('Weather API error:', data);
      return res.status(400).json({ 
        error: `Weather API error: ${data.message || 'Location not found'}`,
        weatherApiResponse: data
      });
    }

    // Extract weather information
    const mainCondition = data.weather[0]?.main?.toLowerCase() || '';
    const description = data.weather[0]?.description || '';
    const temperature = Math.round(data.main?.temp || 0);
    const humidity = data.main?.humidity || 0;

    // Determine if weather is adverse
    const adverseConditions = ['rain', 'thunderstorm', 'snow', 'drizzle', 'storm'];
    const hasAdverseWeather = adverseConditions.some(condition => 
      mainCondition.includes(condition)
    );

    // Determine branch result
    const branchResult = hasAdverseWeather ? "Adverse Weather" : "Good Weather";

    console.log('Weather analysis:', {
      mainCondition, 
      description, 
      temperature, 
      humidity, 
      hasAdverseWeather, 
      branchResult
    });

    // Return response in Journey Builder format
    const responseData = {
      // Branch result for Journey Builder routing
      branchResult: branchResult,
      
      // Output arguments for subsequent activities
      weatherCondition: mainCondition,
      temperature: temperature,
      humidity: humidity,
      description: description,
      
      // Additional debug info
      contactKey: contactKey,
      emailAddress: emailAddress,
      locationUsed: {
        city, state, postalCode, country, latitude, longitude
      },
      weatherApiResponse: {
        location: data.name,
        country: data.sys?.country,
        condition: mainCondition,
        temp: temperature,
        humidity: humidity
      }
    };

    console.log('Sending response:', JSON.stringify(responseData, null, 2));

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Execute error:', error);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}