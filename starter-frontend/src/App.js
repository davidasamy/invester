import React from "react";
import { Routes, Route } from "react-router-dom"; 
import "bootstrap/dist/css/bootstrap.min.css";
//import Header from "./components/header";
//import Footer from "./components/footer";
import Homepage from "./pages/homepage";
import Profile from "./pages/profile";
import Stock from "./pages/stock";
import Header from "./components/header";
import "./App.css";
import axios from 'axios';


function App () {

  return (
    <>
     <Header />
      <div className="bg-pure-black">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/homepage" element={<Homepage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/stock" element={<Stock />} />
        </Routes>
      </div>
      
    </>
  );
}

export default App
