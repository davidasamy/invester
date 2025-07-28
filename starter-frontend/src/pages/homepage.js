import React, { useState, useCallback, useMemo } from 'react';
import Stock from './stock';

const API_BASE_URL = 'http://localhost:8000';
const MAX_SIMILAR_COMPANIES = 5;

const Homepage = () => {
  const [ticker, setTicker] = useState('');
  const [similarCompanies, setSimilarCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [curTickerData, setCurTickerData] = useState(null);
  // New state to cache all fetched stock data
  const [stockDataCache, setStockDataCache] = useState({});

  // Memoized helper function to fetch stock data
  const fetchStockData = useCallback(async (symbol) => {
    const upperSymbol = symbol.toUpperCase();
    
    // Check if we already have this data cached
    if (stockDataCache[upperSymbol]) {
      return stockDataCache[upperSymbol];
    }

    const response = await fetch(`${API_BASE_URL}/value/${upperSymbol}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch stock data for ${symbol}`);
    }

    // Cache the result
    setStockDataCache(prev => ({
      ...prev,
      [upperSymbol]: data.result
    }));

    return data.result;
  }, [stockDataCache]);

  // Memoized helper to process peer tickers
  const processPeerTickers = useCallback((peers, excludeTicker) => {
    if (typeof peers === 'string') {
      peers = peers.replace(/[\[\]']/g, '').split(',').map(item => item.trim());
    }
    
    const companiesArray = Array.isArray(peers) ? peers : [];
    return companiesArray
      .filter(company => company.toUpperCase() !== excludeTicker.toUpperCase())
      .slice(0, MAX_SIMILAR_COMPANIES);
  }, []);

  const getFullStockDataSearch = useCallback(async (e) => {
    if (e) e.preventDefault();

    const trimmedTicker = ticker.trim();
    if (!trimmedTicker) {
      setError('Please enter a stock ticker');
      return;
    }

    setLoading(true);
    setError('');
    setHasSearched(false);
    setCurTickerData(null);

    try {
      const valuationResult = await fetchStockData(trimmedTicker);
      setCurTickerData(valuationResult);
      
      const filteredCompanies = processPeerTickers(valuationResult.peer_tickers, trimmedTicker);
      setSimilarCompanies(filteredCompanies);
      setHasSearched(true);

    } catch (err) {
      setError('Failed to fetch stock data. Please check if the ticker is valid.');
      setSimilarCompanies([]);
      setCurTickerData(null);
    } finally {
      setLoading(false);
    }
  }, [ticker, fetchStockData, processPeerTickers]);

  const handleInputChange = useCallback((e) => {
    setTicker(e.target.value);
    setError('');
  }, []);

  const handleStockSelect = useCallback(async (symbol) => {
    const upperSymbol = symbol.toUpperCase();
    
    // Check if we already have this data cached (no API call needed)
    if (stockDataCache[upperSymbol]) {
      setSelectedStock(stockDataCache[upperSymbol]);
      return;
    }

    // Only make API call if data is not cached
    setLoading(true);
    setError('');
    setSelectedStock(null);

    try {
      const stockData = await fetchStockData(symbol);
      setSelectedStock(stockData);
    } catch (err) {
      setError(`Could not load details for ${symbol}. Data not found.`);
      setSelectedStock(null);
    } finally {
      setLoading(false);
    }
  }, [stockDataCache, fetchStockData]);

  const goBackToStocks = useCallback(() => {
    setSelectedStock(null);
    setLoading(false);
    setError('');
  }, []);

  // Memoized components for better performance
  const stockMetrics = useMemo(() => {
    if (!curTickerData) return null;
    console.log(curTickerData);
    const { target_metrics } = curTickerData;
    return (
      <div className="row text-center">
        <div className="col-md-6 mb-3">
          <p className="mb-0 stock-green fw-bold fs-4">{curTickerData.current_price.toFixed(2)}</p>
          <p className="small metric-desc mb-0">Current Price</p>
        </div>
        <div className="col-md-6 mb-3">
        <p className="mb-0 stock-green fw-bold fs-4">{curTickerData.dcf_price["Intrinsic Value Per Share"].toFixed(2)}</p>
          <p className="small metric-desc mb-0">DCF (Discounted Cash Flow)</p>
        </div>
        <div className="col-md-6 mb-3">
          <p className="mb-0 stock-green fw-bold fs-4">{target_metrics.pe_ratio.toFixed(2)}</p>
          <p className="small metric-desc mb-0">P/E Ratio</p>
        </div>
        <div className="col-md-6 mb-3">
          <p className="mb-0 stock-green fw-bold fs-4">{target_metrics.profit_margin.toFixed(2)}</p>
          <p className="small metric-desc mb-0">Profit Margin</p>
        </div>
      </div>
    );
  }, [curTickerData]);

  const similarCompaniesList = useMemo(() => (
    similarCompanies.length > 0 ? (
      <div className="list-group">
        {similarCompanies.map((company, index) => (
          <button
            key={company}
            onClick={() => handleStockSelect(company)}
            className="list-group-item list-group-item-action bg-dark text-white border-secondary mb-2"
          >
            {company} <span className="metric-desc float-end">#{index + 1}</span>
          </button>
        ))}
      </div>
    ) : (
      <p className="text-secondary text-center">No similar companies found.</p>
    )
  ), [similarCompanies, handleStockSelect]);

  if (selectedStock) {
    return <Stock selectedStock={selectedStock} goBackToStocks={goBackToStocks} />;
  }

  return (
    <div className="bg-pure-black text-white min-vh-100 py-5">
        {/* <img className="rising" src="rising.png"/> */}
      <div className="container">
        {/* Header */}

        <div className="text-center">
          
          <h1 className="stock-green display-4 fw-bold mb-3">Stock Overflow</h1> 
          <p className="lead text-secondary mb-4">
            AI-Powered Investing for Everyone.
          </p>
        </div>

        {/* Search Form */}
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
                disabled={loading || !ticker.trim()}
                className="btn green-button"
              >
                {loading ? (
                  <>
                    <span className="spinner-border bg-dark spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Searching...
                  </>
                ) : (
                  'Valuate'
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

        {/* Loading State */}
        {loading && (
          <div className="bg-dark rounded shadow p-4 text-center mb-4">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary">Sending AI-Agents...</p>
          </div>
        )}

        {/* Results */}
        {hasSearched && curTickerData && (
          <div className="row g-4">
            {/* Stock Info */}
            <div className="col-md-8">
              <div className="bg-custom-dark-grey text-white rounded p-4 border border-secondary">
                <p className="lead text-secondary text-center mb-4">
                  {curTickerData.target_metrics.full_name}
                </p>
                
                {stockMetrics}
                
                <div className="text-center mt-3">
                  <p className="lead mb-3 text-white">
                    <span className=" text-main">Stock Overflow Valuation:</span>{' '}
                <h3 className="display-5 text-white mb-2 fw-bold text-center">
                ${curTickerData.calculated_value_price.toFixed(2)}
                </h3>
                    
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

            {/* Similar Companies */}
            <div className="col-md-4">
              <div className="bg-dark border border-secondary rounded p-3">
                <h5 className="text-white mb-3 text-center">Similar Companies</h5>
                {similarCompaniesList}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;