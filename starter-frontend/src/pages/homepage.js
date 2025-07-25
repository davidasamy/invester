import React, { useState } from 'react';
import Stock from './stock';


const Homepage = () => {
  const [ticker, setTicker] = useState('');
  const [similarCompanies, setSimilarCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  // NEW STATE: To manage which stock is selected for the detail page
  const [selectedStock, setSelectedStock] = useState(null);

  const searchSimilarCompanies = async (e) => {
    if (e) e.preventDefault();
    
    if (!ticker.trim()) {
      setError('Please enter a stock ticker');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(false);
    
    try {
      const response = await fetch(`http://localhost:8000/peers/${ticker.toUpperCase()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      // Parse the response - assuming your API returns peers as a string that needs to be parsed
      let peers = data.peers;
      
      // If peers is a string representation of a list, parse it
      if (typeof peers === 'string') {
        // Remove quotes and brackets, then split by comma
        peers = peers.replace(/[\[\]']/g, '').split(',').map(item => item.trim());
      }
      
      // Ensure we have an array and limit to 10 companies
      const companiesArray = Array.isArray(peers) ? peers.slice(0, 10) : [];
      
      setSimilarCompanies(companiesArray);
      setHasSearched(true);
    } catch (err) {
      setError('Failed to fetch similar companies. Please check if the ticker is valid.');
      setSimilarCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setTicker(e.target.value);
    setError('');
  };
  
 //funciton to get the stock clikced on
  const handleStockSelect = async (symbol) => {
    setLoading(true); // Optionally show a loading state while fetching detail data
    setError('');
    setSelectedStock(symbol); // Set the state, which triggers rendering of Stock component
   
  };

  // --- FUNCTION TO GO BACK TO HOMEPAGE ---
  const goBackToStocks = () => {
    setSelectedStock(null); // Clear the selected stock, returning to Homepage view
    setLoading(false); // Ensure the overall loading state is false
    setError(''); // Clear any general errors that might be displayed
    
  };

  if (selectedStock) {
    // If a stock is selected, render the Stock detail page
    return <Stock selectedStock={selectedStock} goBackToStocks={goBackToStocks} />;
  }

  return (
      // Replaced min-h-screen bg-black text-white p-6 with Bootstrap equivalents
      <div className="bg-pure-black text-white min-vh-100 py-5"> {/* bg-dark for black, text-white, min-vh-100 for full height, py-5 for padding */}
      <div className="container"> {/* Bootstrap container for centered content and max-width */}
        {/* Header Section */}
        <div className="text-center mb-5"> {/* text-center and mb-5 for margin-bottom */}
          {/* text-success for green, display-4 for large text, fw-bold for bold, mb-3 for margin */}
          <h1 className="text-success display-4 fw-bold mb-3">Stock Overflow</h1>
          {/* lead for slightly larger text, text-secondary for gray, mb-4 for margin */}
          <p className="lead text-secondary mb-4">
            Discover similar companies and learn more about investing
          </p>
        </div>

        {/* Search Section */}
        {/* Using a form for better accessibility and default submission handling */}
        <form onSubmit={searchSimilarCompanies} className="mb-5"> {/* mb-5 for margin-bottom */}
          <div className="mb-3"> {/* Bootstrap form group margin */}
            <label htmlFor="ticker" className="form-label text-white"> {/* form-label for proper styling */}
              Enter Stock Ticker Symbol
            </label>
            <div className="input-group"> {/* Bootstrap input group for input and button side-by-side */}
              <input
                type="text"
                id="ticker"
                value={ticker}
                onChange={handleInputChange}
                placeholder="e.g., AAPL, TSLA, MSFT"
                // form-control for input styling, bg-dark, border-secondary, text-white for dark theme
                className="form-control bg-dark border-secondary text-white placeholder-secondary"
                disabled={loading}
              />
              <button
                type="submit" // Use type="submit" for form submission
                onClick={searchSimilarCompanies}
                disabled={loading}
                className="btn btn-success" // btn and btn-success for green button
              >
                {loading ? (
                  <>
                    <span className="spinner-border bg-dark spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Searching...
                  </>
                ) : (
                  'Find Similar Companies'
                )}
              </button>
            </div>
          </div>

          {error && (
            // Bootstrap alert for error messages
            <div className="alert alert-danger mt-3" role="alert"> {/* mt-3 for margin-top */}
              {error}
            </div>
          )}
        </form>

        {/* Results Section */}
        {hasSearched && (
          // bg-white rounded shadow p-4 for white background, rounded corners, shadow, padding
          <div className="p-4 mb-4 rounded  border-secondary">
            {/* h4 for heading size, text-dark for black text, mb-4 for margin */}
            <div className="bg-custom-dark-grey text-white rounded p-3 mb-4 border border-secondary" onClick={() => handleStockSelect(ticker.toUpperCase())}>
            <h3 className="display-5 text-white mb-2 text-center">{ticker.toUpperCase()}</h3>
                  <p className="lead text-secondary text-center mb-4">full name</p> {/* Full Company Name */}
                  <div className="row text-center">
                    <div className="col-md-6 mb-3">
                      <p className="mb-0 text-success fw-bold fs-4">
                        price
                      </p>
                      <p className="small text-muted mb-0">Current Price</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <p className="mb-0 text-info fw-bold fs-4"> 'N/A'</p> {/* DCF */}
                      <p className="small text-muted mb-0">DCF (Discounted Cash Flow)</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <p className="mb-0 text-white">0</p> {/* P/E */}
                      <p className="small text-muted mb-0">P/E Ratio</p>
                    </div>
                     <div className="col-md-6 mb-3">
                      <p className="mb-0 text-white"> 5</p>
                      <p className="small text-muted mb-0">Profit Margin</p>
                    </div>
                  </div>
                  <div className="text-center mt-3">
                    <p className="mb-0 text-white"><span className="text-secondary">Stock Overview Valution:</span> hi</p>
                  </div>
            </div>

            {similarCompanies.length > 0 ? (
              // row and row-cols-* for responsive grid, g-3 for gutter
              <div className="row g-3">
                {similarCompanies.map((company, index) => (
                  <div key={index} className="col-12"> {/* col for grid item */}
                    {/* card for structure, h-100 to make cards same height, bg-light, border-light */}
                    <div className="card bg-dark border-secondary text-white card-hover-effect" onClick={() => handleStockSelect(company)}>
                      <div className="card-body d-flex justify-content-between align-items-center"> {/* card-body for padding inside card */}
                        <h5 className="card-title text-white mb-0">
                          {company}
                        </h5>
                        <p className="card-text text-secondary small mb-0"> {/* card-text, text-secondary, small for smaller text */}
                          Similar Company #{index + 1}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // text-center py-4 for centering and padding, lead for larger text, text-secondary for gray
              <div className="text-center py-4">
                <div className="lead text-secondary">
                  No similar companies found for {ticker.toUpperCase()}
                </div>
                <p className="text-muted mt-2"> {/* text-muted for lighter gray, mt-2 for margin */}
                  Try searching for a different ticker symbol
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          // bg-white rounded shadow p-4 text-center for styling
          <div className="bg-dark rounded shadow p-4 text-center mb-4">
            {/* Bootstrap spinner-border for spinner, text-primary for blue color, mb-3 */}
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span> {/* For accessibility */}
            </div>
            <p className="text-secondary">Searching for similar companies...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;