import React from "react";

function TermsOfUse() {
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
                __html: import.meta.env.VITE_TERMS_OF_USE,
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsOfUse;
