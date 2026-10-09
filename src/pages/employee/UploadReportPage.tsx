import { useState, type SyntheticEvent } from "react";
import { uploadEmployeeReport } from "../../services/uploadReportService";

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
    <main>
      <h1>Upload Test Report</h1>

      <form onSubmit={handleSubmit}>
        <div>
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
            required
          />
        </div>

        <div>
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
            required
          />
        </div>

        <div>
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

        <div>
          <label htmlFor="pdfFile">
            PDF File
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
        </div>

        <button
          type="submit"
          disabled={uploading}
        >
          {uploading
            ? "Uploading..."
            : "Upload Report"}
        </button>
      </form>

      {error && <p>{error}</p>}

      {publicUrl && (
        <div>
          <h2>
            Report Uploaded Successfully
          </h2>

          <p>Customer URL:</p>

          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
          >
            {publicUrl}
          </a>
        </div>
      )}
    </main>
  );
}

export default UploadReportPage;