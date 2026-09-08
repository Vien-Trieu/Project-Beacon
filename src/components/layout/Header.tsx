import React from 'react';
import abbLogo from "../../assets/ABB_Logo.png";
const Header = () => {
    return (
        <header>
            <img
                src={abbLogo}
                alt="ABB"
                className="abb-logo"
            />
        </header>
    );
};

export default Header;