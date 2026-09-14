import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import abbLogo from "../../assets/ABB_Logo.png";
import ReportViewer from "../../components/reports/ReportViewer";
import {
  getPublicReport,
  type Report,
} from "../../services/reportService";
import ReportNotFoundPage from "../errors/ReportNotFoundPage";

function ReportPage() {
  const { publicId } = useParams();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      if (!publicId) {
        setLoading(false);
        return;
      }

      const result = await getPublicReport(publicId);

      setReport(result);
      setLoading(false);
    }

    loadReport();
  }, [publicId]);

  if (loading) {
    return <p>Loading report...</p>;
  }

if (!report) {
  return <ReportNotFoundPage />;
}

  return (
    <main>
      <header>
        <img
          src={abbLogo}
          alt="ABB"
          className="abb-logo"
        />
        <h1>Testing Report</h1>
      </header>

      <p>Device Serial: {report.deviceSerial}</p>
      <p>Sales Order: {report.salesOrder}</p>
      <p>Status: {report.status}</p>
      <p>Filename: {report.filename}</p>

      <ReportViewer
        pdfUrl={report.pdfUrl}
        fileName={report.filename}
      />
    </main>
  );
}

export default ReportPage;