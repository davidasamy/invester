import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {

    return(
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <li className="nav-item">
                <Link className="nav-link" to="/homepage" style={{ color: 'green' }}>Homepage</Link>
                <Link className="nav-link" to="/profile" style={{ color: 'green' }}>Profile</Link>
            </li>
            </div>
        </nav>
        );
};

export default Header;