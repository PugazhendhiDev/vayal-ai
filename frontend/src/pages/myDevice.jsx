import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../configuration/firebase";
import ProfileIcon from "../assets/profileIcon";
import PlusIcon from "../assets/plusIcon";
import DeleteIcon from "../assets/deleteIcon";
import { ToastContainer, toast } from "react-toastify";

function MyDevice() {
  const navigate = useNavigate();
  const [uidToken, setUidToken] = useState(null);
  const [data, setData] = useState([]);

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
                headers: { Authorization: "Bearer " + idToken },
              }
            );
          } catch (verifyError) {
            console.error("Token verification error:", verifyError);
            navigate("/signin");
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
    const fetchMyDevice = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/getDevice`,
          {
            headers: { Authorization: "Bearer " + uidToken },
          }
        );

        if (res) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Error fetching device data:", error);
      }
    };

    fetchMyDevice();
  }, [uidToken]);

  const handleToggle = async (deviceId, currentStatus) => {
    const newStatus = !currentStatus;

    try {
      await axios.put(
        `${import.meta.env.VITE_SERVER_URL}/api/updateDevice`,
        { deviceId, isWorking: newStatus },
        {
          headers: { Authorization: "Bearer " + uidToken },
        }
      );

      setData((prevData) =>
        prevData.map((device) =>
          device._id === deviceId ? { ...device, isWorking: newStatus } : device
        )
      );
    } catch (error) {
      console.error("Error updating device status:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      axios.defaults.withCredentials = true;
      const result = await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/deleteDevice`,
        {
          data: { deviceCode: id },
          headers: {
            Authorization: "Bearer " + uidToken,
          },
        }
      );

      if (result) {
        toast.success("Device deleted.");
        setData((prevData) => prevData.filter((device) => device._id !== id));
      }
    } catch {
      toast.error("Error deleting device");
    }
  };

  const copyToClipboard = (deviceId) => {
    navigator.clipboard.writeText(deviceId);
    toast.success("Device ID copied to clipboard: " + deviceId);
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
            <div className="page-add-btn">
              <Link className="link" to={"/addDevice"}>
                <PlusIcon />
              </Link>
            </div>
            <div className="list-view-wrapper">
              {data.map((val, index) => (
                <div className="text-list-view" key={index}>
                  <div className="iot-details-wrapper">
                    <h2>
                      {val.name.length >= 10
                        ? `${val.name.substring(0, 10)}...`
                        : val.name}
                    </h2>
                    <div className="iot-details">
                      <p>
                        {val.type.length >= 14
                          ? `${val.type.substring(0, 14)}...`
                          : val.type}
                      </p>
                      <p>
                        {val.status === "Online" ? "✅ Online" : "❌ Offline"}
                      </p>
                    </div>
                    <div className="iot-details">
                      <div
                        className={`switch-btn ${
                          val.isWorking ? "switch-on" : "switch-off"
                        }`}
                        onClick={() => handleToggle(val._id, val.isWorking)}
                      >
                        <div className="switch-handle"></div>
                      </div>
                      <div
                        className="copy-btn"
                        onClick={() => copyToClipboard(val._id)}
                      >
                        Copy Device ID
                      </div>
                      <div
                        className="iot-device-delete"
                        onClick={(e) => {
                          handleDelete(val._id);
                        }}
                      >
                        <DeleteIcon />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MyDevice;
