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

  // const IconComponent = getIconComponent(valuationStatus?.icon);

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
        <div className="bg-custom-dark-grey rounded p-4 mb-4">
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div>
              <h2 className="shadow-sm text-white mb-1 display-5">
                {selectedStock.ticker}
              </h2>
              <h3 className="text-secondary h5 mb-0">
                {selectedStock.full_name || 'N/A'}
              </h3>
            </div>
            <div className="text-end">
              <p className="text-white fs-4 mb-0">
                ${selectedStock.current_price?.toFixed(2) || 'N/A'}
              </p>
              <p className="text-secondary small">
                {selectedStock.price_difference > 0 ? '+' : ''}
                {selectedStock.price_difference?.toFixed(2) || 'N/A'} 
              </p>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="row row-cols-1 row-cols-md-3 g-4 mb-4">
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">Current Price</h4>
                <p className="text-white fs-5">
                  ${selectedStock.current_price?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">DCF Analysis</h4>
                <p className="text-white fs-5">${selectedStock.dcf_price["Intrinsic Value Per Share"]?.toFixed(2) || 'N/A'}</p>
              </div>
            </div>
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">Our Evaluation</h4>
                <p className="text-white fs-5">
                  ${selectedStock.calculated_value_price?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Valuation Assessment Section */}
          <div className="bg-dark rounded p-4 mb-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              {valuationStatus && (
                <>
                  {/* <IconComponent className={`fs-3 ${valuationStatus.color}`} /> */}
                  <h4 className={`mb-0 ${valuationStatus.color}`}>
                    {valuationStatus.status}
                  </h4>
                </>
              )}
            </div>
            <p className="text-secondary small mb-0">
              Based on our analysis, this stock appears to be {valuationStatus?.status.toLowerCase()} relative to its calculated fair value of ${selectedStock.calculated_value_price?.toFixed(2)}.
            </p>
          </div>

          {/* Analysis & Explanation Section */}
          <div className="bg-dark rounded p-4 mb-4">
            <h4 className="text-white h5 mb-3">Sentiment Analysis &amp; Explanation</h4>
            
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
          <div className="row row-cols-1 row-cols-md-2 g-4 mt-4">
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">P/E Ratio</h4>
                <p className="text-white fs-5">
                  {selectedStock.target_metrics?.pe_ratio?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">Price Difference</h4>
                <p className={`fs-5 ${selectedStock.price_difference > 0 ? 'text-success' : 'text-danger'}`}>
                  {selectedStock.price_difference > 0 ? '+' : ''}
                  ${selectedStock.price_difference?.toFixed(2) || 'N/A'}
                </p>
              </div>
            </div>
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">Profit Margin</h4>
                <p className="text-white fs-5">
                  {selectedStock.target_metrics?.profit_margin?.toFixed(2) || 'N/A'}%
                </p>
              </div>
            </div>
            <div className="col">
              <div className="bg-dark rounded p-3 h-100">
                <h4 className="text-secondary small mb-2">Market Cap</h4>
                <p className="text-white fs-5">
                  {selectedStock.target_metrics?.market_cap || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stock;