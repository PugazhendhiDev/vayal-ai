import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PulseLoader from "react-spinners/PulseLoader";
import { auth } from "../configuration/firebase";
import ProfileIcon from "../assets/profileIcon";

function AddDevice() {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [isSubmit, setIsSubmit] = useState(false);
  const navigate = useNavigate();

  const loaderColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary-text-color")
    .trim();

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

  const addData = async (e) => {
    e.preventDefault();
    try {
      setIsSubmit(true);
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/addDevice`,
        {
          deviceName: name,
          type: type,
        },
        {
          headers: {
            Authorization: "Bearer " + uidToken,
          },
        }
      );

      if (res) {
        setIsSubmit(false);
        navigate(-1);
      }
    } catch {
      setIsSubmit(false);
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
            <div className="page-form-wrapper">
              <form className="page-form" onSubmit={addData}>
                <input
                  className="page-form-input"
                  type="text"
                  name="agri-name"
                  placeholder="Enter the name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  required
                />
                <select
                  className="page-form-select"
                  name="agri-type"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                  }}
                  required
                >
                  <option value="">Select a type</option>
                  <option value="Irrigation">Irrigation</option>
                  <option value="Monitoring">Monitoring</option>
                </select>
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
                    Add Device
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

export default AddDevice;
