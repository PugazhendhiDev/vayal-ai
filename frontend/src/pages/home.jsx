import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { auth } from "../configuration/firebase";
import WeatherPermissionIcon from "../assets/weather-permission-icon.svg";
import ProfileIcon from "../assets/profileIcon";
import ChatbotIcon from "../assets/chatbotIcon";
import FarmIcon from "../assets/farmIcon";
import NewsIcon from "../assets/newsIcon";
import ShopIcon from "../assets/shopIcon";

function Home() {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState(null);
  const [locationPermission, setLocationPermission] = useState(false);

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
            setLocationPermission(true);
          } else if (permissionStatus.state === "denied") {
            setLocationPermission(false);
            return;
          } else {
            setLocationPermission(false);
            return;
          }
        } catch (error) {
          console.error("Error checking geolocation permission");
          return;
        }
      }

      if (Cookies.get("weather_data")) {
        setWeatherData(JSON.parse(Cookies.get("weather_data")));
      } else {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;

              try {
                axios.defaults.withCredentials = true;
                await axios.post(
                  `${import.meta.env.VITE_SERVER_URL}/api/weatherData`,
                  {
                    latitude,
                    longitude,
                  },
                  {
                    headers: {
                      Authorization: "Bearer " + uidToken,
                    },
                  }
                );

                setWeatherData(JSON.parse(Cookies.get("weather_data")));
              } catch (error) {
                console.error("Error fetching weather data:", error);
              }
            },
            () => {
              console.log(
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
    };

    fetchWeatherData();
  }, [uidToken, locationPermission]);

  const requestLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermission(true);
        },
        (error) => {
          setLocationPermission(false);
        }
      );
    }
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
              {!locationPermission ? (
                <div
                  className="page-weather"
                  onClick={requestLocationPermission}
                >
                  <img src={WeatherPermissionIcon} />
                  <p>
                    Get
                    <br />
                    Location
                  </p>
                </div>
              ) : (
                <>
                  {weatherData &&
                    weatherData.current &&
                    weatherData.current.condition &&
                    weatherData.location &&
                    weatherData.location.name && (
                      <Link className="page-list-items" to={"/weatherData"}>
                        <img
                          src={weatherData.current.condition.icon}
                          alt={weatherData.current.condition.text}
                        />
                        <p>
                          {weatherData.location.name}
                          <br />
                          {weatherData.current.temp_c}°C
                        </p>
                      </Link>
                    )}
                </>
              )}
              <Link className="page-list-items" to={"/chatBot"}>
                <ChatbotIcon />
                <p>
                  Ask
                  <br />
                  Agri AI
                </p>
              </Link>
              <Link className="page-list-items" to={"/agriDataHome"}>
                <FarmIcon />
                <p>
                  My
                  <br />
                  Farm
                </p>
              </Link>
              <Link className="page-list-items" to={"/shopData"}>
                <ShopIcon />
                <p>
                  Find
                  <br />
                  Shops
                </p>
              </Link>
              <Link className="page-list-items" to={"/news"}>
                <NewsIcon />
                <p>
                  Agri
                  <br />
                  News
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Home;
