import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const inArgs = req.body.inArguments?.[0];
    const lat = inArgs?.latitude;
    const lon = inArgs?.longitude;

    if (!lat || !lon) {
      return res.status(400).json({ error: "Missing latitude or longitude" });
    }

    // 🌦 Call OpenWeather API (replace with your API key)
    const apiKey = process.env.OPENWEATHER_KEY;
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    const data = await response.json();

    const raining = data.weather.some(w => w.main.toLowerCase().includes("rain"));

    return res.json({
      branchResult: raining ? "raining_branch" : "not_raining_branch"
    });
  } catch (e) {
    console.error("Execute error", e);
    res.status(500).json({ error: "Internal server error" });
  }
}
