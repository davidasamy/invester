// StockDetailPage.jsx
import React from 'react';


// Placeholder for Button and ArrowLeft.
// In a real app, you'd import these from your UI library (e.g., Shadcn UI, Lucide React)
const Button = ({ children, onClick, className }) => (
  <button className={`btn ${className}`} onClick={onClick}>{children}</button>
);
const ArrowLeft = ({ className }) => <span className={`bi bi-arrow-left ${className}`}></span>; // Bootstrap icon placeholder

const getIconComponent = (iconName) => {
  switch (iconName) {
    case 'ArrowUp': return ArrowUp;
    case 'ArrowDown': return ArrowDown;
    case 'Minus': return Minus;
    default: return Minus;
  }
};

// Placeholder for ArrowUp, ArrowDown, Minus if not imported from Lucide React
const ArrowUp = ({ className }) => <span className={`bi bi-arrow-up-circle-fill ${className}`}></span>;
const ArrowDown = ({ className }) => <span className={`bi bi-arrow-down-circle-fill ${className}`}></span>;
const Minus = ({ className }) => <span className={`bi bi-dash-circle-fill ${className}`}></span>;


const Stock = ({ selectedStock, goBackToStocks }) => {
  if (!selectedStock) {
    return (
      <div className="bg-pure-black text-white min-vh-100 py-5 text-center">
        <div className="container">
          <p className="lead text-secondary">No stock selected. Please go back to the main page.</p>
          <Button onClick= {goBackToStocks} className="btn btn-secondary mt-3">
            Back to Stocks
          </Button>
        </div>
      </div>
    );
  }

 
  //const IconComponent = getIconComponent(valuation.icon);

  return (
    <div className="bg-pure-black text-white min-vh-100 py-5">
      <div className="container">
        {/* Header Section - Reusing from Homepage for consistency */}
        <header className="text-center mb-5">
          <h1 className="text-success display-4 fw-bold mb-3">Stock Overflow</h1>
          {/* Navigation can be simplified or removed if this is a dedicated detail page */}
          {/* For now, keeping it minimal as per screenshot */}
        </header>

        {/* Back Button */}
        <Button
          onClick={goBackToStocks}
          className="btn btn-link text-secondary mb-4 d-flex align-items-center" // btn-link for subtle button, d-flex for icon alignment
        >
          <ArrowLeft className="me-2" /> {/* me-2 for margin-right */}
          Back to stocks
        </Button>
        
        {/* Main Stock Details Card */}
        <div className="bg-custom-dark-grey rounded p-4 mb-4"> {/* Using bg-custom-dark-grey for the main card */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 className="text-white mb-1 display-5">symbol</h2> {/* display-5 for larger symbol */}
              <h3 className="text-secondary h5 mb-0">name</h3> {/* h5 for name */}
            </div>
            <div className="text-end">
              <p className="text-white fs-4 mb-0"> Price</p> {/* fs-4 for larger price */}
              <p> nums
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="row row-cols-1 row-cols-md-3 g-4 mb-4"> {/* g-4 for larger gutter */}
            <div className="col">
              <div className="bg-dark rounded p-3 h-100"> {/* bg-dark for inner cards, h-100 for equal height */}
                <h4 className="text-secondary small mb-2">Current Price</h4>
                <p className="text-white fs-5"> 'N/A'</p> {/* fs-5 for larger text */}
              </div>
            </div>
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">DCF Analysis</h4>
                <p className="text-white fs-5"> 'N/A'</p> {/* Using selectedStock.dcf */}
              </div>
            </div>
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">Our Evaluation</h4>
                <p className="text-white fs-5"> 'N/A'</p>
              </div>
            </div>
          </div>

          {/* Valuation Assessment Section */}
          <div className="bg-dark rounded p-4 mb-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <h1> overvalued or undervalued</h1>
            </div>
          </div>

          {/* Analysis & Explanation Section */}
          <div className="bg-dark rounded p-4 mb-4">
            <h4 className="text-white h5 mb-3">Analysis &amp; Explanation</h4>
            <p className="text-secondary small"> 'Analysis not available.'</p>
          </div>

          {/* Additional Metrics Grid */}
          <div className="row row-cols-1 row-cols-md-2 g-4 mt-4">
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">P/E Ratio</h4>
                <p className="text-white fs-5"> 'N/A'</p> {/* Using selectedStock.peRatio */}
              </div>
            </div>
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">Price Change (24h)</h4>
                <p> 5</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stock;