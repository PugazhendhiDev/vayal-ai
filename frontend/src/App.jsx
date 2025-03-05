import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signin from "./authentication/signin.jsx";
import Signup from "./authentication/signup.jsx";
import ForgotPassword from "./authentication/forgotpassword.jsx";
import Home from "./pages/home.jsx";
import AddData from "./pages/addData.jsx";
import Profile from "./pages/profile.jsx";
import AgriData from "./pages/agriData.jsx";
import CompleteAgriData from "./pages/completeAgriData.jsx";
import AddAgriData from "./pages/addAgriData.jsx";
import TermsOfUse from "./pages/termsofuse.jsx";
import PrivacyPolicy from "./pages/privacypolicy.jsx";
import WeatherData from "./pages/weatherData.jsx";
import ChatBot from "./pages/chatbot.jsx";
import AgriDataHome from "./pages/agriDataHome.jsx";
import NewsData from "./pages/newsData.jsx";
import ShopData from "./pages/shopData.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agriDataHome" element={<AgriDataHome />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/TermsOfUse" element={<TermsOfUse />} />
        <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
        <Route path="/addData" element={<AddData />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/agriData/:id" element={<AgriData />} />
        <Route path="/addAgriData/:id" element={<AddAgriData />} />
        <Route path="/completeAgriData/:id" element={<CompleteAgriData />} />
        <Route path="/weatherData" element={<WeatherData />} />
        <Route path="/chatBot" element={<ChatBot />} />
        <Route path="/news" element={<NewsData />} />
        <Route path="/shopData" element={<ShopData />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
