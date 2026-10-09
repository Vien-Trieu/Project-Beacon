import { useState, type SyntheticEvent } from "react";
import { uploadEmployeeReport } from "../../services/uploadReportService";
import abbLogo from "../../assets/ABB_Logo.png";
import "../../styles/employee-upload.css";

function UploadReportPage() {
  const [deviceSerial, setDeviceSerial] = useState("");
  const [salesOrder, setSalesOrder] = useState("");
  const [status, setStatus] = useState<"Pass" | "Fail">("Pass");
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [publicUrl, setPublicUrl] = useState("");

  async function handleSubmit(
    event: SyntheticEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setPublicUrl("");

      const result = await uploadEmployeeReport({
        deviceSerial,
        salesOrder,
        status,
        file,
      });

      setPublicUrl(result.publicUrl);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to upload report.");
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="upload-page">
      <header className="upload-header">
        <div className="upload-header-content">
          <img
            src={abbLogo}
            alt="ABB"
            className="upload-logo"
          />

          <div>
            <p className="upload-eyebrow">
              Project Beacon
            </p>

            <h1>Employee Portal</h1>

            <p className="upload-subtitle">
              Manual test report upload
            </p>
          </div>
        </div>
      </header>

      <section className="upload-content">
        <div className="upload-card">
          <div className="upload-card-heading">
            <h2>Upload Test Report</h2>

            <p>
              Enter the report information and select the finalized PDF.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="upload-form"
          >
            <div className="upload-form-grid">
              <div className="upload-field">
                <label htmlFor="deviceSerial">
                  Device Serial
                </label>

                <input
                  id="deviceSerial"
                  type="text"
                  value={deviceSerial}
                  onChange={(event) =>
                    setDeviceSerial(event.target.value)
                  }
                  placeholder="Enter device serial"
                  required
                />
              </div>

              <div className="upload-field">
                <label htmlFor="salesOrder">
                  Sales Order
                </label>

                <input
                  id="salesOrder"
                  type="text"
                  value={salesOrder}
                  onChange={(event) =>
                    setSalesOrder(event.target.value)
                  }
                  placeholder="Enter sales order"
                  required
                />
              </div>
            </div>

            <div className="upload-field">
              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as "Pass" | "Fail"
                  )
                }
              >
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
              </select>
            </div>

            <div className="upload-field">
              <label htmlFor="pdfFile">
                Test Report PDF
              </label>

              <input
                id="pdfFile"
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const selectedFile =
                    event.target.files?.[0] ?? null;

                  setFile(selectedFile);
                }}
                required
              />

              {file && (
                <p className="selected-file">
                  Selected: {file.name}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="upload-button"
              disabled={uploading}
            >
              {uploading
                ? "Uploading Report..."
                : "Upload Report"}
            </button>
          </form>

          {error && (
            <div className="upload-message upload-error">
              {error}
            </div>
          )}

          {publicUrl && (
            <div className="upload-message upload-success">
              <h3>Report Uploaded Successfully</h3>

              <p>
                The customer report is ready.
              </p>

              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open Customer Report
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default UploadReportPage;