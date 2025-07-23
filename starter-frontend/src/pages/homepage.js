import React, { useState } from 'react';

const Homepage = () => {
  const [ticker, setTicker] = useState('');
  const [similarCompanies, setSimilarCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            Welcome to Invester
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover similar companies and learn more about investing
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div onSubmit={searchSimilarCompanies} className="space-y-6">
            <div>
              <label htmlFor="ticker" className="">
                Enter Stock Ticker Symbol
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  id="ticker"
                  value={ticker}
                  onChange={handleInputChange}
                  placeholder="e.g., AAPL, TSLA, MSFT"
                  className=""
                  disabled={loading}
                  onKeyPress={(e) => e.key === 'Enter' && searchSimilarCompanies(e)}
                />
                <button
                  type="button"
                  onClick={searchSimilarCompanies}
                  disabled={loading}
                  className=""
                >
                  {loading ? 'Searching...' : 'Find Similar Companies'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Results Section */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Companies Similar to {ticker.toUpperCase()}
            </h2>
            
            {similarCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {similarCompanies.map((company, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <div className="text-lg font-semibold text-gray-800">
                      {company}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Similar Company #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg">
                  No similar companies found for {ticker.toUpperCase()}
                </div>
                <p className="text-gray-400 mt-2">
                  Try searching for a different ticker symbol
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Searching for similar companies...</p>
          </div>
        )}

        {/* Get Started Section */}
        {/* {!hasSearched && !loading && (
          <div className="text-center">
            <button className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-lg font-medium">
              Get Started Learning
            </button>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default Homepage;