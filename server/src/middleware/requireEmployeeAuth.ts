import type { RequestHandler } from "express";
import {
    createRemoteJWKSet,
    jwtVerify,
} from "jose";

const tenantId = process.env.ENTRA_TENANT_ID;
const apiClientId = process.env.ENTRA_API_CLIENT_ID;
const employeePortalClientId = 
process.env.ENTRA_EMPLOYEE_PORTAL_CLIENT_ID;

if (
    !tenantId ||
    !apiClientId ||
    !employeePortalClientId
) {
    throw new Error(
        "Microsoft Entra backend configuration is missing"
    );
}

const issuer = 
  `https://login.microsoftonline.com/${tenantId}/v2.0`;

const jwks = createRemoteJWKSet(
    new URL(
        `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`
    )
);

export const requireEmployeeAuth: RequestHandler = 
    async (req, res, next) => {
        const authorization = 
            req.headers.authorization;
        
        if (
            !authorization ||
            !authorization.startsWith("Bearer ")
        ) {
            res.status(401).json({
                message: "Authentication Required",
            });
            return;
        }

        const token = authorization
            .slice("Bearer ".length)
            .trim();

        try {
            const { payload } = await jwtVerify(
                token,
                jwks,
                {
                    issuer,
                    audience: apiClientId,
                }
            );

            if (payload.tid !== tenantId) {
                res.status(403).json({
                    message: "Invalid tenant",
                });
                return;
            }

            const scopes = 
            typeof payload.scp === "string"
            ? payload.scp.split(" ")
            : [];

            if (!scopes.includes("access_as_user")) {
                res.status(403).json({
                    message: "Insufficient permissions"
                });
                return;
            }

            if (payload.azp !== employeePortalClientId) {
                res.status(403).json({
                    message: "Unauthorized client application",
                });
                return;
            }

            next();
        } catch (error) {
            console.error (
                "Employee token verification failed:",
                error instanceof Error
                ? error.message
                : error
            );

            res.status(401).json({
                message: "Invalid or expired access token",
            });
        }
    };