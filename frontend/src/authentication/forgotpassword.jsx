import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import PulseLoader from "react-spinners/PulseLoader";
import { auth } from "../configuration/firebase";

function ForgotPassword() {
  const [resetValue, setResetValue] = useState(false);
  const navigate = useNavigate();
  const loaderColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary-text-color")
    .trim();

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            let idToken = await user.getIdToken();
            const decodedToken = JSON.parse(atob(idToken.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            const expirationTime = decodedToken.exp;
  
            if (expirationTime - currentTime < 300) {
              idToken = await user.getIdToken(true);
            }
  
            try {
              const res = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/verifyToken`,
                {
                  headers: {
                    Authorization: "Bearer " + idToken,
                  },
                }
              );
  
              if(res) {
                navigate("/");
              }
            } catch (verifyError) {
              if (verifyError.response && verifyError.response.status === 401) {
                try {
                  const refreshedToken = await user.getIdToken(true);
                  const res = await axios.get(
                      `${import.meta.env.VITE_SERVER_URL}/api/verifyToken`,
                      {
                        headers: {
                          Authorization: "Bearer " + refreshedToken,
                        },
                      }
                  );
  
                  if(res) {
                    navigate("/");
                  }
                } catch (refreshError){
                  console.error("Token refresh failed:", refreshError);
                }
              } else {
                  console.error("Token verification error:", verifyError);
              }
            }
          } catch (getTokenError) {
            console.error("Error getting ID token:", getTokenError);
          }
        } else {
          console.error("Error getting User");
        }
      });
  
      return () => unsubscribe();
    }, [navigate]);

  const [value, setValue] = useState({
    email: "",
  });

  const resetPassword = async (e) => {
    e.preventDefault();
    setResetValue(true);
    try {
      axios.defaults.withCredentials = true;
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/resetPassword`,
        {
          email: value.email,
        }
      );
      if (res) {
        setResetValue(false);
        navigate("/");
      }
    } catch (error) {
      setResetValue(false);
      console.error("Error fetching user validation");
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={resetPassword}>
        <h1 className="auth-h1">Forgot Password</h1>
        <label className="auth-label" htmlFor="email">
          Email:
        </label>
        <input
          className="auth-input"
          type="email"
          name="email"
          placeholder="Enter your Email"
          value={value.email}
          onChange={(e) =>
            setValue({
              ...value,
              email: e.target.value,
            })
          }
          required
        />
        {resetValue ? (
          <button className="auth-submit-btn" type="submit" disabled>
            <PulseLoader size={5} color={loaderColor} />
          </button>
        ) : (
          <button className="auth-submit-btn" type="submit">
            Reset
          </button>
        )}
      </form>
      <p className="Terms-Of-Use-And-Privacy-Policy-p">
        <Link className="Terms-Of-Use-And-Privacy-Policy-link" to="/TermsOfUse">
          Terms of Use
        </Link>{" "}
        |{" "}
        <Link
          className="Terms-Of-Use-And-Privacy-Policy-link"
          to="/PrivacyPolicy"
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

export default ForgotPassword;
