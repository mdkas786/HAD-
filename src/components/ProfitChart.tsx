import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { formatINR } from '../lib/utils';

export default function ProfitChart() {
  const [investment, setInvestment] = useState<number>(100000);

  // Generate projections for 24 months
  const monthsData = Array.from({ length: 25 }, (_, m) => {
    // 2X Cap limit is strict Cap
    const starterCap = investment * 2;
    const growthCap = investment * 2;
    const fortuneCap = investment * 2;

    // Linear monthly ROI addition (non-compounding since ROI is paid out monthly, or if in standard tracking)
    // Formula: monthly_roi = amount_invested * plan_rate%
    const starterEarned = Math.min(starterCap, (investment * 0.05) * m);
    const growthEarned = Math.min(growthCap, (investment * 0.06) * m);
    const fortuneEarned = Math.min(fortuneCap, (investment * 0.07) * m);

    // Let's plot remaining of 2X payoff or total sum received
    return {
      month: `M${m}`,
      'Starter (5%)': starterEarned,
      'Growth (6%)': growthEarned,
      'Fortune (7%)': fortuneEarned,
    };
  });

  return (
    <div className="bg-navy-dark border border-white/5 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">2X Principal Matrix Projections</h4>
          <p className="text-xs text-white/40 mt-0.5">Determine payout speeds to reach the hard 2X maximum return cap</p>
        </div>
        
        {/* Dynamic Investment amount box */}
        <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-1 font-mono text-xs">
          <span className="text-gold-light mr-2">Investment:</span>
          <span>₹</span>
          <input 
            type="number" 
            value={investment} 
            onChange={(e) => setInvestment(Math.max(1000, Number(e.target.value)))}
            className="w-20 bg-transparent text-white font-semibold focus:outline-none"
          />
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full mt-2 font-mono text-[10px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthsData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" />
            <YAxis 
              stroke="rgba(255,255,255,0.2)" 
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value: any) => formatINR(value)}
              contentStyle={{ backgroundColor: '#112244', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend />
            {/* Reference Line for the 2X target payoff cap */}
            <ReferenceLine 
              y={investment * 2} 
              stroke="#ef4444" 
              strokeDasharray="5 5" 
              label={{ value: '2X PAYOUT HARD CAP', fill: '#ef4444', position: 'top', fontSize: 9 }}
            />
            
            <Line type="monotone" dataKey="Starter (5%)" stroke="#e8c46a" strokeWidth={2} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Growth (6%)" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="Fortune (7%)" stroke="#f97316" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5 text-center font-mono">
          <div className="text-[10px] text-white/40">STARTER 2X TIMELINE</div>
          <div className="text-xs font-semibold text-gold-light mt-1">20 Payout Months</div>
          <div className="text-[9px] text-white/30 mt-0.5">₹{(investment * 0.05).toLocaleString('en-IN')}/mo ROI</div>
        </div>
        <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5 text-center font-mono">
          <div className="text-[10px] text-white/40">GROWTH 2X TIMELINE</div>
          <div className="text-xs font-semibold text-sky-400 mt-1">~17 Payout Months</div>
          <div className="text-[9px] text-white/30 mt-0.5">₹{(investment * 0.06).toLocaleString('en-IN')}/mo ROI</div>
        </div>
        <div className="bg-white/[0.02] p-3 rounded-lg border border-white/5 text-center font-mono">
          <div className="text-[10px] text-white/40">FORTUNE 2X TIMELINE</div>
          <div className="text-xs font-semibold text-orange-400 mt-1">~15 Payout Months</div>
          <div className="text-[9px] text-white/30 mt-0.5">₹{(investment * 0.07).toLocaleString('en-IN')}/mo ROI</div>
        </div>
      </div>
    </div>
  );
}
