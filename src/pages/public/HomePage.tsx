import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import { loginRequest } from "../../auth/msalConfig";
import abbLogo from "../../assets/ABB_Logo.png";

import "../../styles/home-page.css";

function HomePage() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  async function handleEmployeeLogin() {
    // Already signed in?
    // Go directly to the employee dashboard.
    if (accounts.length > 0) {
      navigate("/employee");
      return;
    }

    // Otherwise authenticate through ABB Entra ID.
    await instance.loginRedirect({
      ...loginRequest,
      redirectStartPage: `${window.location.origin}/employee`,
    });
  }

  return (
    <main className="home-page">
      {/* Header */}
      <header className="home-header">
        <div className="home-header-content">
          <div className="home-brand">
            <img
              src={abbLogo}
              alt="ABB"
              className="home-logo"
            />

            <div>
              <p className="home-eyebrow">
                Customer Test Report
              </p>

              <h1>Test Report Portal</h1>

              <p className="home-header-subtitle">
                External Customer Test Reports
              </p>
            </div>
          </div>

          <button
            type="button"
            className="employee-login-button"
            onClick={handleEmployeeLogin}
          >
            Employee Login
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-text">
            <p className="home-section-label">
              ABB Test Reports
            </p>

            <h2>
              Your test report, available when you need it.
            </h2>

            <p className="home-hero-description">
              Scan the QR code on your equipment or use the
              unique report link provided with your device to
              securely view and download its finalized test
              report.
            </p>
          </div>

          <div className="home-qr-card">
            <div className="home-qr-icon">
              <span />
              <span />
              <span />
              <span />
            </div>

            <h3>Scan your QR code</h3>

            <p>
              Each device has a unique link to its test report.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="home-info">
        <div className="home-info-grid">
          <article className="home-info-card">
            <div className="home-info-number">
              01
            </div>

            <h3>Scan</h3>

            <p>
              Scan the QR code attached to your ABB equipment.
            </p>
          </article>

          <article className="home-info-card">
            <div className="home-info-number">
              02
            </div>

            <h3>View</h3>

            <p>
              Your unique Customer Test Report report page opens
              directly.
            </p>
          </article>

          <article className="home-info-card">
            <div className="home-info-number">
              03
            </div>

            <h3>Download</h3>

            <p>
              View the finalized PDF or download a copy for
              your records.
            </p>
          </article>
        </div>
      </section>

      {/* Access note */}
      <section className="home-note">
        <div className="home-note-content">
          <h2>Looking for a test report?</h2>

          <p>
            Reports are available only through the unique QR
            code or link assigned to the equipment. Project
            Beacon does not provide public report browsing or
            search.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>
          Customer Test Report · ABB Test Report Portal
        </p>
      </footer>
    </main>
  );
}

export default HomePage;