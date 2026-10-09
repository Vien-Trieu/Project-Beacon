import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import abbLogo from "../../assets/ABB_Logo.png";
import ReportViewer from "../../components/reports/ReportViewer";
import ReportNotFoundPage from "../errors/ReportNotFoundPage";

import {
  getPublicReport,
  type Report,
} from "../../services/reportService";

import "../../styles/report-page.css";

function ReportPage() {
  const { publicId } = useParams();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      if (!publicId) {
        setLoading(false);
        return;
      }

      try {
        const result = await getPublicReport(publicId);

        setReport(result);
      } catch {
        setError("Unable to load this report.");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [publicId]);

  if (loading) {
    return (
      <main className="report-loading">
        <div className="loading-card">
          <div className="loading-spinner" />
          <p>Loading test report...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="report-loading">
        <div className="loading-card">
          <h2>Unable to Load Report</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!report) {
    return <ReportNotFoundPage />;
  }

  return (
    <main className="report-page">
      <header className="report-header">
        <div className="report-header-content">
          <img
            src={abbLogo}
            alt="ABB"
            className="report-logo"
          />

          <div>
            <p className="report-eyebrow">
              Project Beacon
            </p>

            <h1>Test Report</h1>

            <p className="report-subtitle">
              Breaker testing documentation
            </p>
          </div>
        </div>
      </header>

      <section className="report-content">
        <div className="report-summary">
          <div className="report-summary-heading">
            <div>
              <h2>Report Information</h2>
              <p>
                Verified test report associated with this device.
              </p>
            </div>

            <span
              className={`status-badge ${
                report.status === "Pass"
                  ? "status-pass"
                  : "status-fail"
              }`}
            >
              {report.status}
            </span>
          </div>

          <div className="report-details">
            <div className="detail-card">
              <span className="detail-label">
                Device Serial
              </span>

              <strong>{report.deviceSerial}</strong>
            </div>

            <div className="detail-card">
              <span className="detail-label">
                Sales Order
              </span>

              <strong>{report.salesOrder}</strong>
            </div>

            <div className="detail-card">
              <span className="detail-label">
                File Name
              </span>

              <strong>{report.filename}</strong>
            </div>
          </div>
        </div>

        <section className="report-document">
          <div className="document-heading">
            <div>
              <h2>Test Report Document</h2>
              <p>
                View or download the official test report below.
              </p>
            </div>

            <a
              href={report.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="download-button"
            >
              Download PDF
            </a>
          </div>

          <div className="pdf-container">
            <ReportViewer
              pdfUrl={report.pdfUrl}
              fileName={report.filename}
            />
          </div>
        </section>
      </section>

      <footer className="report-footer">
        <p>
          ABB Inc. • Project Beacon
        </p>
      </footer>
    </main>
  );
}

export default ReportPage;