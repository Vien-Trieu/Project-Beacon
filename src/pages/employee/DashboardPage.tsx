import {
  useState,
  type SyntheticEvent,
} from "react";

import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import abbLogo from "../../assets/ABB_Logo.png";

import "../../styles/employee-dashboard.css";

function DashboardPage() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] =
    useState("");

  const account = accounts[0];

  const employeeName =
    account?.name ??
    account?.username ??
    "ABB Employee";

  /* =========================
     SEARCH REPORTS
     ========================= */

  function handleSearch(
    event: SyntheticEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const query = searchQuery.trim();

    if (!query) {
      navigate("/employee/reports");
      return;
    }

    navigate(
      `/employee/reports?q=${encodeURIComponent(query)}`
    );
  }

  /* =========================
     SIGN OUT
     ========================= */

  async function handleLogout() {
    await instance.logoutRedirect({
      account,
      postLogoutRedirectUri:
        window.location.origin,
    });
  }

  return (
    <main className="employee-dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-brand">
            <img
              src={abbLogo}
              alt="ABB"
              className="dashboard-logo"
            />

            <div>
              <p className="dashboard-eyebrow">
                Project Beacon
              </p>

              <h1>Employee Portal</h1>
            </div>
          </div>

          <div className="dashboard-user">
            <div className="dashboard-user-text">
              <span className="dashboard-user-label">
                Signed in as
              </span>

              <strong>
                {employeeName}
              </strong>
            </div>

            <button
              type="button"
              className="dashboard-signout-button"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* PAGE CONTENT */}
      <div className="dashboard-content">
        {/* INTRO */}
        <section className="dashboard-welcome">
          <p className="dashboard-section-label">
            Employee Dashboard
          </p>

          <h2>
            Manage Test Reports
          </h2>

          <p>
            Search existing reports, upload finalized
            PDFs, and manage customer report access.
          </p>
        </section>

        {/* SEARCH */}
        <section className="dashboard-search-card">
          <div className="dashboard-search-heading">
            <div>
              <p className="dashboard-section-label">
                Report Search
              </p>

              <h3>Find a test report</h3>

              <p>
                Search by device serial, sales order,
                filename, or report identifier.
              </p>
            </div>
          </div>

          <form
            className="dashboard-search-form"
            onSubmit={handleSearch}
          >
            <div className="dashboard-search-input-wrapper">
              <span
                className="dashboard-search-icon"
                aria-hidden="true"
              >
                ⌕
              </span>

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Serial number, sales order, filename..."
                aria-label="Search reports"
              />
            </div>

            <button
              type="submit"
              className="dashboard-search-button"
            >
              Search Reports
            </button>
          </form>
        </section>

        {/* QUICK ACTIONS */}
        <section className="dashboard-actions">
          <div className="dashboard-section-heading">
            <p className="dashboard-section-label">
              Quick Actions
            </p>

            <h3>
              What would you like to do?
            </h3>
          </div>

          <div className="dashboard-action-grid">
            {/* UPLOAD */}
            <button
              type="button"
              className="dashboard-action-card dashboard-action-primary"
              onClick={() =>
                navigate(
                  "/employee/upload"
                )
              }
            >
              <div className="dashboard-action-icon">
                +
              </div>

              <div className="dashboard-action-body">
                <h4>
                  Upload Test Report
                </h4>

                <p>
                  Manually publish a finalized
                  PDF and generate its customer
                  link.
                </p>

                <span className="dashboard-action-link">
                  Upload report →
                </span>
              </div>
            </button>

            {/* REPORTS */}
            <button
              type="button"
              className="dashboard-action-card"
              onClick={() =>
                navigate(
                  "/employee/reports"
                )
              }
            >
              <div className="dashboard-action-icon">
                ≡
              </div>

              <div className="dashboard-action-body">
                <h4>
                  Browse Reports
                </h4>

                <p>
                  View and search reports already
                  published through Project Beacon.
                </p>

                <span className="dashboard-action-link">
                  View Reports →
                </span>
              </div>
            </button>

            {/* CUSTOMER PORTAL */}
            <button
              type="button"
              className="dashboard-action-card"
              onClick={() =>
                window.open(
                  window.location.origin,
                  "_blank",
                  "noopener,noreferrer"
                )
              }
            >
              <div className="dashboard-action-icon">
                ↗
              </div>

              <div className="dashboard-action-body">
                <h4>
                  Customer Portal
                </h4>

                <p>
                  Open the public Project Beacon
                  customer experience in a new tab.
                </p>

                <span className="dashboard-action-link">
                  Open Portal →
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* SECURITY FOOTER */}
        <section className="dashboard-security">
          <div className="dashboard-security-indicator">
            <span />
          </div>

          <div>
            <strong>
              Secure ABB employee session
            </strong>

            <p>
              Employee functions are protected by
              Microsoft Entra ID authentication.
            </p>
          </div>
        </section>
      </div>

      <footer className="dashboard-footer">
        Project Beacon · ABB Test Report Portal
      </footer>
    </main>
  );
}

export default DashboardPage;