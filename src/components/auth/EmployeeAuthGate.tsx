import { type ReactNode } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import { loginRequest } from "../../auth/msalConfig";
import abbLogo from "../../assets/ABB_Logo.png";

import "../../styles/employee-login.css";

type EmployeeAuthGateProps = {
  children: ReactNode;
};

function EmployeeAuthGate({
  children,
}: EmployeeAuthGateProps) {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();

  const isAuthenticated = accounts.length > 0;

  async function handleLogin() {
    await instance.loginRedirect({
      ...loginRequest,
      redirectStartPage: `${window.location.origin}/employee`,
    });
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <main className="employee-login-page">
      <div className="employee-login-background" />

      <div className="employee-login-layout">
        {/* LEFT SIDE */}
        <section className="employee-login-brand-panel">
          <div className="employee-login-brand">
            <img
              src={abbLogo}
              alt="ABB"
              className="employee-login-logo"
            />

            <div>
              <p className="employee-login-eyebrow">
                Customer Test Report
              </p>

              <p className="employee-login-product">
                Employee Portal
              </p>
            </div>
          </div>

          <div className="employee-login-intro">
            <p className="employee-login-kicker">
              Test Report Management
            </p>

            <h1>
              Test reports.
              <br />
              Delivered simply.
            </h1>

            <p className="employee-login-description">
              Secure employee access for publishing and
              managing ABB customer test reports through
              Customer Test Report.
            </p>
          </div>

          <div className="employee-login-features">
            <div className="employee-login-feature">
              <span className="employee-login-feature-icon">
                ✓
              </span>

              <div>
                <strong>ABB Entra ID</strong>
                <p>
                  Employee authentication through your ABB
                  Microsoft account.
                </p>
              </div>
            </div>

            <div className="employee-login-feature">
              <span className="employee-login-feature-icon">
                ✓
              </span>

              <div>
                <strong>Protected management</strong>
                <p>
                  Employee functions stay behind authenticated
                  access.
                </p>
              </div>
            </div>

            <div className="employee-login-feature">
              <span className="employee-login-feature-icon">
                ✓
              </span>

              <div>
                <strong>Customer-ready delivery</strong>
                <p>
                  Publish finalized reports to permanent
                  customer links.
                </p>
              </div>
            </div>
          </div>

          <p className="employee-login-copyright">
            Customer Test Report · ABB Test Report Portal
          </p>
        </section>

        {/* RIGHT SIDE */}
        <section className="employee-login-auth-panel">
          <div className="employee-login-card">
            <div className="employee-login-card-badge">
              <span className="employee-login-status-dot" />
              Secure Employee Access
            </div>

            <h2>Welcome back</h2>

            <p className="employee-login-card-description">
              Sign in with your ABB Microsoft account to
              access the Customer Test Report employee portal.
            </p>

            <button
              type="button"
              className="employee-login-primary"
              onClick={handleLogin}
            >
              <span className="employee-login-microsoft-icon">
                <span />
                <span />
                <span />
                <span />
              </span>

              Sign in with ABB
            </button>

            <div className="employee-login-divider">
              <span />
            </div>

            <button
              type="button"
              className="employee-login-back"
              onClick={() => navigate("/")}
            >
              ← Back to Customer Portal
            </button>

            <p className="employee-login-security-note">
              Access is restricted to authorized ABB
              Microsoft accounts.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default EmployeeAuthGate;