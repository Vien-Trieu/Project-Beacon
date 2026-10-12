import { type ReactNode } from "react";
import {
    useIsAuthenticated,
    useMsal,
} from "@azure/msal-react";

import { loginRequest } from "../../auth/msalConfig";
import abbLogo from "../../assets/ABB_Logo.png";

type EmployeeAuthGateProps = {
    children: ReactNode;
};

function EmployeeAuthGate({
    children,
}: EmployeeAuthGateProps) {
    const isAuthenticated = useIsAuthenticated();
    const { instance } = useMsal();

    async function handleLogin() {
        await instance.loginRedirect(loginRequest);
    }

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <main>
            <img
                src = { abbLogo }
                alt="ABB"
                style={{width: "110px"}}
                />


                <h1>Project Beacon</h1>
                <h2>Employee Portal</h2>

                <p>Sign in with your ABB Microsoft account to continue.
                </p>

                <button
                    type="button"
                    onClick = { handleLogin }
                    >
                        Sign in with ABB 
                </button>
        </main>
    );
}

export default EmployeeAuthGate;