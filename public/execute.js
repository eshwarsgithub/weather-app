import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const inArgs = req.body.inArguments?.[0];
    const city = inArgs?.city;
    const state = inArgs?.state;
    const postalCode = inArgs?.postalCode;
    const country = inArgs?.country;

    // Try different location formats
    let weatherUrl = "";
    const apiKey = process.env.OPENWEATHER_KEY;

    if (city && state) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},${state},${country || 'US'}&appid=${apiKey}`;
    } else if (postalCode) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?zip=${postalCode},${country || 'US'}&appid=${apiKey}`;
    } else if (city) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    } else {
      return res.status(400).json({ error: "Missing location data (city, state, or postal code required)" });
    }

    const response = await fetch(weatherUrl);
    const data = await response.json();

    if (data.cod !== 200) {
      console.log("Weather API error:", data);
      return res.status(400).json({ error: "Location not found" });
    }

    const hasAdverseWeather = data.weather.some(w => 
      ["rain", "thunderstorm", "snow", "drizzle"].includes(w.main.toLowerCase())
    );

    return res.json({
      branchResult: hasAdverseWeather ? "Adverse Weather" : "Good Weather"
    });
  } catch (e) {
    console.error("Execute error", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
