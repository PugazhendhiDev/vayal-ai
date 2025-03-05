import PulseLoader from "react-spinners/PulseLoader";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../configuration/firebase";

function Signin() {
  const navigate = useNavigate();
  const loaderColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary-text-color")
    .trim();

  const [error, setError] = useState("");
  const [signinValue, setSigninValue] = useState(false);

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
    password: "",
  });

  const signin = async (e) => {
    e.preventDefault();
    try {
      setSigninValue(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        value.email,
        value.password
      );
      const idToken = await userCredential.user.getIdToken();

      axios.defaults.withCredentials = true;
      const user = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/signin`,
        { idToken, email: value.email }
      );

      if (user.data.message) {
        navigate("/");
      }
    } catch (error) {
      const errorMessage = error.response
        ? error.response.data.error
        : "Invalid credential";
      setSigninValue(false);
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-form-container">
      <form className="auth-form" onSubmit={signin}>
        <h1 className="auth-h1">Sign In</h1>
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

        <label className="auth-label" htmlFor="password">
          Password:
        </label>
        <input
          className="auth-input"
          type="password"
          name="password"
          placeholder="Enter your Password"
          value={value.password}
          onChange={(e) =>
            setValue({
              ...value,
              password: e.target.value,
            })
          }
          required
        />
        <p className="auth-error">{error}</p>
        {error && (
          <Link className="auth-error auth-link" to={"/forgotPassword"}>
            Forgot password.
          </Link>
        )}
        {signinValue ? (
          <button className="auth-submit-btn" type="submit" disabled>
            <PulseLoader size={5} color={loaderColor} />
          </button>
        ) : (
          <button className="auth-submit-btn" type="submit">
            Sign In
          </button>
        )}
        <p className="auth-p">
          Don't have an account?{" "}
          <Link className="auth-link" to="/signup">
            Sign up
          </Link>
        </p>
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

export default Signin;
