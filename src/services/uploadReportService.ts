import { apiUrl } from "./apiClient";

type UploadReportRequest = {
  deviceSerial: string;
  salesOrder: string;
  status: "Pass" | "Fail";
  file: File;
};

type UploadReportResponse = {
  publicId: string;
  publicUrl: string;
  message: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Could not read PDF"));
        return;
      }

      const base64 = result.split(",")[1];

      if (!base64) {
        reject(new Error("Could not convert PDF"));
        return;
      }

      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Could not read PDF"));
    };

    reader.readAsDataURL(file);
  });
}

export async function uploadEmployeeReport({
  deviceSerial,
  salesOrder,
  status,
  file,
}: UploadReportRequest): Promise<UploadReportResponse> {
  const fileContentBase64 = await fileToBase64(file);

  const response = await fetch(
    apiUrl("/api/employee/reports"),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceSerial,
        salesOrder,
        status,
        fileName: file.name,
        fileContentBase64,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorBody?.message ??
        "Failed to upload report"
    );
  }

  return response.json();
}