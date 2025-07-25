import yfinance as yf
from google import genai
import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
import warnings
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import logging
from enum import Enum
import time
from functools import lru_cache

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
warnings.filterwarnings('ignore')

class ValuationMethod(Enum):
    PE_MULTIPLE = "PE_MULTIPLE"
    PB_MULTIPLE = "PB_MULTIPLE"
    PS_MULTIPLE = "PS_MULTIPLE"
    COMPOSITE = "COMPOSITE"
    INSUFFICIENT_DATA = "INSUFFICIENT_DATA"

@dataclass
class EssentialMetrics:
    """Minimal essential metrics for valuation"""
    ticker: str
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    ps_ratio: Optional[float] = None
    current_price: Optional[float] = None
    book_value_per_share: Optional[float] = None
    revenue_per_share: Optional[float] = None
    earnings_per_share: Optional[float] = None
    # Only include most critical metrics
    roe: Optional[float] = None
    debt_to_equity: Optional[float] = None
    profit_margin: Optional[float] = None
    revenue_growth: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class ValuationResult:
    """Result of stock valuation analysis with calculated value price"""
    ticker: str
    analysis_date: str
    current_price: Optional[float]
    calculated_value_price: Optional[float]
    price_difference: Optional[float]
    price_difference_percent: Optional[float]
    valuation_method: str
    target_metrics: Dict[str, Any]
    peer_tickers: List[str]
    peer_count: int
    peer_statistics: Dict[str, Dict[str, float]]
    valuation_components: Dict[str, Dict[str, float]]
    key_insights: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class CachedStockData:
    """Simple in-memory cache for stock data"""
    
    def __init__(self, cache_duration_minutes: int = 30):
        self.cache = {}
        self.cache_duration = timedelta(minutes=cache_duration_minutes)
    
    def get(self, ticker: str) -> Optional[EssentialMetrics]:
        """Get cached data if valid"""
        if ticker in self.cache:
            data, timestamp = self.cache[ticker]
            if datetime.now() - timestamp < self.cache_duration:
                return data
            else:
                del self.cache[ticker]  # Remove expired cache
        return None
    
    def set(self, ticker: str, data: EssentialMetrics):
        """Cache data with timestamp"""
        self.cache[ticker] = (data, datetime.now())
    
    def clear(self):
        """Clear all cached data"""
        self.cache.clear()

class OptimizedStockDataService:
    """Optimized service with minimal API calls"""
    
    def __init__(self, cache_duration_minutes: int = 30):
        self.cache = CachedStockData(cache_duration_minutes)
        self.rate_limit_delay = 0.1  # 100ms between calls
        self.last_call_time = 0
    
    def _rate_limit(self):
        """Simple rate limiting"""
        current_time = time.time()
        time_since_last = current_time - self.last_call_time
        if time_since_last < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - time_since_last)
        self.last_call_time = time.time()
    
    def get_essential_metrics(self, ticker: str) -> EssentialMetrics:
        """Get only essential metrics with caching"""
        # Check cache first
        cached_data = self.cache.get(ticker)
        if cached_data:
            logger.info(f"Using cached data for {ticker}")
            return cached_data
        
        # Rate limit API calls
        self._rate_limit()
        
        try:
            logger.info(f"Fetching fresh data for {ticker}")
            stock = yf.Ticker(ticker)
            
            # Get only info (most efficient single call)
            info = stock.info
            
            metrics = EssentialMetrics(ticker=ticker.upper())
            
            # Extract only essential data
            metrics.market_cap = info.get('marketCap')
            metrics.pe_ratio = info.get('trailingPE')
            metrics.pb_ratio = info.get('priceToBook')
            metrics.ps_ratio = info.get('priceToSalesTrailing12Months')
            metrics.current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            metrics.book_value_per_share = info.get('bookValue')
            metrics.revenue_per_share = info.get('revenuePerShare')
            metrics.earnings_per_share = info.get('trailingEps')
            metrics.roe = info.get('returnOnEquity')
            metrics.debt_to_equity = info.get('debtToEquity')
            metrics.profit_margin = info.get('profitMargins')
            metrics.revenue_growth = info.get('revenueGrowth')
            
            # Cache the result
            self.cache.set(ticker, metrics)
            return metrics
            
        except Exception as e:
            logger.error(f"Error fetching metrics for {ticker}: {e}")
            return EssentialMetrics(ticker=ticker.upper())
    
    def get_batch_metrics(self, tickers: List[str]) -> List[EssentialMetrics]:
        """Get metrics for multiple tickers with smart caching"""
        results = []
        uncached_tickers = []
        
        # First pass: collect cached data and identify what needs fetching
        for ticker in tickers:
            cached_data = self.cache.get(ticker)
            if cached_data:
                results.append((ticker, cached_data))
            else:
                uncached_tickers.append(ticker)
        
        # Second pass: fetch uncached data with rate limiting
        for ticker in uncached_tickers:
            metrics = self.get_essential_metrics(ticker)
            results.append((ticker, metrics))
        
        # Sort results to match original order
        ticker_to_metrics = dict(results)
        return [ticker_to_metrics[ticker] for ticker in tickers if ticker in ticker_to_metrics]
    
    def validate_ticker_fast(self, ticker: str) -> bool:
        """Fast ticker validation using cached data or minimal call"""
        cached_data = self.cache.get(ticker)
        if cached_data:
            return cached_data.market_cap is not None
        
        try:
            self._rate_limit()
            stock = yf.Ticker(ticker)
            # Use fast_info for quick validation (lighter API call)
            fast_info = stock.fast_info
            market_cap = fast_info.get('marketCap')
            return market_cap is not None and market_cap > 0
        except:
            return False

class PeerCompanyService:
    """Service for finding peer companies with static fallbacks"""
    
    def __init__(self, ai_client: Optional[genai.Client] = None):
        self.ai_client = ai_client
        self._static_peers = self._load_static_peers()
        self._peer_cache = {}  # Cache AI results
    
    def get_peers(self, ticker: str, num_peers: int = 8) -> List[str]:
        """Get peer companies with proper handling of requested count"""
        ticker_upper = ticker.upper()
        
        # Check cache for AI results first (gives us more flexibility)
        cache_key = f"{ticker_upper}_{num_peers}"
        if cache_key in self._peer_cache:
            return self._peer_cache[cache_key]
        
        # Try static peers first but supplement with AI if we need more
        static_peers = self._static_peers.get(ticker_upper, [])
        
        if len(static_peers) >= num_peers:
            # Static peers are sufficient
            peers = static_peers[:num_peers]
            self._peer_cache[cache_key] = peers
            return peers
        
        # Need more peers - use AI if available
        if self.ai_client:
            try:
                peers = self._get_ai_peers(ticker, num_peers)
                self._peer_cache[cache_key] = peers  # Cache with specific count
                return peers
            except Exception as e:
                logger.error(f"AI peer detection failed: {e}")
                # Fallback to static peers even if fewer than requested
                peers = static_peers if static_peers else ['SPY']
                self._peer_cache[cache_key] = peers
                return peers
        
        # Ultimate fallback - return what we have from static
        peers = static_peers if static_peers else ['SPY']
        self._peer_cache[cache_key] = peers
        return peers
    
    def _get_ai_peers(self, ticker: str, num_peers: int) -> List[str]:
        """Get peers using AI (cached)"""
        prompt = f"List {num_peers} similar stock tickers to {ticker}. Same industry, similar size. US exchanges only. No {ticker}."
        
        response = self.ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "temperature": 0.01,
                "response_mime_type": "application/json",
                "response_schema": list[str],
            },
        )
        
        peer_companies = response.parsed
        return [p for p in peer_companies if p.upper() != ticker.upper()][:num_peers]
    
    def _load_static_peers(self) -> Dict[str, List[str]]:
        """Expanded static peer mappings with more peers per company"""
        return {
            # Add your static peers here if needed
        }

class ValuePriceCalculationService:
    """Service for calculating intrinsic value price using peer multiples and quality adjustments"""
    
    def __init__(self):
        self.valuation_methods = ['pe_ratio', 'pb_ratio', 'ps_ratio']
        self.quality_metrics = ['roe', 'debt_to_equity']
    
    def _remove_outliers(self, series: pd.Series, method: str = 'iqr') -> pd.Series:
        """Remove extreme outliers from peer data"""
        if len(series) < 3:
            return series
        
        if method == 'iqr':
            Q1 = series.quantile(0.25)
            Q3 = series.quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 2.0 * IQR  # More conservative than 1.5
            upper_bound = Q3 + 2.0 * IQR
            return series[(series >= lower_bound) & (series <= upper_bound)]
        
        elif method == 'zscore':
            z_scores = np.abs((series - series.mean()) / series.std())
            return series[z_scores < 2.5]  # Remove values >2.5 std devs
        
        return series

    def calculate_peer_statistics(self, peer_metrics: List[EssentialMetrics]) -> Dict[str, Dict[str, float]]:
        """Calculate statistics for valuation multiples and quality metrics with outlier removal"""
        if not peer_metrics:
            return {}
        
        df = pd.DataFrame([m.to_dict() for m in peer_metrics])
        stats = {}
        
        # Calculate stats for valuation multiples with outlier removal
        for col in self.valuation_methods:
            if col in df.columns:
                series = df[col].dropna()
                if len(series) > 2:  # Need at least 3 points for outlier removal
                    # Remove outliers
                    clean_series = self._remove_outliers(series, method='iqr')
                    
                    # Ensure we still have enough data points
                    if len(clean_series) >= 2:
                        # Apply reasonable caps for extreme multiples
                        if col == 'pe_ratio':
                            clean_series = clean_series[clean_series <= 100]  # Cap PE at 100
                        elif col == 'pb_ratio':
                            clean_series = clean_series[clean_series <= 20]   # Cap PB at 20
                        elif col == 'ps_ratio':
                            clean_series = clean_series[clean_series <= 30]   # Cap PS at 30
                        
                        if len(clean_series) >= 2:
                            stats[col] = {
                                'median': float(clean_series.median()),
                                'mean': float(clean_series.mean()),
                                '25th_percentile': float(clean_series.quantile(0.25)),
                                '75th_percentile': float(clean_series.quantile(0.75)),
                                'std': float(clean_series.std()) if clean_series.std() > 0 else 0.0,
                                'count': int(len(clean_series)),
                                'outliers_removed': int(len(series) - len(clean_series))
                            }
                elif len(series) >= 2:  # Fallback for small datasets
                    stats[col] = {
                        'median': float(series.median()),
                        'mean': float(series.mean()),
                        '25th_percentile': float(series.quantile(0.25)),
                        '75th_percentile': float(series.quantile(0.75)),
                        'std': float(series.std()) if series.std() > 0 else 0.0,
                        'count': int(len(series)),
                        'outliers_removed': 0
                    }
        
        # Calculate stats for quality metrics (ROE and D/E) with outlier removal
        for col in self.quality_metrics:
            if col in df.columns:
                series = df[col].dropna()
                if len(series) > 2:
                    clean_series = self._remove_outliers(series, method='iqr')
                    
                    # Apply reasonable bounds
                    if col == 'roe':
                        clean_series = clean_series[(clean_series >= -0.5) & (clean_series <= 1.0)]  # -50% to 100%
                    elif col == 'debt_to_equity':
                        clean_series = clean_series[clean_series <= 10.0]  # Cap D/E at 10
                    
                    if len(clean_series) >= 2:
                        stats[col] = {
                            'median': float(clean_series.median()),
                            'mean': float(clean_series.mean()),
                            '25th_percentile': float(clean_series.quantile(0.25)),
                            '75th_percentile': float(clean_series.quantile(0.75)),
                            'std': float(clean_series.std()) if clean_series.std() > 0 else 0.0,
                            'count': int(len(clean_series)),
                            'outliers_removed': int(len(series) - len(clean_series))
                        }
                elif len(series) >= 2:
                    stats[col] = {
                        'median': float(series.median()),
                        'mean': float(series.mean()),
                        '25th_percentile': float(series.quantile(0.25)),
                        '75th_percentile': float(series.quantile(0.75)),
                        'std': float(series.std()) if series.std() > 0 else 0.0,
                        'count': int(len(series)),
                        'outliers_removed': 0
                    }
        
        return stats
    
    def calculate_quality_adjustment(self, target: EssentialMetrics, peer_stats: Dict) -> float:
        """Calculate quality adjustment factor based on ROE and D/E relative to peers"""
        adjustments = []
        
        # ROE adjustment (higher ROE = premium valuation)
        if (target.roe is not None and target.roe > -0.5 and target.roe < 1.0 and 
            'roe' in peer_stats and peer_stats['roe']['count'] >= 2):
            
            peer_roe_median = peer_stats['roe']['median']
            peer_roe_std = peer_stats['roe']['std']
            
            if peer_roe_std > 0:
                # Calculate z-score and convert to adjustment factor
                roe_z_score = (target.roe - peer_roe_median) / peer_roe_std
                # More conservative adjustment: cap between -15% and +15%
                roe_adjustment = max(-0.15, min(0.15, roe_z_score * 0.05))
                adjustments.append(roe_adjustment)
        
        # Debt-to-Equity adjustment (lower D/E = premium valuation)
        if (target.debt_to_equity is not None and target.debt_to_equity >= 0 and target.debt_to_equity <= 10.0 and
            'debt_to_equity' in peer_stats and peer_stats['debt_to_equity']['count'] >= 2):
            
            peer_de_median = peer_stats['debt_to_equity']['median']
            peer_de_std = peer_stats['debt_to_equity']['std']
            
            if peer_de_std > 0:
                # Calculate z-score (inverted because lower D/E is better)
                de_z_score = (peer_de_median - target.debt_to_equity) / peer_de_std
                # More conservative adjustment: cap between -10% and +10%
                de_adjustment = max(-0.10, min(0.10, de_z_score * 0.04))
                adjustments.append(de_adjustment)
        
        # Return combined adjustment factor with additional safety cap
        if adjustments:
            total_adjustment = sum(adjustments) / len(adjustments)  # Average the adjustments
            # Final safety cap: maximum ±20% total adjustment
            total_adjustment = max(-0.20, min(0.20, total_adjustment))
            return 1.0 + total_adjustment  # Convert to multiplier (1.0 = no adjustment)
        
        return 1.0  # No adjustment if no quality metrics available
    def _apply_sanity_checks(self, value_price: float, current_price: Optional[float], method: str) -> float:
        """Apply sanity checks to prevent extreme valuations"""
        if current_price and current_price > 0:
            # Cap maximum deviation at 300% (4x) and minimum at -75% (0.25x)
            max_price = current_price * 4.0
            min_price = current_price * 0.25
            
            if value_price > max_price:
                logger.warning(f"{method} valuation of ${value_price:.2f} capped at ${max_price:.2f} (4x current price)")
                return max_price
            elif value_price < min_price:
                logger.warning(f"{method} valuation of ${value_price:.2f} capped at ${min_price:.2f} (0.25x current price)")
                return min_price
        
        # Absolute price sanity checks
        if value_price < 0.01:  # Minimum $0.01
            return 0.01
        elif value_price > 10000:  # Maximum $10,000
            logger.warning(f"{method} valuation capped at $10,000")
            return 10000.0
        
        return value_price

    def calculate_value_price_components(self, target: EssentialMetrics, peer_stats: Dict) -> Dict[str, Dict[str, float]]:
        """Calculate value price using different valuation methods with quality adjustments and safeguards"""
        components = {}
        
        # Calculate quality adjustment factor
        quality_adjustment = self.calculate_quality_adjustment(target, peer_stats)
        
        # PE-based valuation
        if (target.earnings_per_share and target.earnings_per_share > 0 and 
            'pe_ratio' in peer_stats and peer_stats['pe_ratio']['count'] >= 2):
            
            peer_pe_median = peer_stats['pe_ratio']['median']
            
            # Additional check: ensure reasonable PE median
            if 5 <= peer_pe_median <= 100:  # Reasonable PE range
                base_pe_value_price = target.earnings_per_share * peer_pe_median
                adjusted_pe_value_price = base_pe_value_price * quality_adjustment
                
                # Apply sanity checks
                final_pe_value = self._apply_sanity_checks(adjusted_pe_value_price, target.current_price, "PE")
                
                components['pe_valuation'] = {
                    'base_value_price': round(base_pe_value_price, 2),
                    'quality_adjustment': round(quality_adjustment, 3),
                    'value_price': round(final_pe_value, 2),
                    'peer_median_multiple': round(peer_pe_median, 2),
                    'target_metric_value': round(target.earnings_per_share, 2),
                    'confidence': min(100, peer_stats['pe_ratio']['count'] * 20),
                    'sanity_check_applied': final_pe_value != adjusted_pe_value_price
                }
        
        # PB-based valuation
        if (target.book_value_per_share and target.book_value_per_share > 0 and 
            'pb_ratio' in peer_stats and peer_stats['pb_ratio']['count'] >= 2):
            
            peer_pb_median = peer_stats['pb_ratio']['median']
            
            # Additional check: ensure reasonable PB median
            if 0.1 <= peer_pb_median <= 20:  # Reasonable PB range
                base_pb_value_price = target.book_value_per_share * peer_pb_median
                adjusted_pb_value_price = base_pb_value_price * quality_adjustment
                
                # Apply sanity checks
                final_pb_value = self._apply_sanity_checks(adjusted_pb_value_price, target.current_price, "PB")
                
                components['pb_valuation'] = {
                    'base_value_price': round(base_pb_value_price, 2),
                    'quality_adjustment': round(quality_adjustment, 3),
                    'value_price': round(final_pb_value, 2),
                    'peer_median_multiple': round(peer_pb_median, 2),
                    'target_metric_value': round(target.book_value_per_share, 2),
                    'confidence': min(100, peer_stats['pb_ratio']['count'] * 20),
                    'sanity_check_applied': final_pb_value != adjusted_pb_value_price
                }
        
        # PS-based valuation
        if (target.revenue_per_share and target.revenue_per_share > 0 and 
            'ps_ratio' in peer_stats and peer_stats['ps_ratio']['count'] >= 2):
            
            peer_ps_median = peer_stats['ps_ratio']['median']
            
            # Additional check: ensure reasonable PS median
            if 0.1 <= peer_ps_median <= 30:  # Reasonable PS range
                base_ps_value_price = target.revenue_per_share * peer_ps_median
                adjusted_ps_value_price = base_ps_value_price * quality_adjustment
                
                # Apply sanity checks
                final_ps_value = self._apply_sanity_checks(adjusted_ps_value_price, target.current_price, "PS")
                
                components['ps_valuation'] = {
                    'base_value_price': round(base_ps_value_price, 2),
                    'quality_adjustment': round(quality_adjustment, 3),
                    'value_price': round(final_ps_value, 2),
                    'peer_median_multiple': round(peer_ps_median, 2),
                    'target_metric_value': round(target.revenue_per_share, 2),
                    'confidence': min(100, peer_stats['ps_ratio']['count'] * 20),
                    'sanity_check_applied': final_ps_value != adjusted_ps_value_price
                }
        
        return components
    
    def calculate_composite_value_price(self, components: Dict[str, Dict[str, float]]) -> tuple[Optional[float], str]:
        """Calculate weighted composite value price"""
        if not components:
            return None, ValuationMethod.INSUFFICIENT_DATA.value
        
        # If only one method available, use it
        if len(components) == 1:
            method_name = list(components.keys())[0]
            value_price = components[method_name]['value_price']
            return value_price, method_name.upper()
        
        # Calculate weighted average based on confidence
        total_weight = 0
        weighted_sum = 0
        
        for method, data in components.items():
            weight = data['confidence'] / 100  # Normalize confidence to 0-1
            weighted_sum += data['value_price'] * weight
            total_weight += weight
        
        if total_weight > 0:
            composite_price = weighted_sum / total_weight
            return round(composite_price, 2), ValuationMethod.COMPOSITE.value
        
        # Fallback to simple average
        prices = [data['value_price'] for data in components.values()]
        average_price = sum(prices) / len(prices)
        return round(average_price, 2), ValuationMethod.COMPOSITE.value
    
    def generate_insights(self, target: EssentialMetrics, components: Dict, 
                         current_price: Optional[float], value_price: Optional[float],
                         peer_stats: Dict) -> List[str]:
        """Generate insights about the valuation including quality metrics"""
        insights = []
        
        if not components:
            insights.append("Insufficient data for peer-based valuation")
            return insights
        
        # Add available valuation methods
        methods = list(components.keys())
        insights.append(f"Valuation based on {len(methods)} method(s): {', '.join([m.replace('_', ' ').title() for m in methods])}")
        
        # Quality adjustment insights with safety warnings
        if any('quality_adjustment' in comp for comp in components.values()):
            sample_adjustment = next(comp['quality_adjustment'] for comp in components.values() if 'quality_adjustment' in comp)
            if sample_adjustment > 1.05:
                insights.append(f"Quality premium applied: {((sample_adjustment - 1) * 100):.1f}% (superior ROE/D/E vs peers)")
            elif sample_adjustment < 0.95:
                insights.append(f"Quality discount applied: {((1 - sample_adjustment) * 100):.1f}% (inferior ROE/D/E vs peers)")
            else:
                insights.append("Quality metrics in line with peer average")
        
        # Sanity check warnings
        sanity_checks_applied = [comp.get('sanity_check_applied', False) for comp in components.values()]
        if any(sanity_checks_applied):
            insights.append("⚠️ Extreme valuations detected and capped for reasonableness")
        
        # Outlier removal notifications
        outliers_info = []
        for metric in ['pe_ratio', 'pb_ratio', 'ps_ratio']:
            if metric in peer_stats and peer_stats[metric].get('outliers_removed', 0) > 0:
                outliers_info.append(f"{peer_stats[metric]['outliers_removed']} {metric.upper()} outliers")
        
        if outliers_info:
            insights.append(f"Peer data cleaned: {', '.join(outliers_info)} removed")
        
        # ROE comparison
        if (target.roe is not None and 'roe' in peer_stats):
            peer_roe_median = peer_stats['roe']['median']
            if target.roe > peer_roe_median * 1.2:
                insights.append(f"Strong ROE: {target.roe:.1f}% vs peer median {peer_roe_median:.1f}%")
            elif target.roe < peer_roe_median * 0.8:
                insights.append(f"Below-average ROE: {target.roe:.1f}% vs peer median {peer_roe_median:.1f}%")
        
        # D/E comparison
        if (target.debt_to_equity is not None and 'debt_to_equity' in peer_stats):
            peer_de_median = peer_stats['debt_to_equity']['median']
            if target.debt_to_equity < peer_de_median * 0.7:
                insights.append(f"Conservative debt level: {target.debt_to_equity:.1f} vs peer median {peer_de_median:.1f}")
            elif target.debt_to_equity > peer_de_median * 1.5:
                insights.append(f"High debt level: {target.debt_to_equity:.1f} vs peer median {peer_de_median:.1f}")
        
        # Price comparison
        if current_price and value_price:
            difference_pct = ((value_price - current_price) / current_price) * 100
            if difference_pct > 10:
                insights.append(f"Stock appears undervalued by {abs(difference_pct):.1f}%")
            elif difference_pct < -10:
                insights.append(f"Stock appears overvalued by {abs(difference_pct):.1f}%")
            else:
                insights.append("Stock appears fairly valued relative to peers")
        
        # Method-specific insights
        for method, data in components.items():
            confidence = data['confidence']
            if confidence >= 80:
                insights.append(f"{method.replace('_', ' ').title()} valuation has high confidence ({confidence}%)")
            elif confidence < 60:
                insights.append(f"{method.replace('_', ' ').title()} valuation has lower confidence due to limited peer data")
        
        return insights

class StockValuationService:
    """Main service for calculating stock value price using peer multiples"""
    
    def __init__(self, project_id: Optional[str] = None, location: str = 'us-central1', cache_duration: int = 30):
        # Initialize AI client if provided
        ai_client = None
        if project_id:
            try:
                ai_client = genai.Client(vertexai=True, project=project_id, location=location)
            except Exception as e:
                logger.warning(f"AI client initialization failed: {e}")
        
        self.peer_service = PeerCompanyService(ai_client)
        self.stock_service = OptimizedStockDataService(cache_duration)
        self.valuation_service = ValuePriceCalculationService()
    
    def get_stock_valuation(self, ticker: str, num_peers: int = 6) -> ValuationResult:
        """Main valuation method - returns calculated value price"""
        # Validate ticker quickly
        if not self.stock_service.validate_ticker_fast(ticker):
            raise ValueError(f"Invalid ticker: {ticker}")
        
        # Get peer tickers with requested count
        peer_tickers = self.peer_service.get_peers(ticker, num_peers)
        logger.info(f"Requested {num_peers} peers, got {len(peer_tickers)}: {peer_tickers}")
        
        # Batch fetch all data at once (target + peers)
        all_tickers = [ticker] + peer_tickers
        all_metrics = self.stock_service.get_batch_metrics(all_tickers)
        
        if not all_metrics:
            raise ValueError(f"Could not fetch data for {ticker}")
        
        # Separate target from peers
        target_metrics = all_metrics[0]
        peer_metrics = [m for m in all_metrics[1:] if m.market_cap is not None]
        successful_peers = [m.ticker for m in peer_metrics]
        
        logger.info(f"Successfully analyzed {len(peer_metrics)} out of {len(peer_tickers)} requested peers")
        
        # Calculate peer statistics and value price
        peer_stats = self.valuation_service.calculate_peer_statistics(peer_metrics)
        valuation_components = self.valuation_service.calculate_value_price_components(target_metrics, peer_stats)
        calculated_value_price, method = self.valuation_service.calculate_composite_value_price(valuation_components)

        current_price = target_metrics.current_price
        calculated_value_price = min((current_price + current_price) * 0.3, calculated_value_price)
        calculated_value_price = max((current_price - current_price) * 0.3, calculated_value_price)
        
        # Calculate price differences
        price_difference = None
        price_difference_percent = None
        
        if current_price and calculated_value_price:
            price_difference = round(calculated_value_price - current_price, 2)
            price_difference_percent = round((price_difference / current_price) * 100, 2)
        
        # Generate insights
        insights = self.valuation_service.generate_insights(
            target_metrics, valuation_components, current_price, calculated_value_price, peer_stats
        )
       
        return ValuationResult(
            ticker=ticker.upper(),
            analysis_date=datetime.now().isoformat(),
            current_price=current_price,
            calculated_value_price=calculated_value_price,
            price_difference=price_difference,
            price_difference_percent=price_difference_percent,
            valuation_method=method,
            target_metrics=target_metrics.to_dict(),
            peer_tickers=successful_peers,
            peer_count=len(peer_metrics),
            peer_statistics=peer_stats,
            valuation_components=valuation_components,
            key_insights=insights
        )
    
    def get_basic_metrics(self, ticker: str) -> Dict[str, Any]:
        """Get basic metrics with caching"""
        if not self.stock_service.validate_ticker_fast(ticker):
            raise ValueError(f"Invalid ticker: {ticker}")
        
        metrics = self.stock_service.get_essential_metrics(ticker)
        return metrics.to_dict()
    
    def validate_ticker(self, ticker: str) -> bool:
        """Fast ticker validation"""
        return self.stock_service.validate_ticker_fast(ticker)
    
    def clear_cache(self):
        """Clear all cached data"""
        self.stock_service.cache.clear()

# Example usage optimized for production
if __name__ == "__main__":
    # Initialize with caching
    service = StockValuationService(
        project_id='kir-sprinternship-2025-dev',
        cache_duration=60  # 1 hour cache
    )
    
    # This will make only 7 API calls total (1 target + 6 peers)
    try:
        result = service.get_stock_valuation('GOOG', num_peers=40)
        print(f"Analysis complete with {result.peer_count} peers")
        print(f"Current Price: ${result.current_price}")
        print(f"Calculated Value Price: ${result.calculated_value_price}")
        print(f"Price Difference: ${result.price_difference} ({result.price_difference_percent}%)")
        print(f"Valuation Method: {result.valuation_method}")
        print(f"Key Insights: {result.key_insights}")
    except ValueError as e:
        print(f"Error: {e}")
    
    # Subsequent calls for same ticker use cache (0 API calls)
    try:
        metrics = service.get_basic_metrics('AAPL')
        print("Cached metrics retrieved")
    except ValueError as e:
        print(f"Error: {e}")