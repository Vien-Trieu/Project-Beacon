export type ReportStatus = "Pass" | "Fail";

export interface Report {
  id: number;
  publicId: string;
  deviceSerial: string;
  salesOrder: string | null;
  status: ReportStatus;
  filename: string;
  blobPath: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}