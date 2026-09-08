import {useParams} from "react-router-dom";
import abbLogo from "../../assets/ABB_Logo.png";
import ReportViewer from "../../components/reports/reportViewer";


function ReportPage() {
    const { publicId } = useParams();

    const report = {
    publicId,
    deviceSerial: "EMAX-001",
    salesOrder: "SO-12345",
    status: "Pass",
    filename: "Emax2 LV CB Test Report.pdf",
    pdfUrl: "/Emax2 LV CB Test Report.pdf",
    };


    return (
        <main> 
            <header> <img src={abbLogo} alt="ABB" className="abb-logo"/>
            <h1>Testing Report</h1>
            </header>

            <p>Report ID: {report.publicId}</p>
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