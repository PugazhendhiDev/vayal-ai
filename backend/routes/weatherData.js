const express = require("express");
const router = express.Router();
const userLocation = require("../models/userLocation");

function weatherData() {
  router.post("/api/weatherData", async (req, res) => {
    const uid = req.uid;
    const { latitude, longitude } = req.body;

    try {
      const locationResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const locationData = await locationResponse.json();
      var district = locationData.address.state_district || "Unknown";

      const address = JSON.stringify(locationData.address);

      const existingLocation = await userLocation.findOne({ uid });

      if (!existingLocation) {
        await userLocation.create({ uid, location: address });

        const weatherResponse = await fetch(
          `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${district}&aqi=yes&alerts=yes&days=4`
        );
        const weatherDataReport = await weatherResponse.json();

        const filteredWeatherData = {
          location: weatherDataReport.location,
          current: weatherDataReport.current,
          alerts: weatherDataReport.alerts || { alert: [] },
        };

        const filteredForecastData = {
          forecast: weatherDataReport.forecast
            ? [
                {
                  date: weatherDataReport.forecast.forecastday[1].date,
                  condition:
                    weatherDataReport.forecast.forecastday[1].day.condition
                      .text,
                  code: weatherDataReport.forecast.forecastday[1].day.condition
                    .code,
                  icon: weatherDataReport.forecast.forecastday[1].day.condition
                    .icon,
                  maxtemp_c:
                    weatherDataReport.forecast.forecastday[1].day.maxtemp_c,
                  mintemp_c:
                    weatherDataReport.forecast.forecastday[1].day.mintemp_c,
                },
                {
                  date: weatherDataReport.forecast.forecastday[2].date,
                  condition:
                    weatherDataReport.forecast.forecastday[2].day.condition
                      .text,
                  code: weatherDataReport.forecast.forecastday[2].day.condition
                    .code,
                  icon: weatherDataReport.forecast.forecastday[2].day.condition
                    .icon,
                  maxtemp_c:
                    weatherDataReport.forecast.forecastday[2].day.maxtemp_c,
                  mintemp_c:
                    weatherDataReport.forecast.forecastday[2].day.mintemp_c,
                },
              ]
            : [],
        };

        res.cookie("weather_data", JSON.stringify(filteredWeatherData), {
          maxAge: 10 * 60 * 1000,
          httpOnly: false,
        });

        res.cookie("weather_forecast", JSON.stringify(filteredForecastData), {
          maxAge: 10 * 60 * 1000,
          httpOnly: false,
        });

        res.status(200).json({
          message: "Weather data fetched successfully.",
        });
      } else {
        await userLocation.updateOne({ uid }, { location: address });

        const weatherResponse = await fetch(
          `http://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${district}&aqi=yes&alerts=yes&days=4`
        );
        const weatherDataReport = await weatherResponse.json();

        const filteredWeatherData = {
          location: weatherDataReport.location,
          current: weatherDataReport.current,
          alerts: weatherDataReport.alerts || { alert: [] },
        };

        const filteredForecastData = {
          forecast: weatherDataReport.forecast
            ? [
                {
                  date: weatherDataReport.forecast.forecastday[1].date,
                  condition:
                    weatherDataReport.forecast.forecastday[1].day.condition
                      .text,
                  code: weatherDataReport.forecast.forecastday[1].day.condition
                    .code,
                  icon: weatherDataReport.forecast.forecastday[1].day.condition
                    .icon,
                  maxtemp_c:
                    weatherDataReport.forecast.forecastday[1].day.maxtemp_c,
                  mintemp_c:
                    weatherDataReport.forecast.forecastday[1].day.mintemp_c,
                },
                {
                  date: weatherDataReport.forecast.forecastday[2].date,
                  condition:
                    weatherDataReport.forecast.forecastday[2].day.condition
                      .text,
                  code: weatherDataReport.forecast.forecastday[2].day.condition
                    .code,
                  icon: weatherDataReport.forecast.forecastday[2].day.condition
                    .icon,
                  maxtemp_c:
                    weatherDataReport.forecast.forecastday[2].day.maxtemp_c,
                  mintemp_c:
                    weatherDataReport.forecast.forecastday[2].day.mintemp_c,
                },
              ]
            : [],
        };

        res.cookie("weather_data", JSON.stringify(filteredWeatherData), {
          maxAge: 10 * 60 * 1000,
          httpOnly: false,
        });

        res.cookie("weather_forecast", JSON.stringify(filteredForecastData), {
          maxAge: 10 * 60 * 1000,
          httpOnly: false,
        });

        res.status(200).json({
          message: "Weather data fetched successfully.",
        });
      }
    } catch {
      res.status(500).json({ error: "Error fetching weather data." });
    }
  });
  return router;
}

module.exports = weatherData;
