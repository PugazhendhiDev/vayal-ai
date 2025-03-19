import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import imageCompressor from "../configuration/imageCompressor";
import {
  isAndroid,
  isIOS,
  isMobile,
  isTablet,
  isDesktop,
} from "react-device-detect";
import PulseLoader from "react-spinners/PulseLoader";
import { auth } from "../configuration/firebase";
import ProfileIcon from "../assets/profileIcon";
import ImagePlaceholder from "../assets/imagePlaceholder";
import CameraIcon from "../assets/cameraIcon";
import PlusIcon from "../assets/plusIcon";

import { ToastContainer, toast } from "react-toastify";

function AddData() {
  const [agriName, setAgriName] = useState("");
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const camInputRef = useRef(null);
  const navigate = useNavigate();
  const [isSubmit, setIsSubmit] = useState(false);
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

  const addData = async (e) => {
    e.preventDefault();
    if (agriName && file) {
      const formData = new FormData();
      formData.append("agri_name", agriName);

      setIsSubmit(true);

      const compressedFile = await imageCompressor(file);
      formData.append("agri_image", compressedFile);

      await axios
        .post(`${import.meta.env.VITE_SERVER_URL}/api/addData`, formData, {
          headers: {
            Authorization: "Bearer " + uidToken,
          },
        })
        .then((res) => {
          setIsSubmit(false);
          navigate("/agriDataHome");
        })
        .catch((err) => {
          setIsSubmit(false);
          toast.error(err);
        });
    } else {
      setIsSubmit(false);
      setFile(null);
      setImage(null);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="page-wrapper">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">{import.meta.env.VITE_APP_NAME}</h1>
            <Link className="page-profile" to="/profile">
              <ProfileIcon />
            </Link>
          </div>

          <div className="page-body">
            <div className="page-form-wrapper">
              <form className="page-form" onSubmit={addData}>
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
                <label className="page-form-label" htmlFor="email">
                  Name
                </label>
                <input
                  className="page-form-input"
                  type="text"
                  name="agri-name"
                  placeholder="Enter the name"
                  value={agriName}
                  onChange={(e) => {
                    setAgriName(e.target.value);
                  }}
                  required
                />
                {isSubmit ? (
                  <button
                    className="page-form-submit-btn"
                    type="submit"
                    disabled
                  >
                    <PulseLoader size={5} color={loaderColor} />
                  </button>
                ) : (
                  <button className="page-form-submit-btn" type="submit">
                    Submit
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddData;
