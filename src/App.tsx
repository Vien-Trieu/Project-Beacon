import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/public/HomePage";
import ReportPage from "./pages/public/ReportPage";
import DashboardPage from "./pages/employee/DashboardPage";
import NotFoundPage from "./pages/errors/NotFoundPage";
import UploadReportPage from "./pages/employee/UploadReportPage"
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/r/:publicId" element={<ReportPage />} />
        <Route path="/employee" element={<DashboardPage />} />
        <Route path="/employee/upload" element={<UploadReportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;