import UploadPDF from "./components/UploadPdf/UploadPDF";
import Chatbot from "./components/Chatbot/Chatbot";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from "./components/Home/Home";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<UploadPDF />} />
        <Route path="/chat" element={<Chatbot />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
