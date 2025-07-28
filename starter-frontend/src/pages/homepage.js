import React, { useState } from 'react';
import Stock from './stock';

const Homepage = () => {
  const [ticker, setTicker] = useState('');
  const [similarCompanies, setSimilarCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [curTickerData, setCurTickerData] = useState(null);
  /*const [curPeerTickerData, setCurPeerTickerData] = useState(null);*/

  const getFullStockDataSearch= async (e) => {
    if (e) e.preventDefault();

    const trimmedTicker = ticker.trim();
    if (!trimmedTicker) {
      setError('Please enter a stock ticker');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(false);
    setCurTickerData(null)
    

    try {
      const response = await fetch(`http://localhost:8000/value/${trimmedTicker.toUpperCase()}`);
      const data = await response.json();


      if (!response.ok) {
        throw new Error('Failed to fetch stock data from /value endpoint.');
      }
      const valuationResult = data.result; 
      setCurTickerData(valuationResult);
      let peers = valuationResult.peer_tickers;

      
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
      setError('Failed to fetch similar companies or stock data. Please check if the ticker is valid.');
      setSimilarCompanies([]);
      setCurTickerData(null);
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (e) => {
    setTicker(e.target.value);
    setError('');
  };

  // --- CORRECTED handleStockSelect FUNCTION ---
  const handleStockSelect = async (symbol) => { // 'symbol' is the ticker string from onClick
    console.log(`[handleStockSelect] Called for symbol: ${symbol}`); // Log 10
    setLoading(true);
    setError('');
    setSelectedStock(null);

    try {
      // Fetch the full detailed stock data object using the helper
      const response = await fetch(`http://localhost:8000/value/${symbol.toUpperCase()}`);
      const data = await response.json();


      if (!response.ok) {
        throw new Error('Failed to fetch stock data from /value endpoint.');
      }
      const valuationResult = data.result; 
      setSelectedStock(valuationResult);

    } catch (err) {
       setError(`Could not load full details for ${symbol}. Data not found.`);
      setSelectedStock(null);
    } finally {
      setLoading(false);
    }   
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

        <form onSubmit={getFullStockDataSearch} className="mb-5">
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
                <h3 className="display-5 text-white mb-2 text-center">{curTickerData.ticker}</h3>
                <p className="lead text-secondary text-center mb-4">{curTickerData.target_metrics.name}</p>
                <div className="row text-center">
                  <div className="col-md-6 mb-3">
                    <p className="mb-0 text-success fw-bold fs-4">{curTickerData.current_price}</p>
                    <p className="small text-muted mb-0">Current Price</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="mb-0 text-info fw-bold fs-4">N/A</p>
                    <p className="small text-muted mb-0">DCF (Discounted Cash Flow)</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="mb-0 text-white">{curTickerData.target_metrics.pe_ratio}</p>
                    <p className="small text-muted mb-0">P/E Ratio</p>
                  </div>
                  <div className="col-md-6 mb-3">
                    <p className="mb-0 text-white">{curTickerData.target_metrics.profit_margin}</p>
                    <p className="small text-muted mb-0">Profit Margin</p>
                  </div>
                </div>
                <div className="text-center mt-3">
                  <p className="mb-3 text-white">
                    <span className="text-secondary">Stock Overview Valuation:</span> {curTickerData.calculated_value_price}
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
                        className="list-group-item list-group-item-action bg-dark text-white border-secondary mb-2 card-hover-effect"
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
            <p className="text-secondary">Searching for data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;

/*
{
  "result": {
    "ticker": "AAPL",
    "analysis_date": "...",
    "current_price": 175.20,
    "calculated_value_price": 180.50,
    "price_difference": 5.30,
    "price_difference_percent": 3.02,
    "valuation_method": "Composite",
    "target_metrics": {  // <--- THIS IS WHERE YOUR FRONTEND EXPECTS THE STOCK DATA
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "market_cap": "2.7T",
      "pe_ratio": "28.5",
      "sector": "Technology",
      "currency": "USD",
      "current_price": 175.20 // Note: current_price is here and at top-level
      // ... potentially other metrics that 'get_essential_metrics' returns
    },
    "peer_tickers": ["MSFT", "GOOG"],
    "peer_count": 2,
    "peer_statistics": { ... },
    "valuation_components": { ... },
    "key_insights": "Apple Inc. (AAPL) continues to demonstrate strong brand loyalty..."
  }
}
  */