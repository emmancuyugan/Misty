const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).send({ error: 'City is required' });
  }

  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric`);
    res.send(response.data);
  } catch (error) {
    res.status(500).send({ error: 'Unable to fetch weather data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});