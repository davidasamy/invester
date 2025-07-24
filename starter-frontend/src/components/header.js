import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {

    return(
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <li className="nav-item">
                <Link className="nav-link text-success" to="/homepage" >Homepage</Link>
                <Link className="nav-link text-success" to="/profile">About</Link>
            </li>
            </div>
        </nav>
        );
};

export default Header;