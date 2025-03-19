import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PulseLoader from "react-spinners/PulseLoader";
import { auth } from "../configuration/firebase";

import { ToastContainer, toast } from "react-toastify";

function ChangePassword() {
  const [resetValue, setResetValue] = useState(false);
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

  const changePassword = async (e) => {
    e.preventDefault();
    setResetValue(true);
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/changePassword`,
        {
          headers: {
            Authorization: "Bearer " + uidToken,
          },
        }
      );
      if (res) {
        toast.success("The email has been sent successfully.", {
          onClose: () => {
            setResetValue(false);
            navigate("/");
          },
        });
      }
    } catch (error) {
      setResetValue(false);
      console.error("Error fetching user validation");
    }
  };
  return (
    <>
      <ToastContainer />
      <div className="auth-form-container">
        <form className="auth-form" onSubmit={changePassword}>
          <h1 className="auth-h1">Change Password</h1>
          <p>
            After you click on "Change Password," we will send a reset link to
            your email.
          </p>
          {resetValue ? (
            <button className="auth-submit-btn" type="submit" disabled>
              <PulseLoader size={5} color={loaderColor} />
            </button>
          ) : (
            <button className="auth-submit-btn" type="submit">
              Change Password
            </button>
          )}
        </form>
      </div>
    </>
  );
}

export default ChangePassword;
