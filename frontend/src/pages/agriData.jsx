import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { auth } from "../configuration/firebase";
import DeleteIcon from "../assets/deleteIcon";
import PlusIcon from "../assets/plusIcon";

import { ToastContainer, toast } from "react-toastify";

function AgriData() {
  const navigate = useNavigate();
  const [imageData, setImageData] = useState([]);

  const { id } = useParams();

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
    if (!uidToken) return;
    const fetchAgriData = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_SERVER_URL}/api/getAgriData/preview`,
          {
            id: id,
          },
          {
            headers: {
              Authorization: "Bearer " + uidToken,
            },
          }
        );

        if (Array.isArray(res.data)) {
          setImageData(res.data);
        } else {
          console.warn("Received unexpected data format:", res.data);
        }
      } catch (error) {
        console.error("Error fetching image data:", error);
      }
    };

    fetchAgriData();
  }, [uidToken]);

  async function handleDelete() {
    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/deleteData`,
        {
          id: id,
        },
        {
          headers: {
            Authorization: "Bearer " + uidToken,
          },
        }
      );

      toast.success("Data deleted.", {
        onClose: () => {
          navigate(-1);
        },
      });
    } catch (error) {
      toast.error("Agri data deletion unsuccessful.");
    }
  }

  return (
    <>
      <ToastContainer />
      <div className="page-wrapper">
        <div className="page-container">
          <div className="page-header">
            <h1 className="page-title">{import.meta.env.VITE_APP_NAME}</h1>
            <div className="page-delete" onClick={handleDelete}>
              <DeleteIcon />
            </div>
          </div>

          <div className="page-body">
            <div className="page-add-btn">
              <Link className="link" to={`/addAgriData/${id}`}>
                <PlusIcon />
              </Link>
            </div>

            <div className="page-list">
              {imageData.map((val, index) => (
                <Link
                  className="page-list-items"
                  to={`/completeAgriData/${val._id}`}
                  key={index}
                >
                  <img
                    src={`${import.meta.env.VITE_CDN_SERVER_URL}/${
                      val.image_name
                    }.jpg`}
                    alt={val.name}
                  />
                  <p>
                    {new Date(val.created_at).toLocaleString("en-GB", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p>
                    {new Date(val.created_at).toLocaleString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AgriData;
