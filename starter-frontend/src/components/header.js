import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
    return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-black">
        {/* <img className="rising" src="rising.png"/> */}
        <div className="container">
            <ul style={{display: 'flex', listStyle: 'none', padding: 10, margin: 0}}>
                {/* <li className="nav-item" style={{marginRight: '20px'}}>
                    <Link className="nav-link" to="/homepage" 
                    style={{ textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.target.style.textDecoration = 'none'}>Home</Link>
                </li>
                <li className="nav-item">
                    <Link className="nav-link" to="/profile"
                    style={{ textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.target.style.textDecoration = 'none'}>About</Link>
                </li> */}
            </ul>
        </div>
    </nav>
    );
};

export default Header;