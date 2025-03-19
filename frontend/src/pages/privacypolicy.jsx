import React from "react";

function PrivacyPolicy() {
  return (
    <div className="page-wrapper">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">{import.meta.env.VITE_APP_NAME}</h1>
        </div>

        <div className="page-body">
          <div className="page-content-wrapper">
            <div
              className="page-content-text"
              dangerouslySetInnerHTML={{
                __html: import.meta.env.VITE_PRIVACY_POLICY,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
