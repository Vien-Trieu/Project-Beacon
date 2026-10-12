import type {
  Configuration,
  RedirectRequest,
} from "@azure/msal-browser";

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID;
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID;
const beaconApiScope = import.meta.env.VITE_BEACON_API_SCOPE;

if (!clientId || !tenantId || !beaconApiScope) {
  throw new Error(
    "Microsoft Entra configuration is missing"
  );
}

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },

  cache: {
    cacheLocation: "sessionStorage",
  },
};

export const loginRequest: RedirectRequest = {
  scopes: [
    "openid",
    "profile",
    "email",
    beaconApiScope,
  ],
};

export const beaconTokenRequest = {
  scopes: [beaconApiScope],
};