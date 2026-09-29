export type Report = {
  publicId: string;
  deviceSerial: string;
  salesOrder: string;
  status: "Pass" | "Fail";
  filename: string;
  pdfUrl: string;
};

export async function getPublicReport(
  publicId: string
): Promise<Report | null> {
  const response = await fetch(`/api/public/reports/${publicId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to load report");
  }

  return response.json();
}