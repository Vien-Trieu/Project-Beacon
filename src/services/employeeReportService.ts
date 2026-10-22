import { apiUrl } from "./apiClient";

export type EmployeeReport = {
  publicId: string;
  deviceSerial: string;
  salesOrder: string;
  status: "Pass" | "Fail";
  filename: string;
  createdAt: string;
  updatedAt?: string;
};

type GetEmployeeReportsOptions = {
  accessToken: string;
  query?: string;
  status?: "" | "Pass" | "Fail";
};

type GetEmployeeReportsResponse = {
  reports: EmployeeReport[];
};

type GetEmployeeReportResponse = {
  report: EmployeeReport;
};

type UpdateEmployeeReportOptions = {
  accessToken: string;
  publicId: string;
  salesOrder: string;
  status: "Pass" | "Fail";
};

type UpdateEmployeeReportResponse = {
  report: EmployeeReport;
  message: string;
};

type DeactivateEmployeeReportOptions = {
  accessToken: string;
  publicId: string;
};

type DeactivateEmployeeReportResponse = {
  publicId: string;
  message: string;
};

/* =========================================================
   GET ALL EMPLOYEE REPORTS
   ========================================================= */

export async function getEmployeeReports({
  accessToken,
  query = "",
  status = "",
}: GetEmployeeReportsOptions): Promise<EmployeeReport[]> {
  const params = new URLSearchParams();

  const trimmedQuery = query.trim();

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  if (status) {
    params.set("status", status);
  }

  const queryString = params.toString();

  const endpoint = queryString
    ? `/api/employee/reports?${queryString}`
    : "/api/employee/reports";

  const response = await fetch(
    apiUrl(endpoint),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorBody?.message ??
        "Failed to retrieve reports"
    );
  }

  const data =
    (await response.json()) as GetEmployeeReportsResponse;

  return data.reports;
}

/* =========================================================
   GET SINGLE EMPLOYEE REPORT
   ========================================================= */

export async function getEmployeeReport(
  accessToken: string,
  publicId: string
): Promise<EmployeeReport> {
  const response = await fetch(
    apiUrl(
      `/api/employee/reports/${encodeURIComponent(
        publicId
      )}`
    ),
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorBody?.message ??
        "Failed to retrieve report"
    );
  }

  const data =
    (await response.json()) as GetEmployeeReportResponse;

  return data.report;
}

/* =========================================================
   UPDATE EMPLOYEE REPORT
   ========================================================= */

export async function updateEmployeeReport({
  accessToken,
  publicId,
  salesOrder,
  status,
}: UpdateEmployeeReportOptions): Promise<EmployeeReport> {
  const response = await fetch(
    apiUrl(
      `/api/employee/reports/${encodeURIComponent(
        publicId
      )}`
    ),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        salesOrder: salesOrder.trim(),
        status,
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorBody?.message ??
        "Failed to update report"
    );
  }

  const data =
    (await response.json()) as UpdateEmployeeReportResponse;

  return data.report;
}

/* =========================================================
   DEACTIVATE EMPLOYEE REPORT
   ========================================================= */

export async function deactivateEmployeeReport({
  accessToken,
  publicId,
}: DeactivateEmployeeReportOptions): Promise<string> {
  const response = await fetch(
    apiUrl(
      `/api/employee/reports/${encodeURIComponent(
        publicId
      )}/deactivate`
    ),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => null);

    throw new Error(
      errorBody?.message ??
        "Failed to deactivate report"
    );
  }

  const data =
    (await response.json()) as DeactivateEmployeeReportResponse;

  return data.message;
}