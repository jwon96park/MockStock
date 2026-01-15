import { useState } from 'react';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

function App() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('1mo');

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE}/search`, {
        params: { query }
      });
      setSearchResults(res.data);
    } catch (err) {
      setError('검색 중 오류가 발생했습니다');
    }
    setLoading(false);
  };

  const handleSelectStock = async (symbol) => {
    setLoading(true);
    setError('');
    setSearchResults([]);
    try {
      const res = await axios.get(`${API_BASE}/stock/${symbol}`, {
        params: { period }
      });
      setStockData(res.data);
    } catch (err) {
      setError('주가 데이터를 가져오는 중 오류가 발생했습니다');
    }
    setLoading(false);
  };

  const handlePeriodChange = async (newPeriod) => {
    setPeriod(newPeriod);
    if (stockData) {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/stock/${stockData.symbol}`, {
          params: { period: newPeriod }
        });
        setStockData(res.data);
      } catch (err) {
        setError('주가 데이터를 가져오는 중 오류가 발생했습니다');
      }
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getSignalColor = (signal) => {
    switch (signal) {
      case 'BUY': return '#22c55e';
      case 'SELL': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSignalText = (signal) => {
    switch (signal) {
      case 'BUY': return '매수';
      case 'SELL': return '매도';
      default: return '관망';
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>MockStock</h1>
        <p>미국/한국 주식 분석 서비스</p>
      </header>

      <div className="search-section">
        <div className="search-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="종목명 또는 심볼 입력 (예: 삼성전자, AAPL)"
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((stock) => (
              <div
                key={stock.symbol}
                className="search-result-item"
                onClick={() => handleSelectStock(stock.symbol)}
              >
                <span className="symbol">{stock.symbol}</span>
                <span className="name">{stock.name}</span>
                <span className="exchange">{stock.exchange}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {stockData && (
        <div className="stock-section">
          <div className="stock-header">
            <div className="stock-info">
              <h2>{stockData.name}</h2>
              <span className="stock-symbol">{stockData.symbol}</span>
            </div>

            <div className="signal-box" style={{ backgroundColor: getSignalColor(stockData.signals.signal) }}>
              <span className="signal-label">{getSignalText(stockData.signals.signal)}</span>
              <span className="signal-reason">{stockData.signals.reason}</span>
            </div>
          </div>

          <div className="period-buttons">
            {['1w', '1mo', '3mo', '6mo', '1y', '5y'].map((p) => (
              <button
                key={p}
                className={period === p ? 'active' : ''}
                onClick={() => handlePeriodChange(p)}
              >
                {p === '1w' ? '1주' : p === '1mo' ? '1개월' : p === '3mo' ? '3개월' :
                  p === '6mo' ? '6개월' : p === '1y' ? '1년' : '5년'}
              </button>
            ))}
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={stockData.quotes.map(q => ({
                ...q,
                date: formatDate(q.date)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="종가"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {stockData.signals.indicators && (
            <div className="indicators">
              <h3>기술적 지표</h3>
              <div className="indicator-grid">
                <div className="indicator">
                  <span className="label">현재가</span>
                  <span className="value">
                    {stockData.signals.indicators.price?.toFixed(2)} {stockData.currency}
                  </span>
                </div>
                <div className="indicator">
                  <span className="label">5일 이동평균</span>
                  <span className="value">
                    {stockData.signals.indicators.ma5?.toFixed(2)}
                  </span>
                </div>
                <div className="indicator">
                  <span className="label">20일 이동평균</span>
                  <span className="value">
                    {stockData.signals.indicators.ma20?.toFixed(2)}
                  </span>
                </div>
                <div className="indicator">
                  <span className="label">RSI (14)</span>
                  <span className="value">
                    {stockData.signals.indicators.rsi?.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
