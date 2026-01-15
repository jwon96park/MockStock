const express = require('express');
const cors = require('cors');
const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 종목 검색 API
app.get('/api/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: '검색어를 입력해주세요' });
    }

    const results = await yahooFinance.search(query);
    const stocks = results.quotes.filter(q =>
      q.quoteType === 'EQUITY' || q.quoteType === 'ETF'
    ).map(q => ({
      symbol: q.symbol,
      name: q.shortname || q.longname,
      exchange: q.exchange,
      type: q.quoteType
    }));

    res.json(stocks);
  } catch (error) {
    console.error('Search error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: '검색 중 오류가 발생했습니다', details: error.message });
  }
});

// 주가 데이터 API (차트용)
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '1mo' } = req.query;

    const queryOptions = {
      period1: getStartDate(period),
      interval: getInterval(period)
    };

    const result = await yahooFinance.chart(symbol, queryOptions);

    const quotes = result.quotes.map(q => ({
      date: q.date,
      open: q.open,
      high: q.high,
      low: q.low,
      close: q.close,
      volume: q.volume
    }));

    // 매수/매도 신호 계산
    const signals = calculateSignals(quotes);

    res.json({
      symbol,
      name: result.meta.shortName || result.meta.longName,
      currency: result.meta.currency,
      quotes,
      signals
    });
  } catch (error) {
    console.error('Stock data error:', error);
    res.status(500).json({ error: '주가 데이터를 가져오는 중 오류가 발생했습니다' });
  }
});

// 기간에 따른 시작일 계산
function getStartDate(period) {
  const now = new Date();
  switch (period) {
    case '1w': return new Date(now.setDate(now.getDate() - 7));
    case '1mo': return new Date(now.setMonth(now.getMonth() - 1));
    case '3mo': return new Date(now.setMonth(now.getMonth() - 3));
    case '6mo': return new Date(now.setMonth(now.getMonth() - 6));
    case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
    case '5y': return new Date(now.setFullYear(now.getFullYear() - 5));
    default: return new Date(now.setMonth(now.getMonth() - 1));
  }
}

// 기간에 따른 인터벌 설정
function getInterval(period) {
  switch (period) {
    case '1w': return '1h';
    case '1mo': return '1d';
    case '3mo': return '1d';
    case '6mo': return '1d';
    case '1y': return '1wk';
    case '5y': return '1mo';
    default: return '1d';
  }
}

// 매수/매도 신호 계산 (이동평균 기반)
function calculateSignals(quotes) {
  if (quotes.length < 20) return { signal: 'HOLD', reason: '데이터 부족' };

  const closes = quotes.map(q => q.close).filter(c => c != null);

  // 5일 이동평균
  const ma5 = calculateMA(closes, 5);
  // 20일 이동평균
  const ma20 = calculateMA(closes, 20);

  const currentPrice = closes[closes.length - 1];
  const currentMA5 = ma5[ma5.length - 1];
  const currentMA20 = ma20[ma20.length - 1];
  const prevMA5 = ma5[ma5.length - 2];
  const prevMA20 = ma20[ma20.length - 2];

  // RSI 계산
  const rsi = calculateRSI(closes, 14);

  let signal = 'HOLD';
  let reason = '';

  // 골든크로스: 단기 이평선이 장기 이평선을 상향 돌파
  if (prevMA5 <= prevMA20 && currentMA5 > currentMA20) {
    signal = 'BUY';
    reason = '골든크로스 발생 (5일선이 20일선 상향돌파)';
  }
  // 데드크로스: 단기 이평선이 장기 이평선을 하향 돌파
  else if (prevMA5 >= prevMA20 && currentMA5 < currentMA20) {
    signal = 'SELL';
    reason = '데드크로스 발생 (5일선이 20일선 하향돌파)';
  }
  // RSI 과매도
  else if (rsi < 30) {
    signal = 'BUY';
    reason = `RSI 과매도 구간 (${rsi.toFixed(1)})`;
  }
  // RSI 과매수
  else if (rsi > 70) {
    signal = 'SELL';
    reason = `RSI 과매수 구간 (${rsi.toFixed(1)})`;
  }
  else {
    reason = '관망 (명확한 신호 없음)';
  }

  return {
    signal,
    reason,
    indicators: {
      ma5: currentMA5,
      ma20: currentMA20,
      rsi: rsi,
      price: currentPrice
    }
  };
}

// 이동평균 계산
function calculateMA(data, period) {
  const ma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      ma.push(sum / period);
    }
  }
  return ma;
}

// RSI 계산
function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
