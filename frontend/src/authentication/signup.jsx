import PulseLoader from "react-spinners/PulseLoader";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../configuration/firebase";

import { ToastContainer, toast } from "react-toastify";

function Signup() {
  const navigate = useNavigate();
  const loaderColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary-text-color")
    .trim();

  const [error, setError] = useState("");
  const [signupValue, setSignupValue] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [emailVerifyValue, setEmailVerifyValue] = useState(false);
  const [otpSendBtn, setOtpSendButton] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verifyBtnSend, setVerifyBtnSend] = useState(false);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setOtpSendButton(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

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

          try {
            const res = await axios.get(
              `${import.meta.env.VITE_SERVER_URL}/api/verifyToken`,
              {
                headers: {
                  Authorization: "Bearer " + idToken,
                },
              }
            );

            if (res) {
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

                if (res) {
                  navigate("/");
                }
              } catch (refreshError) {
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
    otp: "",
    password: "",
    retypePassword: "",
  });

  const signup = async (e) => {
    e.preventDefault();
    if (isAccepted) {
      if (value.password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        return;
      } else if (value.password !== value.retypePassword) {
        toast.error("Password don't match.");
        return;
      } else {
        setError("");
        try {
          setSignupValue(true);
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            value.email,
            value.password
          );
          const idToken = await userCredential.user.getIdToken();

          axios.defaults.withCredentials = true;
          const user = await axios.post(
            `${import.meta.env.VITE_SERVER_URL}/api/signup`,
            { idToken, Terms_Of_Use_And_Privacy_Policy: true }
          );
          if (user.data.message) {
            toast.success("You have signed up successfully.", {
              onClose: () => {
                navigate("/");
              },
            });
          }
        } catch (error) {
          const errorMessage = error.response
            ? error.response.data.error
            : "Email already in use.";
          setSignupValue(false);
          toast.error(errorMessage);
        }
      }
    }
  };

  const handleSendOtp = async () => {
    if (value.email && isAccepted) {
      setError("");
      setOtpSendButton(true);
      try {
        axios.defaults.withCredentials = true;
        await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/getOtpForEmailVerification`,
          { email: value.email }
        );
        setEmailVerifyValue(true);
        toast.success("OTP sent successfully.");
        setTimer(60);
        setOtpSendButton(false);
      } catch (error) {
        const errorMessage = error.response
          ? error.response.data.error
          : "Email already exists";
        toast.error(errorMessage);
        setTimer(0);
        setOtpSendButton(false);
        setEmailVerifyValue(false);
      }
    }
  };

  const handleVerifyEmail = async () => {
    if (value.email && isAccepted && value.otp) {
      setVerifyBtnSend(true);
      try {
        axios.defaults.withCredentials = true;
        await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/verifyEmail`, {
          email: value.email,
          otp: value.otp,
        });
        setIsEmailVerified(true);
        setVerifyBtnSend(false);
      } catch (error) {
        setValue({
          ...value,
          otp: "",
        });
        const errorMessage = error.response
          ? error.response.data.error
          : "Wrong OTP";
        toast.error(errorMessage);
        setEmailVerifyValue(false);
        setVerifyBtnSend(false);
      }
    }
  };

  return (
    <div className="auth-form-container">
      <ToastContainer />
      <form className="auth-form" onSubmit={signup}>
        <h1 className="auth-h1">Sign Up</h1>
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

        {!isEmailVerified && (
          <>
            <p className="auth-error">{error}</p>
            {otpSendBtn ? (
              <button className="auth-submit-btn" disabled>
                <PulseLoader size={5} color={loaderColor} />
              </button>
            ) : (
              <>
                {timer === 0 ? (
                  <button className="auth-submit-btn" onClick={handleSendOtp}>
                    Request OTP
                  </button>
                ) : (
                  <button className="auth-submit-btn" disabled>
                    Retry in: {timer}s
                  </button>
                )}
              </>
            )}

            {emailVerifyValue && (
              <>
                <label className="auth-label" htmlFor="otp">
                  OTP:
                </label>
                <input
                  className="auth-input"
                  type="text"
                  name="otp"
                  placeholder="Enter the OTP"
                  value={value.otp}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      otp: e.target.value,
                    })
                  }
                  required
                />
                {verifyBtnSend ? (
                  <button className="auth-submit-btn" disabled>
                    <PulseLoader size={5} color={loaderColor} />
                  </button>
                ) : (
                  <button
                    className="auth-submit-btn"
                    onClick={handleVerifyEmail}
                  >
                    Verify Email
                  </button>
                )}
              </>
            )}
          </>
        )}

        {isEmailVerified && (
          <>
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

            <label className="auth-label" htmlFor="retypePassword">
              Retype Password:
            </label>
            <input
              className="auth-input"
              type="password"
              name="retypePassword"
              placeholder="Retype your Password"
              value={value.retypePassword}
              onChange={(e) =>
                setValue({
                  ...value,
                  retypePassword: e.target.value,
                })
              }
              required
            />
          </>
        )}

        <label
          className="Terms-Of-Use-And-Privacy-Policy"
          htmlFor="TermsOfUse&PrivacyPolicy"
        >
          <input
            type="checkbox"
            name="TermsOfUse&PrivacyPolicy"
            checked={isAccepted}
            onChange={(e) => setIsAccepted(e.target.checked)}
            required
          />
          <p>
            By continuing, you agree to our{" "}
            <Link
              className="Terms-Of-Use-And-Privacy-Policy-link"
              to="/TermsOfUse"
            >
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link
              className="Terms-Of-Use-And-Privacy-Policy-link"
              to="/PrivacyPolicy"
            >
              Privacy Policy.
            </Link>
          </p>
        </label>
        {isEmailVerified && (
          <>
            <p className="auth-error">{error}</p>
            {signupValue ? (
              <button className="auth-submit-btn" type="submit" disabled>
                <PulseLoader size={5} color={loaderColor} />
              </button>
            ) : (
              <button className="auth-submit-btn" type="submit">
                Sign Up
              </button>
            )}
          </>
        )}
        <p className="auth-p">
          Have an account?{" "}
          <Link className="auth-link" to="/signin">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;
