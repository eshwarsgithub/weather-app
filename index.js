const express = require('express');
const app = express();

// This defines what to show when someone visits your main URL
app.get('/', (req, res) => {
  res.status(200).send('Hello from the SFMC Weather App!');
});

// This is the code that Journey Builder will call later
// We will add the logic for it after this setup is working
app.post('/execute', (req, res) => {
  res.status(200).json({ success: true });
});

// This line allows Vercel to handle the server
module.exports = app;