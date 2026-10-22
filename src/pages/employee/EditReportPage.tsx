import {
  useCallback,
  useEffect,
  useState,
  type SubmitEvent,
} from "react";

import {
  InteractionRequiredAuthError,
} from "@azure/msal-browser";

import { useMsal } from "@azure/msal-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  beaconTokenRequest,
} from "../../auth/msalConfig";

import {
  getEmployeeReport,
  updateEmployeeReport,
  type EmployeeReport,
} from "../../services/employeeReportService";

import abbLogo from "../../assets/ABB_Logo.png";

import "../../styles/employee-edit-report.css";

type ReportStatus = "Pass" | "Fail";

function EditReportPage() {
  const { instance, accounts } = useMsal();

  const navigate = useNavigate();

  const { publicId } = useParams<{
    publicId: string;
  }>();

  const account = accounts[0];

  const [report, setReport] =
    useState<EmployeeReport | null>(null);

  const [salesOrder, setSalesOrder] =
    useState("");

  const [status, setStatus] =
    useState<ReportStatus>("Pass");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ==========================================
     GET BEACON ACCESS TOKEN
     ========================================== */

  const acquireBeaconToken =
    useCallback(async () => {
      if (!account) {
        throw new Error(
          "You must be signed in with your ABB account."
        );
      }

      try {
        const response =
          await instance.acquireTokenSilent({
            ...beaconTokenRequest,
            account,
          });

        return response.accessToken;
      } catch (tokenError) {
        if (
          tokenError instanceof
          InteractionRequiredAuthError
        ) {
          await instance.acquireTokenRedirect({
            ...beaconTokenRequest,
            account,
            redirectStartPage:
              window.location.href,
          });

          return null;
        }

        throw tokenError;
      }
    }, [account, instance]);

  /* ==========================================
     LOAD REPORT
     ========================================== */

  const loadReport =
    useCallback(async () => {
      if (!publicId) {
        setError(
          "Report identifier is missing."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const accessToken =
          await acquireBeaconToken();

        if (!accessToken) {
          return;
        }

        const result =
          await getEmployeeReport(
            accessToken,
            publicId
          );

        setReport(result);

        setSalesOrder(
          result.salesOrder
        );

        setStatus(
          result.status
        );
      } catch (loadError) {
        console.error(
          "Failed to load report:",
          loadError
        );

        if (
          loadError instanceof Error
        ) {
          setError(
            loadError.message
          );
        } else {
          setError(
            "Failed to retrieve report."
          );
        }
      } finally {
        setLoading(false);
      }
    }, [
      publicId,
      acquireBeaconToken,
    ]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  /* ==========================================
     SAVE REPORT
     ========================================== */

  async function handleSubmit(
    event: SubmitEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!publicId) {
      return;
    }

    const trimmedSalesOrder =
      salesOrder.trim();

    if (!trimmedSalesOrder) {
      setError(
        "Sales Order is required."
      );

      setSuccess("");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const accessToken =
        await acquireBeaconToken();

      if (!accessToken) {
        return;
      }

      const updatedReport =
        await updateEmployeeReport({
          accessToken,
          publicId,
          salesOrder:
            trimmedSalesOrder,
          status,
        });

      setReport(updatedReport);

      setSalesOrder(
        updatedReport.salesOrder
      );

      setStatus(
        updatedReport.status
      );

      setSuccess(
        "Report updated successfully."
      );
    } catch (saveError) {
      console.error(
        "Failed to update report:",
        saveError
      );

      if (
        saveError instanceof Error
      ) {
        setError(
          saveError.message
        );
      } else {
        setError(
          "Failed to update report."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  /* ==========================================
     VIEW CUSTOMER REPORT
     ========================================== */

  function handleViewReport() {
    if (!report) {
      return;
    }

    const customerUrl =
      `${window.location.origin}/r/${report.publicId}`;

    window.open(
      customerUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* ==========================================
     PAGE
     ========================================== */

  return (
    <main className="edit-report-page">
      {/* HEADER */}

      <header className="edit-report-header">
        <div className="edit-report-header-content">
          <div className="edit-report-brand">
            <img
              src={abbLogo}
              alt="ABB"
              className="edit-report-logo"
            />

            <div>
              <p className="edit-report-eyebrow">
                Customer Test Report
              </p>

              <h1>
                Edit Report
              </h1>
            </div>
          </div>

          <button
            type="button"
            className="edit-report-back-button"
            onClick={() =>
              navigate(
                "/employee/reports"
              )
            }
          >
            ← Back to Reports
          </button>
        </div>
      </header>

      <div className="edit-report-content">
        {/* LOADING */}

        {loading && (
          <section className="edit-report-state">
            <div className="edit-report-loader" />

            <h2>
              Loading report
            </h2>

            <p>
              Retrieving report details.
            </p>
          </section>
        )}

        {/* LOAD ERROR */}

        {!loading &&
          error &&
          !report && (
            <section className="edit-report-state">
              <h2>
                Unable to load report
              </h2>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/employee/reports"
                  )
                }
              >
                Back to Reports
              </button>
            </section>
          )}

        {/* EDIT REPORT */}

        {!loading &&
          report && (
            <>
              <section className="edit-report-intro">
                <p className="edit-report-section-label">
                  Report Management
                </p>

                <h2>
                  Edit test report
                  <br />
                  information.
                </h2>

                <p>
                  Update administrative
                  information for this
                  published customer report.
                </p>
              </section>

              <section className="edit-report-card">
                {error && (
                  <div className="edit-report-error">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="edit-report-success">
                    {success}
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="edit-report-form"
                >
                  {/* DEVICE SERIAL */}

                  <div className="edit-report-field">
                    <label htmlFor="deviceSerial">
                      Device Serial
                    </label>

                    <input
                      id="deviceSerial"
                      type="text"
                      value={
                        report.deviceSerial
                      }
                      readOnly
                      disabled
                    />

                    <small>
                      Device Serial cannot be
                      changed because it
                      identifies the permanent
                      report and revision chain.
                    </small>
                  </div>

                  {/* SALES ORDER */}

                  <div className="edit-report-field">
                    <label htmlFor="salesOrder">
                      Sales Order
                    </label>

                    <input
                      id="salesOrder"
                      type="text"
                      value={salesOrder}
                      onChange={(event) =>
                        setSalesOrder(
                          event.target.value
                        )
                      }
                      required
                      disabled={saving}
                    />
                  </div>

                  {/* STATUS */}

                  <div className="edit-report-field">
                    <label htmlFor="reportStatus">
                      Status
                    </label>

                    <select
                      id="reportStatus"
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.currentTarget
                            .value as ReportStatus
                        )
                      }
                      disabled={saving}
                    >
                      <option value="Pass">
                        Pass
                      </option>

                      <option value="Fail">
                        Fail
                      </option>
                    </select>
                  </div>

                  {/* CURRENT PDF */}

                  <div className="edit-report-field">
                    <label htmlFor="filename">
                      Current PDF
                    </label>

                    <input
                      id="filename"
                      type="text"
                      value={
                        report.filename
                      }
                      readOnly
                      disabled
                    />
                  </div>

                  {/* PUBLIC ID */}

                  <div className="edit-report-field">
                    <label htmlFor="publicId">
                      Public Report ID
                    </label>

                    <input
                      id="publicId"
                      type="text"
                      value={
                        report.publicId
                      }
                      readOnly
                      disabled
                    />
                  </div>

                  {/* ACTIONS */}

                  <div className="edit-report-actions">
                    <button
                      type="button"
                      className="edit-report-secondary-button"
                      onClick={
                        handleViewReport
                      }
                      disabled={saving}
                    >
                      View Customer Report
                    </button>

                    <button
                      type="button"
                      className="edit-report-secondary-button"
                      onClick={() =>
                        navigate(
                          "/employee/reports"
                        )
                      }
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="edit-report-save-button"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}
      </div>

      <footer className="edit-report-footer">
        Customer Test Report · ABB Test Report
        Portal
      </footer>
    </main>
  );
}

export default EditReportPage;