import React, { useEffect, useState } from 'react';
import { subscribeCryptoPrices, CryptoTickerData } from '../services/binance';

export default function CryptoTicker() {
  const [coins, setCoins] = useState<CryptoTickerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeCryptoPrices((updatedPrices) => {
      setCoins(updatedPrices);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
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
