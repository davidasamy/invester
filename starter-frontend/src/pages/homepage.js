import React, { useState } from 'react';
import Stock from './stock';

const Homepage = () => {
  const [ticker, setTicker] = useState('');
  const [similarCompanies, setSimilarCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

  const searchSimilarCompanies = async (e) => {
    if (e) e.preventDefault();

    const trimmedTicker = ticker.trim();
    if (!trimmedTicker) {
      setError('Please enter a stock ticker');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(false);

    try {
      const response = await fetch(`http://localhost:8000/peers/${trimmedTicker.toUpperCase()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      let peers = data.peers;
      if (typeof peers === 'string') {
        peers = peers.replace(/[\[\]']/g, '').split(',').map(item => item.trim());
      }

      const companiesArray = Array.isArray(peers) ? peers.slice(0, 10) : [];
      const filteredCompanies = companiesArray
        .filter(company => company.toUpperCase() !== trimmedTicker.toUpperCase())
        .slice(0, 5);

      setSimilarCompanies(filteredCompanies);
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

  const handleStockSelect = (symbol) => {
    setLoading(true);
    setError('');
    setSelectedStock(symbol);
  };

  const goBackToStocks = () => {
    setSelectedStock(null);
    setLoading(false);
    setError('');
  };

  if (selectedStock) {
    return <Stock selectedStock={selectedStock} goBackToStocks={goBackToStocks} />;
  }

  return (
    <div className="bg-pure-black text-white min-vh-100 py-5">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="text-success display-4 fw-bold mb-3">Stock Overflow</h1>
          <p className="lead text-secondary mb-4">
            Discover similar companies and learn more about investing
          </p>
        </div>

        <form onSubmit={searchSimilarCompanies} className="mb-5">
          <div className="mb-3">
            <label htmlFor="ticker" className="form-label text-white">
              Enter Stock Ticker Symbol
            </label>
            <div className="input-group">
              <input
                type="text"
                id="ticker"
                value={ticker}
                onChange={handleInputChange}
                placeholder="e.g., AAPL, TSLA, MSFT"
                className="form-control bg-dark border-secondary text-white placeholder-secondary"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn btn-success"
              >
                {loading ? (
                  <>
                    <span className="spinner-border bg-dark spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Searching...
                  </>
                ) : (
                  'Find Stocks'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              {error}
            </div>
          )}
        </form>

        {hasSearched && (
          <div className="row g-4">
            {/* Stock Info (Left) */}
            <div className="col-md-8">
              <div className="bg-custom-dark-grey text-white rounded p-4 border border-secondary">
                <h3 className="display-5 text-white mb-2 text-center">{ticker.toUpperCase()}</h3>
                <p className="lead text-secondary text-center mb-4">Full Name</p>
                <div className="row text-center">
                  <div className="col-md-6 mb-3">
                    <p className="mb-0 text-success fw-bold fs-4">price</p>
                    <p className="small text-muted mb-0">Current Price</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="mb-0 text-info fw-bold fs-4">N/A</p>
                    <p className="small text-muted mb-0">DCF (Discounted Cash Flow)</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="mb-0 text-white">0</p>
                    <p className="small text-muted mb-0">P/E Ratio</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="mb-0 text-white">5</p>
                    <p className="small text-muted mb-0">Profit Margin</p>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="mb-3 text-white">
                    <span className="text-secondary">Stock Overview Valuation:</span> hi
                  </p>
                  <button
                    className="btn btn-outline-success"
                    onClick={() => handleStockSelect(ticker.toUpperCase())}
                  >
                    View Full Info
                  </button>
                </div>
              </div>
            </div>

            {/* Similar Companies (Right) */}
            <div className="col-md-4">
              <div className="bg-dark border border-secondary rounded p-3">
                <h5 className="text-white mb-3 text-center">Similar Companies</h5>
                {similarCompanies.length > 0 ? (
                  <div className="list-group">
                    {similarCompanies.map((company, index) => (
                      <button
                        key={index}
                        onClick={() => handleStockSelect(company)}
                        className="list-group-item list-group-item-action bg-dark text-white border-secondary mb-2"
                      >
                        {company} <span className="text-muted float-end">#{index + 1}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary text-center">
                    No similar companies found.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-dark rounded shadow p-4 text-center mb-4">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary">Searching for similar companies...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;