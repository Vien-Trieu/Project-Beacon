import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  InteractionRequiredAuthError,
} from "@azure/msal-browser";

import { useMsal } from "@azure/msal-react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  beaconTokenRequest,
} from "../../auth/msalConfig";

import {
  deactivateEmployeeReport,
  getEmployeeReports,
  type EmployeeReport,
} from "../../services/employeeReportService";

import abbLogo from "../../assets/ABB_Logo.png";

import "../../styles/employee-reports.css";

type ReportStatusFilter =
  | ""
  | "Pass"
  | "Fail";

function ReportsPage() {
  const { instance, accounts } = useMsal();

  const navigate = useNavigate();

  const [searchParams, setSearchParams] =
    useSearchParams();

  const initialQuery =
    searchParams.get("q") ?? "";

  const initialStatusParam =
    searchParams.get("status");

  const initialStatus: ReportStatusFilter =
    initialStatusParam === "Pass" ||
    initialStatusParam === "Fail"
      ? initialStatusParam
      : "";

  const [searchQuery, setSearchQuery] =
    useState(initialQuery);

  const [statusFilter, setStatusFilter] =
    useState<ReportStatusFilter>(
      initialStatus
    );

  const [reports, setReports] =
    useState<EmployeeReport[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [copiedPublicId, setCopiedPublicId] =
    useState("");


  const [
    deactivatingPublicId,
    setDeactivatingPublicId,
  ] = useState("");
  const account = accounts[0];

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
     LOAD REPORTS
     ========================================== */

  const loadReports =
    useCallback(
      async (
        query: string,
        status: ReportStatusFilter
      ) => {
        try {
          setLoading(true);
          setError("");

          const accessToken =
            await acquireBeaconToken();

          if (!accessToken) {
            return;
          }

          const result =
            await getEmployeeReports({
              accessToken,
              query,
              status,
            });

          setReports(result);
        } catch (loadError) {
          console.error(
            "Failed to load reports:",
            loadError
          );

          if (
            loadError instanceof Error
          ) {
            setError(loadError.message);
          } else {
            setError(
              "Failed to retrieve reports."
            );
          }
        } finally {
          setLoading(false);
        }
      },
      [acquireBeaconToken]
    );

  /* ==========================================
     INITIAL LOAD
     ========================================== */

  useEffect(() => {
    void loadReports(
      initialQuery,
      initialStatus
    );
  }, [
    initialQuery,
    initialStatus,
    loadReports,
  ]);

  /* ==========================================
     SEARCH
     ========================================== */

  async function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const query =
      searchQuery.trim();

    const params =
      new URLSearchParams();

    if (query) {
      params.set("q", query);
    }

    if (statusFilter) {
      params.set(
        "status",
        statusFilter
      );
    }

    setSearchParams(params);

    await loadReports(
      query,
      statusFilter
    );
  }

  /* ==========================================
     CLEAR FILTERS
     ========================================== */

  async function handleClear() {
    setSearchQuery("");
    setStatusFilter("");

    setSearchParams({});

    await loadReports("", "");
  }

  /* ==========================================
     OPEN CUSTOMER REPORT
     ========================================== */

  function handleViewReport(
    publicId: string
  ) {
    const customerUrl =
      `${window.location.origin}/r/${publicId}`;

    window.open(
      customerUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* ==========================================
     COPY CUSTOMER LINK
     ========================================== */

  async function handleCopyLink(
    publicId: string
  ) {
    const customerUrl =
      `${window.location.origin}/r/${publicId}`;

    try {
      await navigator.clipboard.writeText(
        customerUrl
      );

      setCopiedPublicId(publicId);

      window.setTimeout(() => {
        setCopiedPublicId("");
      }, 2000);
    } catch (copyError) {
      console.error(
        "Failed to copy customer link:",
        copyError
      );

      setError(
        "Could not copy the customer link."
      );
    }
  }

  /* ==========================================
   EDIT REPORT
   ========================================== */

function handleEditReport(
  publicId: string
) {
  navigate(
    `/employee/reports/${encodeURIComponent(
      publicId
    )}/edit`
  );
}

/* ==========================================
   DEACTIVATE REPORT
   ========================================== */

async function handleDeactivateReport(
  report: EmployeeReport
) {
  const confirmed = window.confirm(
    `Deactivate report ${report.deviceSerial}?\n\n` +
      "The customer link will stop working, " +
      "but the report will remain available " +
      "in the database for audit/recovery."
  );

  if (!confirmed) {
    return;
  }

  try {
    setError("");
    setDeactivatingPublicId(
      report.publicId
    );

    const accessToken =
      await acquireBeaconToken();

    if (!accessToken) {
      return;
    }

    await deactivateEmployeeReport({
      accessToken,
      publicId: report.publicId,
    });

    /*
     * Remove it from the current table immediately.
     * The backend has already set active = false.
     */
    setReports((currentReports) =>
      currentReports.filter(
        (currentReport) =>
          currentReport.publicId !==
          report.publicId
      )
    );
  } catch (deactivateError) {
    console.error(
      "Failed to deactivate report:",
      deactivateError
    );

    if (
      deactivateError instanceof Error
    ) {
      setError(
        deactivateError.message
      );
    } else {
      setError(
        "Failed to deactivate report."
      );
    }
  } finally {
    setDeactivatingPublicId("");
  }
}

  /* ==========================================
     DATE FORMAT
     ========================================== */

  function formatCreatedDate(
    value: string
  ) {
    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "Unknown";
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    ).format(date);
  }

  return (
    <main className="reports-page">
      {/* HEADER */}
      <header className="reports-header">
        <div className="reports-header-content">
          <div className="reports-brand">
            <img
              src={abbLogo}
              alt="ABB"
              className="reports-logo"
            />

            <div>
              <p className="reports-eyebrow">
                Customer Test Report
              </p>

              <h1>Test Reports</h1>
            </div>
          </div>

          <div className="reports-header-actions">
            <button
              type="button"
              className="reports-secondary-button"
              onClick={() =>
                navigate("/employee")
              }
            >
              ← Dashboard
            </button>

            <button
              type="button"
              className="reports-upload-button"
              onClick={() =>
                navigate("/employee/upload")
              }
            >
              + Upload Report
            </button>
          </div>
        </div>
      </header>

      <div className="reports-content">
        {/* INTRO */}
        <section className="reports-intro">
          <p className="reports-section-label">
            Report Management
          </p>

          <h2>
            Find and manage
            <br />
            test reports.
          </h2>

          <p>
            Search Customer Test Report by device
            serial, sales order, filename,
            or report identifier.
          </p>
        </section>

        {/* SEARCH */}
        <section className="reports-search-card">
          <form
            className="reports-search-form"
            onSubmit={handleSearch}
          >
            <div className="reports-search-field">
              <label htmlFor="reportSearch">
                Search Reports
              </label>

              <input
                id="reportSearch"
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="Serial number, sales order, filename..."
              />
            </div>

            <div className="reports-status-field">
              <label htmlFor="statusFilter">
                Status
              </label>

              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as ReportStatusFilter
                  )
                }
              >
                <option value="">
                  All Statuses
                </option>

                <option value="Pass">
                  Pass
                </option>

                <option value="Fail">
                  Fail
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="reports-search-button"
              disabled={loading}
            >
              {loading
                ? "Searching..."
                : "Search"}
            </button>

            <button
              type="button"
              className="reports-clear-button"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </button>
          </form>
        </section>

        {/* ERROR */}
        {error && (
          <div className="reports-error">
            {error}
          </div>
        )}

        {/* RESULTS HEADER */}
        <section className="reports-results-heading">
          <div>
            <p className="reports-section-label">
              Results
            </p>

            <h3>
              Published Reports
            </h3>
          </div>

          {!loading && (
            <span className="reports-count">
              {reports.length}{" "}
              {reports.length === 1
                ? "report"
                : "reports"}
            </span>
          )}
        </section>

        {/* LOADING */}
        {loading && (
          <div className="reports-state-card">
            <div className="reports-loader" />

            <h3>
              Loading reports
            </h3>

            <p>
              Retrieving Customer Test Report
              report data.
            </p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading &&
          !error &&
          reports.length === 0 && (
            <div className="reports-state-card">
              <div className="reports-empty-icon">
                ⌕
              </div>

              <h3>
                No reports found
              </h3>

              <p>
                Try another serial number,
                sales order, filename, or
                status.
              </p>
            </div>
          )}

        {/* TABLE */}
        {!loading &&
          reports.length > 0 && (
            <div className="reports-table-card">
              <div className="reports-table-scroll">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>
                        Device Serial
                      </th>

                      <th>
                        Sales Order
                      </th>

                      <th>Status</th>

                      <th>Filename</th>

                      <th>
                        Uploaded
                      </th>

                      <th>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {reports.map(
                      (report) => (
                        <tr
                          key={
                            report.publicId
                          }
                        >
                          <td>
                            <strong>
                              {
                                report.deviceSerial
                              }
                            </strong>
                          </td>

                          <td>
                            {
                              report.salesOrder
                            }
                          </td>

                          <td>
                            <span
                              className={`reports-status reports-status-${report.status.toLowerCase()}`}
                            >
                              {
                                report.status
                              }
                            </span>
                          </td>

                          <td
                            className="reports-filename"
                            title={
                              report.filename
                            }
                          >
                            {
                              report.filename
                            }
                          </td>

                          <td>
                            {formatCreatedDate(
                              report.createdAt
                            )}
                          </td>

                          <td>
                            <div className="reports-row-actions">
                              <button
                                type="button"
                                className="reports-row-primary"
                                onClick={() =>
                                  handleViewReport(
                                    report.publicId
                                  )
                                }
                              >
                                View
                              </button>

                              <button
                                type="button"
                                className="reports-row-secondary"
                                onClick={() =>
                                  handleCopyLink(
                                    report.publicId
                                  )
                                }
                              >
                                {copiedPublicId ===
                                report.publicId
                                  ? "Copied!"
                                  : "Copy Link"}
                              </button>

                              <button
                                type="button"
                                className="reports-row-secondary"
                                onClick={() =>
                                  handleEditReport(
                                    report.publicId
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="reports-row-danger"
                                disabled={
                                  deactivatingPublicId ===
                                  report.publicId
                                }
                                onClick={() =>
                                  handleDeactivateReport(
                                    report
                                  )
                                }
                              >
                                {deactivatingPublicId ===
                                report.publicId
                                  ? "Deactivating..."
                                  : "Deactivate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
      </div>

      <footer className="reports-footer">
        Customer Test Report · ABB Test Report
        Portal
      </footer>
    </main>
  );
}

export default ReportsPage;