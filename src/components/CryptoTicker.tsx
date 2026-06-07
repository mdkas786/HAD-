import React, { useEffect, useState } from 'react';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  priceUsd: string;
  changePercent24Hr: string;
}

export default function CryptoTicker() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrices = async () => {
    try {
      const res = await fetch('https://api.coincap.io/v2/assets?limit=10');
      const json = await res.json();
      if (json && json.data) {
        // Filter elements
        const targets = ['bitcoin', 'ethereum', 'binance-coin', 'solana', 'ripple', 'cardano', 'dogecoin', 'polkadot', 'tron', 'avalanche-2'];
        const list = json.data.filter((c: any) => targets.includes(c.id));
        setCoins(list);
      }
    } catch (e) {
      console.error('Ticker coin fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // 30s update
    return () => clearInterval(interval);
  }, []);

  if (loading || coins.length === 0) {
    return (
      <div className="bg-navy-sub border-b border-white/5 py-2 text-xs text-muted font-mono overflow-hidden h-8 flex items-center justify-center">
        <span>🔄 Syncing live asset indices from CoinCap global feed...</span>
      </div>
    );
  }

  // Duplicate list to achieve seamless infinite loop scrolling
  const scrollItems = [...coins, ...coins, ...coins];

  return (
    <div className="bg-navy-sub border-b border-white/5 py-1.5 overflow-hidden select-none">
      <div className="flex animate-ticker whitespace-nowrap gap-8">
        {scrollItems.map((coin, index) => {
          const change = parseFloat(coin.changePercent24Hr || '0');
          const isPositive = change >= 0;
          return (
            <div key={`${coin.id}-${index}`} className="inline-flex items-center gap-1.5 font-mono text-xs">
              <span className="text-white font-medium">{coin.symbol}</span>
              <span className="text-white/60">${parseFloat(coin.priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                {isPositive ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
              </span>
              <span className="text-white/20 mx-1">|</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
