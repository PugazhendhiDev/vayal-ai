import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import PulseLoader from "react-spinners/PulseLoader";
import { auth } from "../configuration/firebase";
import ProfileIcon from "../assets/profileIcon";
import MenuIcon from "../assets/menuIcon";
import PlusIcon from "../assets/plusIcon";
import DeleteIcon from "../assets/deleteIcon";
import CameraIcon from "../assets/cameraIcon";

import { ToastContainer, toast } from "react-toastify";

import imageCompressor from "../configuration/imageCompressor";
import {
  isAndroid,
  isIOS,
  isMobile,
  isTablet,
  isDesktop,
} from "react-device-detect";
import ImagePlaceholder from "../assets/imagePlaceholder";

function ChatBot() {
  const [weatherData, setWeatherData] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState([]);
  const [isSubmit, setIsSubmit] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [id, setId] = useState(null);
  const navigate = useNavigate();

  const [isImageUpload, setIsImageUpload] = useState(null);
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const camInputRef = useRef(null);

  const [isCam, setIsCam] = useState(false);

  const loaderColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary-text-color")
    .trim();

  useEffect(() => {
    if (isAndroid) {
      setIsCam(true);
    } else if (isIOS) {
      setIsCam(true);
    } else if (isMobile) {
      setIsCam(true);
    } else if (isTablet) {
      setIsCam(true);
    } else if (isDesktop) {
      setIsCam(false);
    } else {
      setIsCam(false);
    }
  }, []);

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
                setWeatherData(storedWeatherDataParsed);
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
                          setWeatherData(parsedData);
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
            return;
          } else {
            return;
          }
        } catch (error) {
          return;
        }
      }
    };

    fetchWeatherData();
  }, [uidToken, weatherData]);

  useEffect(() => {
    if (!uidToken) return;
    const getChatData = async () => {
      const result = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/getChatHistory`,
        {
          headers: {
            Authorization: "Bearer " + uidToken,
          },
        }
      );
      if (result) {
        setHistory(result.data);
      }
    };
    getChatData();
  }, [uidToken, isMenuOpen]);

  const handleMenu = async (id) => {
    if (!uidToken) return;
    setId(id);
    setContent([]);
    try {
      const result = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/getChatData`,
        { id: id },
        {
          headers: {
            Authorization: "Bearer " + uidToken,
          },
        }
      );

      if (result.data && result.data.length > 0) {
        const chatData = result.data.map((chat) => ({
          user: chat.user_msg,
          ai: chat.ai_msg,
          image_name: chat.image_name,
        }));

        setContent(chatData);
      }
    } catch (error) {
      console.error("Error submitting chat:", error);
    } finally {
      setIsMenuOpen(false);
    }
  };

  const handleDelete = async (id) => {
    setHistory(null);
    try {
      axios.defaults.withCredentials = true;
      const result = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/deleteChatHistory`,
        { id: id },
        {
          headers: {
            Authorization: "Bearer " + uidToken,
          },
        }
      );

      toast.success("Data deleted.");

      if (result) {
        axios.defaults.withCredentials = true;
        const result = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/getChatHistory`,
          {
            headers: {
              Authorization: "Bearer " + uidToken,
            },
          }
        );
        if (result) {
          setPrompt("");
          setHistory(result.data);
        }
      }
    } catch (error) {
      toast.error("Error submitting chat:", error);
    } finally {
      setId(null);
      setContent([]);
      setIsMenuOpen(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (!prompt.trim()) return;
      setIsSubmit(true);

      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("history", JSON.stringify(content || []));

      if (file) {
        const compressedFile = await imageCompressor(file);
        formData.append("agri_image", compressedFile);
      }

      let chatId = id;

      if (!chatId) {
        const result = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/addChatHistory`,
          { chat_name: prompt },
          {
            headers: {
              Authorization: "Bearer " + uidToken,
            },
          }
        );

        if (result) {
          const response = await axios.get(
            `${import.meta.env.VITE_SERVER_URL}/api/getChatHistory`,
            {
              headers: {
                Authorization: "Bearer " + uidToken,
              },
            }
          );

          if (response.data.length > 0) {
            chatId = response.data[0]._id;
            setId(chatId);
          }
          setHistory(response.data);
        }
      }

      if (chatId) {
        formData.append("id", chatId);
        const result = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/addChatData`,
          formData,
          {
            headers: {
              Authorization: "Bearer " + uidToken,
            },
          }
        );

        if (result.data && result.data[0].ai_msg) {
          setContent((prevContent) => [
            ...prevContent,
            {
              user: prompt,
              ai: result.data[0].ai_msg,
              image_name: result.data[0].image_name
                ? result.data[0].image_name
                : null,
            },
          ]);
        }
      }

      setPrompt("");
      setFile(null);
      setImage(null);
      setIsImageUpload(false);
    } catch (error) {
      console.error("Error submitting chat:", error);
      setFile(null);
      setImage(null);
    } finally {
      setIsSubmit(false);
      setFile(null);
      setImage(null);
      setIsImageUpload(false);
    }
  };

  const handleCamClick = () => {
    camInputRef.current.click();
  };

  const handleAddClick = () => {
    fileInputRef.current.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setFile(file);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="page-wrapper">
        <div className="page-container">
          <div className="page-header">
            <div
              className="page-menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <MenuIcon />
            </div>
            <h1 className="page-title">{import.meta.env.VITE_APP_NAME}</h1>
            <Link className="page-profile" to="/profile">
              <ProfileIcon />
            </Link>
          </div>

          <div className="page-body">
            {isImageUpload && (
              <div className="image-in-chat">
                <form className="page-form">
                  <div className="page-form-upload-image-preview">
                    {image ? (
                      <img src={image} alt="Selected" />
                    ) : (
                      <ImagePlaceholder />
                    )}
                  </div>
                  {isCam ? (
                    <>
                      <input
                        className="page-form-input-file"
                        type="file"
                        name="agri_image"
                        accept="image/*"
                        capture="environment"
                        ref={camInputRef}
                        onChange={handleImageChange}
                        hidden
                      />
                      <input
                        className="page-form-input-file"
                        type="file"
                        name="agri_image"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        hidden
                      />
                      <div className="page-form-upload-btn">
                        <div
                          className="page-form-cam-btn"
                          onClick={handleCamClick}
                        >
                          <CameraIcon />
                        </div>
                        <div
                          className="page-form-add-btn"
                          onClick={handleAddClick}
                        >
                          <PlusIcon />
                        </div>
                      </div>
                      <label className="page-form-label">
                        Click the cam/plus icon to upload image.
                      </label>
                    </>
                  ) : (
                    <>
                      <input
                        className="page-form-input-file"
                        type="file"
                        name="agri_image"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        hidden
                      />
                      <div className="page-form-upload-btn">
                        <div
                          className="page-form-add-btn"
                          onClick={handleAddClick}
                        >
                          <PlusIcon />
                        </div>
                      </div>
                      <label className="page-form-label">
                        Click plus icon to upload image.
                      </label>
                    </>
                  )}
                </form>
              </div>
            )}
            {isMenuOpen ? (
              <>
                <div className="chat-history">
                  <a className="chatbot-newchat" href="/chatBot">
                    <PlusIcon />
                    <h2>New Chat</h2>
                  </a>
                  <div className="chatbot-history">
                    {history && history.length === 0 ? (
                      <p className="no-history">No history</p>
                    ) : (
                      history?.map((val, index) => (
                        <div
                          className="chatbot-history-list"
                          onClick={() => handleMenu(val._id)}
                          key={index}
                        >
                          <div className="chatbot-history-details">
                            <p>
                              {new Date(val.last_msg_time).toLocaleString(
                                "en-GB",
                                {
                                  weekday: "short",
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )}
                            </p>
                            <div
                              className="chatbot-history-delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(val._id);
                              }}
                            >
                              <DeleteIcon />
                            </div>
                          </div>
                          <hr />
                          <p>{val.chat_name}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="chatbot-chatview">
                  {content.map((val, index) => (
                    <div key={index}>
                      {val.user && (
                        <div className="chatbot-chat-user">
                          {val.image_name && (
                            <img
                              className="chatbot-chat-user-img"
                              src={`${import.meta.env.VITE_CDN_SERVER_URL}/${
                                val.image_name
                              }`}
                            />
                          )}
                          <p className="chatbot-chat-user-p">{val.user}</p>
                        </div>
                      )}
                      {val.ai && (
                        <div className="chatbot-chat-bot">
                          <p
                            dangerouslySetInnerHTML={{ __html: val.ai }}
                            className="chatbot-chat-bot-p"
                          ></p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="chatbot-prompt-wrapper">
                  <form
                    className="chatbot-prompt-input-wrapper"
                    onSubmit={submit}
                  >
                    <input
                      className="chatbot-prompt-input"
                      type="text"
                      name="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter your Prompt"
                      required
                    />
                    <div
                      className="image-in-chat-camera-icon"
                      onClick={() => {
                        setIsImageUpload(!isImageUpload);
                        setFile(null);
                        setImage(null);
                      }}
                    >
                      <CameraIcon />
                    </div>
                    {isSubmit ? (
                      <button className="chatbot-prompt-send-btn" disabled>
                        <PulseLoader size={5} color={loaderColor} />
                      </button>
                    ) : (
                      <button className="chatbot-prompt-send-btn">Send</button>
                    )}
                  </form>
                  <p className="chatbot-disclaimer">AI can make mistake.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatBot;
