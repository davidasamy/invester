import React, { useState, useEffect, useCallback, useMemo } from 'react';

const API_BASE_URL = 'http://localhost:8000';

// Placeholder components
const Button = ({ children, onClick, className }) => (
  <button className={`btn ${className}`} onClick={onClick}>{children}</button>
);

const ArrowLeft = ({ className }) => <span className={`bi bi-arrow-left ${className}`}></span>;
const ArrowUp = ({ className }) => <span className={`bi bi-arrow-up-circle-fill ${className}`}></span>;
const ArrowDown = ({ className }) => <span className={`bi bi-arrow-down-circle-fill ${className}`}></span>;
const Minus = ({ className }) => <span className={`bi bi-dash-circle-fill ${className}`}></span>;

const getIconComponent = (iconName) => {
  switch (iconName) {
    case 'ArrowUp': return ArrowUp;
    case 'ArrowDown': return ArrowDown;
    case 'Minus': return Minus;
    default: return Minus;
  }
};

const Stock = ({ selectedStock, goBackToStocks }) => {
  const [sentimentData, setSentimentData] = useState(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState('');

  // Helper function to determine metric color (same as Homepage)
  const getMetricColor = useCallback((metricType, value, currentPrice = null, dcfValue = null) => {
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
        // Compare current price vs DCF value
        if (currentPrice && dcfValue) {
          if (currentPrice < dcfValue) return 'text-success'; // Green - Undervalued (good)
          if (currentPrice > dcfValue * 1.1) return 'text-danger'; // Red - Overvalued (bad)
          return 'text-warning'; // Yellow - Fair value
        }
        return 'text-success'; // Default to success
        
      case 'dcf':
        // DCF color based on whether current price is below (good) or above (bad) DCF value
        if (currentPrice && value) {
          if (currentPrice < value) return 'text-success'; // Green - Stock is undervalued
          if (currentPrice > value * 1.1) return 'text-danger'; // Red - Stock is overvalued
          return 'text-warning'; // Yellow - Close to fair value
        }
        return 'text-success'; // Default to success
        
      case 'valuation':
        // Color for calculated value price vs current price
        if (currentPrice && value) {
          if (value > currentPrice * 1.05) return 'text-success'; // Green - Target price higher
          if (value < currentPrice * 0.95) return 'text-danger'; // Red - Target price lower
          return 'text-warning'; // Yellow - Close to current price
        }
        return 'text-success';
        
      case 'roe':
        // Return on Equity: >15% good, 10-15% decent, <10% poor
        const roePercent = value > 1 ? value : value * 100;
        if (roePercent >= 15) return 'text-success';
        if (roePercent >= 10) return 'text-warning';
        return 'text-danger';
        
      case 'debt_to_equity':
        // Lower is better: <0.3 good, 0.3-1.0 decent, >1.0 poor
        if (value < 0.3) return 'text-success';
        if (value <= 1.0) return 'text-warning';
        return 'text-danger';
        
      default:
        return 'text-success'; // Default to success
    }
  }, []);

  // Helper function to get metric description
  const getMetricDescription = useCallback((metricType, value, currentPrice = null) => {
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
        
      case 'dcf':
        if (currentPrice && value) {
          if (currentPrice < value) return 'Undervalued';
          if (currentPrice > value * 1.1) return 'Overvalued';
          return 'Fair Value';
        }
        return '';
        
      case 'roe':
        const roePercent = value > 1 ? value : value * 100;
        if (roePercent >= 15) return 'Excellent ROE';
        if (roePercent >= 10) return 'Good ROE';
        return 'Below Average ROE';
        
      case 'debt_to_equity':
        if (value < 0.3) return 'Conservative Debt';
        if (value <= 1.0) return 'Moderate Debt';
        return 'High Debt Level';
      case 'valuation':
        if (currentPrice && value) {
          if (value > currentPrice * 1.05) return 'Undervalued';
          if (value < currentPrice * 0.95) return 'Overvalued';
          return 'Fair Value';
        }
        return '';

      default:
        return '';
    }
  }, []);

  // Fetch sentiment data
  const fetchSentiment = useCallback(async (ticker) => {
    setSentimentLoading(true);
    setSentimentError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/sentiment/${ticker.toUpperCase()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to fetch sentiment data');
      }
      
      setSentimentData(data.result);
    } catch (err) {
      setSentimentError('Could not load sentiment analysis');
      setSentimentData(null);
    } finally {
      setSentimentLoading(false);
    }
  }, []);

  // Fetch sentiment when selectedStock changes
  useEffect(() => {
    if (selectedStock?.ticker) {
      fetchSentiment(selectedStock.ticker);
    }
  }, [selectedStock?.ticker, fetchSentiment]);

  // Determine valuation status
  const valuationStatus = useMemo(() => {
    if (!selectedStock) return null;
    
    const { current_price, calculated_value_price } = selectedStock;
    const difference = calculated_value_price - current_price;
    const percentDifference = (difference / current_price) * 100;
    
    if (Math.abs(percentDifference) < 5) {
      return {
        status: 'Fairly Valued',
        color: 'text-warning',
        icon: 'Minus'
      };
    } else if (difference > 0) {
      return {
        status: 'Undervalued',
        color: 'text-success',
        icon: 'ArrowUp'
      };
    } else {
      return {
        status: 'Overvalued',
        color: 'text-danger',
        icon: 'ArrowDown'
      };
    }
  }, [selectedStock]);

  // Format sentiment analysis content
  const formatSentimentAnalysis = useCallback((sentiment) => {
    if (!sentiment) return 'Analysis not available.';
    
    // Handle different possible sentiment data structures
    if (typeof sentiment === 'string') {
      return sentiment;
    }
    
    if (sentiment.analysis) {
      return sentiment.analysis;
    }
    
    if (sentiment.summary) {
      return sentiment.summary;
    }
    
    // If sentiment has multiple fields, combine them
    const parts = [];
    if (sentiment.overall_sentiment) {
      parts.push(`Overall Sentiment: ${sentiment.overall_sentiment}`);
    }
    if (sentiment.confidence) {
      parts.push(`Confidence: ${sentiment.confidence}`);
    }
    if (sentiment.key_factors && Array.isArray(sentiment.key_factors)) {
      parts.push(`Key Factors: ${sentiment.key_factors.join(', ')}`);
    }
    
    return parts.length > 0 ? parts.join('\n\n') : 'Analysis not available.';
  }, []);

  // Main metrics component with color coding
  const mainMetrics = useMemo(() => {
    if (!selectedStock) return null;
    
    const currentPrice = selectedStock.current_price;
    const dcfValue = selectedStock.dcf_price["Intrinsic Value Per Share"];
    const calculatedValue = selectedStock.calculated_value_price;
    const { target_metrics } = selectedStock;
    
    return (
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="bg-dark rounded-3 p-3 h-100">
            <h5 className="text-secondary small mb-2">Current Price</h5>
            <p className={`mb-1 fw-bold fs-4`}>
              ${currentPrice?.toFixed(2) || 'N/A'}
            </p>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="bg-dark rounded-3 p-3 h-100">
            <h5 className="text-secondary small mb-2">DCF Analysis Valuation</h5>
            <p className={`mb-1 fw-bold fs-4 ${getMetricColor('dcf', dcfValue, currentPrice)}`}>
              ${dcfValue?.toFixed(2) || 'N/A'}
            </p>
            <small className={`${getMetricColor('dcf', dcfValue, currentPrice)}`} style={{fontSize: '0.75rem'}}>
              {getMetricDescription('dcf', dcfValue, currentPrice)}
            </small>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="bg-dark rounded-3 p-3 h-100">
            <h5 className="text-secondary small mb-2">Stock Overflow Valuation</h5>
            <p className={`mb-1 fw-bold fs-4 ${getMetricColor('valuation', calculatedValue, currentPrice)}`}>
              ${calculatedValue?.toFixed(2) || 'N/A'}
            </p>
            
            <small className={`${getMetricColor('valuation', calculatedValue, currentPrice)}`} style={{fontSize: '0.75rem'}}>
              {getMetricDescription('valuation', calculatedValue, currentPrice)}
            </small>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="bg-dark rounded-3 p-3 h-100">
            <h5 className="text-secondary small mb-2">P/E Ratio</h5>
            <p className={`mb-1 fw-bold fs-4 ${getMetricColor('pe_ratio', target_metrics?.pe_ratio)}`}>
              {target_metrics?.pe_ratio?.toFixed(2) || 'N/A'}
            </p>
            <small className={`${getMetricColor('pe_ratio', target_metrics?.pe_ratio)}`} style={{fontSize: '0.75rem'}}>
              {getMetricDescription('pe_ratio', target_metrics?.pe_ratio)}
            </small>
          </div>
        </div>
      </div>
    );
  }, [selectedStock, getMetricColor, getMetricDescription]);

  // Additional metrics component
  const additionalMetrics = useMemo(() => {
    if (!selectedStock) return null;
    
    const { target_metrics } = selectedStock;
    
    return (
      <div className="row g-3">
        <div className="col-lg-3 col-md-6">
          <div className="bg-dark rounded-3 p-3 h-100">
            <h5 className="text-secondary small mb-2">Profit Margin</h5>
            <p className={`mb-1 fw-bold fs-5 ${getMetricColor('profit_margin', target_metrics?.profit_margin)}`}>
              {target_metrics?.profit_margin ? 
                `${(target_metrics.profit_margin > 1 ? target_metrics.profit_margin : target_metrics.profit_margin * 100).toFixed(1)}%` 
                : 'N/A'
              }
            </p>
            <small className={`${getMetricColor('profit_margin', target_metrics?.profit_margin)}`} style={{fontSize: '0.75rem'}}>
              {getMetricDescription('profit_margin', target_metrics?.profit_margin)}
            </small>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="bg-dark rounded-3 p-3 h-100">
            <h5 className="text-secondary small mb-2">Return on Equity</h5>
            <p className={`mb-1 fw-bold fs-5 ${getMetricColor('roe', target_metrics?.roe)}`}>
              {target_metrics?.roe ? 
                `${(target_metrics.roe > 1 ? target_metrics.roe : target_metrics.roe * 100).toFixed(1)}%` 
                : 'N/A'
              }
            </p>
            <small className={`${getMetricColor('roe', target_metrics?.roe)}`} style={{fontSize: '0.75rem'}}>
              {getMetricDescription('roe', target_metrics?.roe)}
            </small>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="bg-dark rounded-3 p-3 h-100">
            <h5 className="text-secondary small mb-2">Debt-to-Equity</h5>
            <p className={`mb-1 fw-bold fs-5 ${getMetricColor('debt_to_equity', target_metrics?.debt_to_equity)}`}>
              {target_metrics?.debt_to_equity?.toFixed(2) || 'N/A'}
            </p>
            <small className={`${getMetricColor('debt_to_equity', target_metrics?.debt_to_equity)}`} style={{fontSize: '0.75rem'}}>
              {getMetricDescription('debt_to_equity', target_metrics?.debt_to_equity)}
            </small>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="bg-dark rounded-3 p-3 h-100">
            <h5 className="text-secondary small mb-2">Market Cap</h5>
            <p className="text-white mb-1 fw-bold fs-5">
              {target_metrics?.market_cap ? 
                `$${(target_metrics.market_cap / 1e9).toFixed(1)}B` 
                : 'N/A'
              }
            </p>
            <small className="text-secondary" style={{fontSize: '0.75rem'}}>
              Market Valuation
            </small>
          </div>
        </div>
      </div>
    );
  }, [selectedStock, getMetricColor, getMetricDescription]);

  if (!selectedStock) {
    return (
      <div className="bg-pure-black text-white min-vh-100 py-5 text-center">
        <div className="container">
          <p className="lead text-secondary">No stock selected. Please go back to the main page.</p>
          <Button onClick={goBackToStocks} className="btn btn-secondary mt-3">
            Back to Stocks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pure-black text-white min-vh-100 py-5">
      <div className="container">
        {/* Header Section */}
        <header className="text-center mb-5">
          <h1 className="stock-green display-4 fw-bold mb-3">Stock Overflow</h1>
        </header>

        {/* Back Button */}
        <Button
          onClick={goBackToStocks}
          className="btn btn-link text-secondary mb-4 d-flex align-items-center"
        >
          <ArrowLeft className="me-2" />
          Back to stocks
        </Button>
        
        {/* Main Stock Details Card */}
        <div className="rounded-3 p-4 mb-4" style={{background: '#1a1a1a', border: '1px solid #333'}}>
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 className="text-white mb-1 display-5">
                {selectedStock.ticker}
              </h2>
              <h3 className="text-secondary h5 mb-0">
                {selectedStock.full_name || selectedStock.target_metrics?.full_name || 'N/A'}
              </h3>
            </div>
            <div className="text-end">
              <p className={`fs-3 mb-0 fw-bold`}>
                ${selectedStock.current_price?.toFixed(2) || 'N/A'}
              </p>
              <p className={`small ${selectedStock.price_difference > 0 ? 'text-success' : selectedStock.price_difference < 0 ? 'text-danger' : 'text-secondary'}`}>
                {selectedStock.price_difference > 0 ? '+' : ''}
                ${selectedStock.price_difference?.toFixed(2) || 'N/A'} 
                {selectedStock.price_difference_percent ? `(${selectedStock.price_difference_percent > 0 ? '+' : ''}${selectedStock.price_difference_percent}%)` : ''}
              </p>
            </div>
          </div>

          {/* Main Key Metrics Grid */}
          {mainMetrics}

          {/* Valuation Assessment Section */}
          <div className="bg-dark rounded-3 p-4 mb-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              {valuationStatus && (
                <>
                  <h4 className={`mb-0 ${valuationStatus.color}`}>
                    {valuationStatus.status}
                  </h4>
                </>
              )}
            </div>
            <p className="text-secondary mb-0">
              Based on our analysis using <strong>{selectedStock.valuation_method?.toLowerCase()}</strong> valuation with {selectedStock.peer_count} peer companies, 
              this stock appears to be {valuationStatus?.status.toLowerCase()} relative to its calculated fair value of ${selectedStock.calculated_value_price?.toFixed(2)}.
            </p>
            
            {/* Key Insights
            {selectedStock.key_insights && selectedStock.key_insights.length > 0 && (
              <div className="mt-3">
                <h6 className="text-white mb-2">Key Insights:</h6>
                <ul className="text-secondary small mb-0">
                  {selectedStock.key_insights.map((insight, index) => (
                    <li key={index} className="mb-1">{insight}</li>
                  ))}
                </ul>
              </div>
            )} */}
          </div>

          {/* Analysis & Explanation Section */}
          <div className="bg-dark rounded-3 p-4 mb-4">
            <h4 className="text-white h5 mb-3">Sentiment Analysis &amp; Market Explanation</h4>
            
            {sentimentLoading ? (
              <div className="d-flex align-items-center">
                <div className="spinner-border spinner-border-sm text-secondary me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-white small mb-0">Loading sentiment analysis...</p>
              </div>
            ) : sentimentError ? (
              <div className="text-danger small">
                <p className="mb-2">{sentimentError}</p>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => fetchSentiment(selectedStock.ticker)}
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="text-white small">
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {formatSentimentAnalysis(sentimentData)}
                </pre>
              </div>
            )}
          </div>

          {/* Additional Metrics Grid */}
          <div className="mb-4">
            <h5 className="text-white mb-3">Additional Financial Metrics</h5>
            {additionalMetrics}
          </div>

          {/* Peer Companies Section */}
          {selectedStock.peer_tickers && selectedStock.peer_tickers.length > 0 && (
            <div className="bg-dark rounded-3 p-4">
              <h5 className="text-white mb-3">Peer Companies Analyzed ({selectedStock.peer_count})</h5>
              <div className="d-flex flex-wrap gap-2">
                {selectedStock.peer_tickers.map((peer, index) => (
                  <span 
                    key={peer} 
                    className="badge px-3 py-2"
                    style={{backgroundColor: 'rgba(0, 200, 81, 0.1)', color: '#00C851', fontSize: '0.9rem'}}
                  >
                    {peer}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Stock;