import { BrowserRouter, Routes, Route } from "react-router-dom";

import HomePage from "./pages/public/HomePage";
import ReportPage from "./pages/public/ReportPage";

import DashboardPage from "./pages/employee/DashboardPage";
import ReportsPage from "./pages/employee/ReportsPage";
import UploadReportPage from "./pages/employee/UploadReportPage";

import NotFoundPage from "./pages/errors/NotFoundPage";

import EmployeeAuthGate from "./components/auth/EmployeeAuthGate";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/r/:publicId"
          element={<ReportPage />}
        />

        <Route
          path="/employee"
          element={
            <EmployeeAuthGate>
              <DashboardPage />
            </EmployeeAuthGate>
          }
        />

        <Route
          path="/employee/reports"
          element={
            <EmployeeAuthGate>
              <ReportsPage />
            </EmployeeAuthGate>
          }
        />

        <Route
          path="/employee/upload"
          element={
            <EmployeeAuthGate>
              <UploadReportPage />
            </EmployeeAuthGate>
          }
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;