import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../configuration/firebase";

function Settings() {
  const navigate = useNavigate();

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

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Settings</h1>
        </div>
        <div className="page-body">
          <div className="list-view-wrapper">
            <p className="text-list-view">
              <Link className="link" to="/changePassword">
                Change Password
              </Link>
            </p>
            <p className="text-list-view">
              <Link className="link" to="/TermsOfUse">
                Terms of Use
              </Link>
            </p>
            <p className="text-list-view">
              <Link className="link" to="/PrivacyPolicy">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
