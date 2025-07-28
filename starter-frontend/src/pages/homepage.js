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

  // Helper function to determine metric color based on value and type
  const getMetricColor = useCallback((metricType, value) => {
    if (value === null || value === undefined) return 'text-secondary';
    
    switch (metricType) {
      case 'pe_ratio':
        // Good P/E: 10-25, Decent: 5-10 or 25-35, Poor: <5 or >35
        if (value >= 10 && value <= 25) return 'text-success'; // Green - Good
        if ((value >= 5 && value < 10) || (value > 25 && value <= 35)) return 'text-warning'; // Yellow - Decent
        return 'text-danger'; // Red - Poor
        
      case 'profit_margin':
        // Convert to percentage if it's a decimal
        const margin = value > 1 ? value : value * 100;
        // Good: >15%, Decent: 5-15%, Poor: <5%
        if (margin >= 15) return 'text-success';
        if (margin >= 5) return 'text-warning';
        return 'text-danger';
        
      case 'price_comparison':
        // Compare current price vs calculated value
        // This would need the calculated value to determine if stock is undervalued/overvalued
        return 'stock-green'; // Default to your existing green
        
      case 'dcf':
        // DCF is typically just informational
        return 'stock-green'; // Default to your existing green
        
      default:
        return 'stock-green'; // Default to your existing green
    }
  }, []);

  // Helper function to get metric description with color context
  const getMetricDescription = useCallback((metricType, value) => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (metricType) {
      case 'pe_ratio':
        if (value >= 10 && value <= 25) return 'Good P/E Ratio';
        if ((value >= 5 && value < 10) || (value > 25 && value <= 35)) return 'Moderate P/E Ratio';
        return value < 5 ? 'Very Low P/E Ratio' : 'High P/E Ratio';
        
      case 'profit_margin':
        const margin = value > 1 ? value : value * 100;
        if (margin >= 15) return 'Strong Profit Margin';
        if (margin >= 5) return 'Moderate Profit Margin';
        return 'Low Profit Margin';
        
      default:
        return '';
    }
  }, []);

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

  // Memoized components for better performance with color coding
  const stockMetrics = useMemo(() => {
    if (!curTickerData) return null;
    console.log(curTickerData);
    const { target_metrics } = curTickerData;
    
    return (
      <div className="row text-center">
        <div className="col-6 col-md-3 mb-4">
          <div className="p-3 rounded-3" style={{background: 'rgba(255, 255, 255, 0.02)'}}>
            <p className={`mb-1 fw-bold ${getMetricColor('price_comparison', curTickerData.current_price)}`} style={{fontSize: '1.4rem'}}>
              ${curTickerData.current_price.toFixed(2)}
            </p>
            <p className="small text-secondary mb-0" style={{fontSize: '0.85rem'}}>Current Price</p>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-4">
          <div className="p-3 rounded-3" style={{background: 'rgba(255, 255, 255, 0.02)'}}>
            <p className={`mb-1 fw-bold ${getMetricColor('dcf', curTickerData.dcf_price["Intrinsic Value Per Share"])}`} style={{fontSize: '1.4rem'}}>
              ${curTickerData.dcf_price["Intrinsic Value Per Share"].toFixed(2)}
            </p>
            <p className="small text-secondary mb-0" style={{fontSize: '0.85rem'}}>DCF Value</p>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-4">
          <div className="p-3 rounded-3" style={{background: 'rgba(255, 255, 255, 0.02)'}}>
            <p className={`mb-1 fw-bold ${getMetricColor('pe_ratio', target_metrics.pe_ratio)}`} style={{fontSize: '1.4rem'}}>
              {target_metrics.pe_ratio ? target_metrics.pe_ratio.toFixed(2) : 'N/A'}
            </p>
            <p className="small text-secondary mb-0" style={{fontSize: '0.85rem'}}>
              P/E Ratio
              {target_metrics.pe_ratio && (
                <span className={`d-block ${getMetricColor('pe_ratio', target_metrics.pe_ratio)}`} style={{fontSize: '0.75rem'}}>
                  {getMetricDescription('pe_ratio', target_metrics.pe_ratio)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="col-6 col-md-3 mb-4">
          <div className="p-3 rounded-3" style={{background: 'rgba(255, 255, 255, 0.02)'}}>
            <p className={`mb-1 fw-bold ${getMetricColor('profit_margin', target_metrics.profit_margin)}`} style={{fontSize: '1.4rem'}}>
              {target_metrics.profit_margin ? 
                `${(target_metrics.profit_margin > 1 ? target_metrics.profit_margin : target_metrics.profit_margin * 100).toFixed(1)}%` 
                : 'N/A'
              }
            </p>
            <p className="small text-secondary mb-0" style={{fontSize: '0.85rem'}}>
              Profit Margin
              {target_metrics.profit_margin && (
                <span className={`d-block ${getMetricColor('profit_margin', target_metrics.profit_margin)}`} style={{fontSize: '0.75rem'}}>
                  {getMetricDescription('profit_margin', target_metrics.profit_margin)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }, [curTickerData, getMetricColor, getMetricDescription]);

  const similarCompaniesList = useMemo(() => (
    similarCompanies.length > 0 ? (
      <div className="d-grid gap-2">
        {similarCompanies.map((company, index) => (
          <button
            key={company}
            onClick={() => handleStockSelect(company)}
            className="btn text-start p-3 rounded-3 border-0"
            style={{
              background: '#262626',
              color: 'white',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.background = '#333';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.background = '#262626';
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <span style={{fontWeight: '600', fontSize: '0.95rem'}}>{company}</span>
              <span className="badge rounded-pill" style={{backgroundColor: 'rgba(0, 200, 81, 0.2)', color: '#00C851', fontSize: '0.8rem'}}>
                #{index + 1}
              </span>
            </div>
          </button>
        ))}
      </div>
    ) : (
      <div className="text-center py-4">
        <i className="fas fa-search text-secondary mb-2" style={{fontSize: '2rem'}}></i>
        <p className="text-secondary mb-0" style={{fontSize: '0.9rem'}}>No similar companies found</p>
      </div>
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
        {loading && !hasSearched && (
          <div className="d-flex justify-content-center mb-5">
            <div className="bg-dark rounded-3 shadow p-4 text-center" style={{maxWidth: '400px', width: '100%'}}>
              <div className="spinner-border mb-3" style={{color: '#00C851'}} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-secondary mb-0" style={{fontSize: '0.95rem'}}>Analyzing stock data...</p>
            </div>
          </div>
        )}

        {/* Results */}
        {hasSearched && curTickerData && (
          <div className="row justify-content-center g-4">
            {/* Stock Info */}
            <div className="col-lg-7 col-md-8">
              <div className="rounded-3 p-4 shadow" style={{background: '#1a1a1a', border: '1px solid #333'}}>
                <div className="text-center mb-4">
                  <h2 className="text-white mb-2" style={{fontSize: '1.5rem', fontWeight: '600'}}>
                    {curTickerData.target_metrics.full_name}
                  </h2>
                  <span className="badge px-3 py-2" style={{backgroundColor: 'rgba(0, 200, 81, 0.1)', color: '#00C851', fontSize: '0.9rem'}}>
                    {ticker.toUpperCase()}
                  </span>
                </div>
                
                {stockMetrics}
                
                <div className="text-center mt-4 pt-3" style={{borderTop: '1px solid #333'}}>
                  <p className="text-secondary mb-2" style={{fontSize: '0.95rem'}}>Stock Overflow Valuation</p>
                  <h3 className="mb-3" style={{color: '#00C851', fontSize: '2.2rem', fontWeight: '700'}}>
                    ${curTickerData.calculated_value_price.toFixed(2)}
                  </h3>
                  <button
                    className="btn px-4 py-2 rounded-3"
                    style={{
                      background: '#00C851',
                      color: 'white',
                      border: 'none',
                      fontWeight: '600',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleStockSelect(ticker.toUpperCase())}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#00D55C';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#00C851';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <i className="fas fa-chart-line me-2"></i>
                    View Full Analysis
                  </button>
                </div>
              </div>
            </div>

            {/* Similar Companies */}
            <div className="col-lg-4 col-md-4">
              <div className="rounded-3 p-3 shadow" style={{background: '#1a1a1a', border: '1px solid #333'}}>
                <h5 className="text-white mb-3 text-center" style={{fontSize: '1.1rem', fontWeight: '600'}}>Similar Companies</h5>
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