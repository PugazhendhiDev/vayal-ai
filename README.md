# Vayal AI

Vayal AI is an AI-powered agriculture assistant that provides farming recommendations, weather insights, and crop analysis. It helps farmers manage multiple farms, analyze plant health, and get real-time weather updates.

## Features

- **AI-based Farming Recommendations**: Chat with Gemini AI for personalized agriculture insights.
- **Weather Insights**: Get real-time weather data and forecasts based on your location.
- **Plant Disease Analysis**: Upload plant images for AI-based disease detection and recommendations.
- **My Farm Management**: Track multiple farms, monitor plant status, and view history.
- **Agri News & Shop Finder**: Stay updated with the latest agricultural news and locate nearby farming supply stores.
- **User Authentication**: Secure login, OTP verification for signup, and password recovery.

## Tech Stack

- **Frontend**: React.js (Firebase for authentication & state management)
- **Backend API**: Express.js (Handles API requests, authentication, and database operations)
- **Database**: MongoDB (for Vayal AI), Firebase Firestore
- **Cloud Storage**: Cloudinary (for image uploads)
- **AI & Data APIs**:
  - Gemini API (for AI chat & plant analysis)
  - Weather API (for weather data & forecast)
  - OSM Maps API (used to get location)
  - News API (for agricultural news)

## Environment Variables

### **Frontend (.env file)**
```
VITE_APP_NAME=your_app_name
VITE_SERVER_URL=your_backend_server_url (when hosted separately)
VITE_CDN_SERVER_URL=your_cdn_url
VITE_FIREBASE_CONFIGURATION=your_firebase_config
VITE_TERMS_OF_USE=your_terms_url
VITE_PRIVACY_POLICY=your_privacy_policy_url
```

### **Backend (.env file)**
```
PORT=your_port_number
APP_NAME=your_app_name
WEATHER_API_KEY=your_weather_api_key
NEWS_API_KEY=your_news_api_key
MONGODB_URI=your_mongodb_uri
GEMINI_API_KEY=your_gemini_api_key
FILE_SERVER_NAME=your_file_server_name
FILE_SERVER_API_KEY=your_file_server_api_key
FILE_SERVER_API_SECRET=your_file_server_api_secret
NODEMAILER_SERVICE_PROVIDER=your_email_provider
NODEMAILER_EMAIL=your_email
NODEMAILER_PASSWORD=your_email_password
FIREBASE_ADMIN_CREDENTIALS=your_firebase_admin_credentials
FRONTEND_URL=your_frontend_url (when hosted separately)
DEFAULT_PROMPT=your_default_prompt
DEFAULT_TEXT_PROMPT=your_default_text_prompt
```

## Installation & Setup

1. Clone the repository:
   ```powershell
   git clone https://github.com/PugazhendhiDev/vayal-ai.git
   cd vayal-ai
   ```
2. Install dependencies (for Windows PowerShell):
   ```powershell
   cd frontend
   npm install
   cd ..
   cd backend
   npm install
   ```
3. Set up environment variables (`.env` file as shown above).
4. Start the backend server:
   ```powershell
   cd backend
   npm run start
   ```
5. Start the frontend:
   ```powershell
   cd frontend
   npm run dev
   ```

## Deployment

- **Frontend**: Can be deployed on Vercel or Netlify.
- **Backend**: Deployable on Render, Railway, or a VPS.
- **Database**: Use MongoDB Atlas for scalable cloud hosting.

## IoT Integration (Upcoming)

- **ESP8266 Integration**: Connect IoT devices for real-time soil and crop monitoring.
- **Automated Irrigation Control**: Turn water pumps on/off based on sensor data.

## Team Members

- **Pugazhendhi D** (Team Leader)
- **Nithish Kumar P**
- **Nithyasree Satish**
- **Ragavi Raksha V**

## Video Demonstration

Watch our project demo on YouTube: [Vayal AI Demo](https://www.youtube.com/watch?v=4weySbpSMMw)

## License

This project is open-source under the [MIT License](LICENSE).
