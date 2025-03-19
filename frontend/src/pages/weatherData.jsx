import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { auth } from "../configuration/firebase";
import ProfileIcon from "../assets/profileIcon";

function WeatherData() {
  const [weatherData, setWeatherData] = useState(null);
  const [weatherForecastData, setWeatherForecastData] = useState(null);
  const [windDir, setWindDir] = useState(null);
  const navigate = useNavigate();
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const [uidToken, setUidToken] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          let idToken = await user.getIdToken();
          const decodedToken = JSON.parse(atob(idToken.split(".")[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const expirationTime = decodedToken.exp;

          if (expirationTime - currentTime < 300) {
            idToken = await user.getIdToken(true);
          }

          setUidToken(idToken);

          try {
            await axios.get(
              `${import.meta.env.VITE_SERVER_URL}/api/verifyToken`,
              {
                headers: {
                  Authorization: "Bearer " + idToken,
                },
              }
            );
          } catch (verifyError) {
            if (verifyError.response && verifyError.response.status === 401) {
              try {
                const refreshedToken = await user.getIdToken(true);
                setUidToken(refreshedToken);
                await axios.get(
                  `${import.meta.env.VITE_SERVER_URL}/api/verifyToken`,
                  {
                    headers: {
                      Authorization: "Bearer " + refreshedToken,
                    },
                  }
                );
              } catch (refreshError) {
                console.error("Token refresh failed:", refreshError);
                navigate("/signin");
              }
            } else {
              console.error("Token verification error:", verifyError);
              navigate("/signin");
            }
          }
        } catch (getTokenError) {
          console.error("Error getting ID token:", getTokenError);
          navigate("/signin");
        }
      } else {
        setUidToken(null);
        navigate("/signin");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!uidToken) return;

      if ("permissions" in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({
            name: "geolocation",
          });

          if (permissionStatus.state === "granted") {
            try {
              const storedWeatherData = Cookies.get("weather_data");
              const storedWeatherForecastData = Cookies.get("weather_forecast");

              if (storedWeatherData && storedWeatherForecastData) {
                const storedWeatherDataParsed = JSON.parse(storedWeatherData);
                const storedWeatherForecastDataParsed = JSON.parse(
                  storedWeatherForecastData
                );
                setWeatherData(storedWeatherDataParsed);
                setWeatherForecastData(storedWeatherForecastDataParsed);
                setWindDir(
                  getWindDirection(storedWeatherDataParsed.current.wind_degree)
                );
              } else {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const { latitude, longitude } = position.coords;

                      try {
                        axios.defaults.withCredentials = true;
                        await axios.post(
                          `${import.meta.env.VITE_SERVER_URL}/api/weatherData`,
                          { latitude, longitude },
                          {
                            headers: { Authorization: `Bearer ${uidToken}` },
                          }
                        );

                        const newWeatherData = Cookies.get("weather_data");
                        const newWeatherForecastData =
                          Cookies.get("weather_forecast");
                        if (newWeatherData && newWeatherForecastData) {
                          const parsedData = JSON.parse(newWeatherData);
                          const parsedForecastData = JSON.parse(
                            newWeatherForecastData
                          );
                          setWeatherData(parsedData);
                          setWeatherForecastData(parsedForecastData);
                          setWindDir(
                            getWindDirection(parsedData.current.wind_degree)
                          );
                        } else {
                          console.error(
                            "No weather data found in cookies after fetch."
                          );
                        }
                      } catch (error) {
                        console.error("Error fetching weather data.");
                      }
                    },
                    () => {
                      alert(
                        "Unable to retrieve location. Please allow location access."
                      );
                    },
                    {
                      enableHighAccuracy: false,
                      maximumAge: 600000,
                    }
                  );
                } else {
                  console.log("Geolocation is not supported by this device.");
                }
              }
            } catch (error) {
              console.error("Error parsing weather data from cookies.");
            }
          } else if (permissionStatus.state === "denied") {
            navigate("/");
            return;
          } else {
            navigate("/");
            return;
          }
        } catch (error) {
          navigate("/");
          return;
        }
      }
    };

    fetchWeatherData();
  }, [uidToken]);

  const getWindDirection = (degrees) => {
    const directions = [
      "North",
      "North-Northeast",
      "Northeast",
      "East-Northeast",
      "East",
      "East-Southeast",
      "Southeast",
      "South-Southeast",
      "South",
      "South-Southwest",
      "Southwest",
      "West-Southwest",
      "West",
      "West-Northwest",
      "Northwest",
      "North-Northwest",
      "North",
    ];

    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">{import.meta.env.VITE_APP_NAME}</h1>
            <Link className="page-profile" to="/profile">
              <ProfileIcon />
            </Link>
          </div>

          <div className="page-body">
            <div className="page-list">
              {weatherData &&
                weatherData.current &&
                weatherData.current.condition &&
                weatherData.location &&
                weatherData.location.name && (
                  <div className="page-weather-data">
                    <img
                      src={weatherData.current.condition.icon}
                      alt={weatherData.current.condition.text}
                    />
                    <h1>{weatherData.current.temp_c}°C</h1>
                    <p>Feels like: {weatherData.current.feelslike_c}°C</p>
                    <h2>{weatherData.location.name}</h2>
                    <p>
                      {weatherData.location.region},{" "}
                      {weatherData.location.country}
                    </p>
                    <hr />
                    <h2>Current Data</h2>
                    <p>Humidity: {weatherData.current.humidity}%</p>
                    <p>Precipitation: {weatherData.current.precip_mm}%</p>
                    <p>Wind Speed: {weatherData.current.wind_kph} km/h</p>
                    <p>Wind Degree: {weatherData.current.wind_degree}°</p>
                    <p>Wind Direction: {windDir}</p>
                    <hr />
                    <h2>Air Quality Data</h2>
                    <p>CO: {weatherData.current.air_quality.co} μg/m3</p>
                    <p>NO2: {weatherData.current.air_quality.no2} μg/m3</p>
                    <p>O3: {weatherData.current.air_quality.o3} μg/m3</p>
                    <p>SO2: {weatherData.current.air_quality.so2} μg/m3</p>
                    <hr />

                    {weatherForecastData && weatherForecastData.forecast && (
                      <>
                        <h2>Weather Forecast</h2>
                        <div className="page-forecast-list">
                          <div className="page-forecast-group">
                            {weatherForecastData.forecast.map((day, index) => (
                              <div key={index} className="page-forecast-card">
                                <img src={day.icon} alt={day.condition} />
                                <p>{daysOfWeek[new Date(day.date).getDay()]}</p>
                                <h2>{day.condition}</h2>
                                <p>Max Temp: {day.maxtemp_c}°C</p>
                                <p>Min Temp: {day.mintemp_c}°C</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <p>
                      Powered by{" "}
                      <a
                        href="https://www.weatherapi.com/"
                        title="Free Weather API"
                      >
                        WeatherAPI.com
                      </a>
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default WeatherData;
