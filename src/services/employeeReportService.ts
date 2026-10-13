import { apiUrl } from "./apiClient";

export type EmployeeReport = {
  publicId: string;
  deviceSerial: string;
  salesOrder: string;
  status: "Pass" | "Fail";
  filename: string;
  createdAt: string;
};

type GetEmployeeReportsOptions = {
  accessToken: string;
  query?: string;
  status?: "" | "Pass" | "Fail";
};

type GetEmployeeReportsResponse = {
  reports: EmployeeReport[];
};

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