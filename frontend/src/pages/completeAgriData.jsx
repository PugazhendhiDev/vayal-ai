import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { auth } from "../configuration/firebase";
import DeleteIcon from "../assets/deleteIcon";

function CompleteAgriData() {
  const navigate = useNavigate();
  const [content, setContent] = useState({});

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
          `${import.meta.env.VITE_SERVER_URL}/api/getAgriData/content`,
          {
            id: id,
          },
          {
            headers: {
              Authorization: "Bearer " + uidToken,
            },
          }
        );

        if (res.data) {
          setContent(res.data);
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
        `${import.meta.env.VITE_SERVER_URL}/api/deleteAgriData`,
        {
          id: id,
          image_name: content.image_name,
        },
        {
          headers: {
            Authorization: "Bearer " + uidToken,
          },
        }
      );
      navigate(-1);
    } catch (error) {
      console.error("Agri data deletion unsuccessful.");
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{import.meta.env.VITE_APP_NAME}</h1>
          <div className="page-delete" onClick={handleDelete}>
            <DeleteIcon />
          </div>
        </div>

        <div className="page-body">
          <div className="page-content-wrapper">
            <div className="page-content-image-wrapper">
              <img
                className="page-content-image"
                src={
                  content.image_name &&
                  `${import.meta.env.VITE_CDN_SERVER_URL}/${
                    content.image_name
                  }.jpg`
                }
                alt={content.image_name}
              />
            </div>
            <div
              className="page-content-text"
              dangerouslySetInnerHTML={{ __html: content.content }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompleteAgriData;
