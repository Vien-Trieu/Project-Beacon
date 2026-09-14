export type Report = {
  publicId: string;
  deviceSerial: string;
  salesOrder: string;
  status: "Pass" | "Fail";
  filename: string;
  pdfUrl: string;
};

const mockReports: Record<string, Report> = {
  abc: {
    publicId: "abc",
    deviceSerial: "EMAX-001",
    salesOrder: "SO-12345",
    status: "Pass",
    filename: "Emax2 LV CB Test Report.pdf",
    pdfUrl: "/Emax2 LV CB Test Report.pdf",
  },
};

export async function getPublicReport(
  publicId: string
): Promise<Report | null> {
  return mockReports[publicId] ?? null;
}