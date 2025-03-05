import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../configuration/firebase";
import Cookies from "js-cookie";
import ProfileIcon from "../assets/profileIcon";

function ShopData() {
  const navigate = useNavigate();

  const [uidToken, setUidToken] = useState(null);

  const [shopData, setShopData] = useState(null);

  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);

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
    const fetchShopData = async () => {
      if (!uidToken) return;

      if ("permissions" in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({
            name: "geolocation",
          });

          if (permissionStatus.state === "granted") {
            try {
              if (Cookies.get("shop_data_expire_time")) {
                const storedShopData = JSON.parse(
                  localStorage.getItem("shop_data")
                );
                setShopData(storedShopData);
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(async (position) => {
                    const { latitude, longitude } = position.coords;
                    setLat(latitude);
                    setLon(longitude);
                  });
                }
                return;
              } else {
                if ("geolocation" in navigator) {
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const { latitude, longitude } = position.coords;
                      setLat(latitude);
                      setLon(longitude);

                      try {
                        axios.defaults.withCredentials = true;
                        const res = await axios.post(
                          `${import.meta.env.VITE_SERVER_URL}/api/shopData`,
                          { latitude, longitude },
                          {
                            headers: { Authorization: `Bearer ${uidToken}` },
                          }
                        );

                        localStorage.setItem(
                          "shop_data",
                          JSON.stringify(res.data.data.elements)
                        );

                        Cookies.set("shop_data_expire_time", "Shop Data", {
                          expires: 10 / 1440,
                        });

                        setShopData([res.data.data.elements]);
                      } catch (error) {
                        console.error("Error fetching shop data.");
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
              console.error("Error parsing shop data.");
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

    fetchShopData();
  }, [uidToken, shopData]);

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Agri-Shop</h1>
          <Link className="page-profile" to="/profile">
            <ProfileIcon />
          </Link>
        </div>

        <div className="page-body">
          {lat && lon && (
            <div className="shops-near-by">
              <a
                className="shops-near-by-btn"
                href={`https://www.google.com/maps/search/Plant+Nursery+with+rating+above+4/@${lat},${lon},50z`}
              >
                Click here to find shops near by.
              </a>
            </div>
          )}
          {shopData && (
            <div className="page-list">
              <div className="page-shop-list">
                {shopData
                  ?.filter((val) => val.tags?.name)
                  .map((val, index) => (
                    <a
                      className="page-shop-items"
                      href={`https://www.google.com/maps/search/${val.tags.name}/@${val.lat},${val.lon},13z`}
                      key={index}
                    >
                      <h2>{val.tags.name}</h2>
                      {val.tags.description && <p>{val.tags.description}</p>}
                      {val.tags.opening_hours && (
                        <p>{val.tags.opening_hours}</p>
                      )}
                      {val.tags.phone && <p>{val.tags.phone}</p>}
                      {val.tags.email && <p>{val.tags.email}</p>}
                    </a>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShopData;
