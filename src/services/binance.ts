/**
 * Binance service for fetching real-time cryptocurrency price data
 * and maintaining live streaming updates via Binance WebSockets.
 */

export interface CryptoTickerData {
  id: string;
  symbol: string;
  name: string;
  priceUsd: string;
  changePercent24Hr: string;
}

const SUPPORTED_PAIRS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];

// Map to human readable names and CoinCap IDs for legacy components support
const PAIR_METADATA: Record<string, { id: string; name: string; symbol: string }> = {
  BTCUSDT: { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  ETHUSDT: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  BNBUSDT: { id: 'binance-coin', name: 'Binance Coin', symbol: 'BNB' },
  SOLUSDT: { id: 'solana', name: 'Solana', symbol: 'SOL' }
};

/**
 * Fetch 24-hour ticker data from Binance REST API.
 */
export async function getCryptoPrices(): Promise<CryptoTickerData[]> {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
    if (!response.ok) {
      throw new Error(`Binance API response error: ${response.status}`);
    }
    const data = await response.json();
    
    if (Array.isArray(data)) {
      const filtered = data.filter((item: any) => SUPPORTED_PAIRS.includes(item.symbol));
      return filtered.map((item: any) => {
        const meta = PAIR_METADATA[item.symbol];
        return {
          id: meta.id,
          symbol: meta.symbol,
          name: meta.name,
          priceUsd: item.lastPrice || '0.00',
          changePercent24Hr: item.priceChangePercent || '0.00'
        };
      });
    }
    return [];
  } catch (error) {
    console.error('[Binance API] Fetching failed:', error);
    // Return empty list if connection issues occur; system registers connection integrity
    throw error;
  }
}

/**
 * Subscribe to live Binance WebSocket stream for real-time tickers of BTC, ETH, BNB, and SOL.
 */
export function subscribeCryptoPrices(onUpdate: (data: CryptoTickerData[]) => void): () => void {
  // Binance combined ticker stream URL
  const streams = SUPPORTED_PAIRS.map(pair => `${pair.toLowerCase()}@ticker`).join('/');
  const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
  
  let ws: WebSocket | null = null;
  let cache: Record<string, CryptoTickerData> = {};
  let isClosed = false;
  let reconnectTimeout: number | NodeJS.Timeout | null = null;

  function connect() {
    if (isClosed) return;
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload && payload.stream && payload.data) {
            const rawData = payload.data;
            const symbol = rawData.s; // e.g., 'BTCUSDT'
            if (SUPPORTED_PAIRS.includes(symbol)) {
              const meta = PAIR_METADATA[symbol];
              cache[symbol] = {
                id: meta.id,
                symbol: meta.symbol,
                name: meta.name,
                priceUsd: rawData.c || '0.00', // c: last price
                changePercent24Hr: rawData.P || '0.00' // P: 24h price change percent
              };
              
              // Emit list of latest live updates
              onUpdate(Object.values(cache));
            }
          }
        } catch (e) {
          console.warn('[Binance WS] Parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.error('[Binance WS] Connection error:', err);
      };

      ws.onclose = () => {
        if (!isClosed) {
          console.log('[Binance WS] Stream closed, attempting reconnect in 5 seconds...');
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };
    } catch (e) {
      console.error('[Binance WS] Init failure:', e);
      reconnectTimeout = setTimeout(connect, 5000);
    }
  }

  // Populate cache with REST API values first to speed up render
  getCryptoPrices().then(initial => {
    initial.forEach(item => {
      const rawPair = SUPPORTED_PAIRS.find(p => PAIR_METADATA[p].symbol === item.symbol);
      if (rawPair) {
        cache[rawPair] = item;
      }
    });
    onUpdate(Object.values(cache));
    connect();
  }).catch(() => {
    // Connect WS even if initial call fails
    connect();
  });

  // Return unsubscribe cleanup handler
  return () => {
    isClosed = true;
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout as any);
    }
    if (ws) {
      try {
        ws.close();
      } catch (e) {
        // Safe disposal
      }
    }
  };
}
