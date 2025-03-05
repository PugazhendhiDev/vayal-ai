import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../configuration/firebase";
import Cookies from "js-cookie";
import ProfileIcon from "../assets/profileIcon";
import CloseIcon from "../assets/closeIcon";

function NewsData() {
  const navigate = useNavigate();

  const [uidToken, setUidToken] = useState(null);

  const [newsData, setNewsData] = useState(null);

  const [newsFlag, setNewsFlag] = useState(false);

  const [specificNewsData, setSpecificNewsData] = useState(null);

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
    if (!uidToken) return;

    if (Cookies.get("news_expire_time")) {
      const storedNewsData = JSON.parse(localStorage.getItem("news_data"));
      setNewsData(storedNewsData);
      return;
    }

    async function getNews() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/news`,
          {
            headers: {
              Authorization: "Bearer " + uidToken,
            },
          }
        );

        localStorage.setItem(
          "news_data",
          JSON.stringify(res.data.data.results)
        );

        Cookies.set("news_expire_time", "News", { expires: 10 / 1440 });

        setNewsData(res.data.data.results);
      } catch (error) {
        console.log("Error fetching News");
      }
    }

    getNews();
  }, [uidToken]);

  const openNews = (index) => {
    setNewsFlag(true);
    setSpecificNewsData(newsData[index]);
  };

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Agri-News</h1>
          <Link className="page-profile" to="/profile">
            <ProfileIcon />
          </Link>
        </div>

        <div className="page-body">
          {newsData && (
            <div className="page-list">
              {newsData.map((val, index) => (
                <div
                  className="page-news-items"
                  key={index}
                  onClick={() => openNews(index)}
                >
                  {val.image_url && (
                    <img
                      src={val.image_url}
                      alt="News"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  )}
                  <div>
                    <h2>{val.title}</h2>
                    <p>
                      {val.description &&
                        `${val.description.substring(0, 1000)}...`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {newsFlag && (
            <div className="page-specific-news-list">
              <div className="page-specific-news-item">
                <div
                  className="page-close-btn"
                  onClick={() => {
                    setNewsFlag(false);
                  }}
                >
                  <CloseIcon />
                </div>
                {specificNewsData.image_url && (
                  <img
                    src={specificNewsData.image_url}
                    alt="News"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                )}
              </div>
              <div className="news-text">
                <h2>{specificNewsData.title}</h2>
                <p>{specificNewsData.description}</p>
                <a href={specificNewsData.link}>{specificNewsData.link}</a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewsData;
