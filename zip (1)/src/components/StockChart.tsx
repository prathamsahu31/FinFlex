import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface StockChartProps {
  symbol: string;
  period?: string;
}

export function StockChart({ symbol, period = '1mo' }: StockChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/chart/${symbol}?period=${period}`);
        if (!response.ok) throw new Error('Failed to fetch chart data');
        const result = await response.json();
        
        if (result && result.quotes) {
          const formattedData = result.quotes.map((q: any) => ({
            date: new Date(q.date),
            price: q.close,
          })).filter((q: any) => q.price != null);
          setData(formattedData);
        }
      } catch (err) {
        setError('Could not load chart data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchChartData();
    }
  }, [symbol, period]);

  if (loading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700 animate-pulse">
        <span className="text-slate-400">Loading chart...</span>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-slate-800/50 rounded-xl border border-slate-700">
        <span className="text-slate-400">{error || 'No data available'}</span>
      </div>
    );
  }

  const isPositive = data[data.length - 1]?.price >= data[0]?.price;
  const color = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => {
              if (period === '1d' || period === '5d') return format(date, 'HH:mm');
              return format(date, 'MMM d');
            }}
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
            itemStyle={{ color: '#f8fafc' }}
            labelFormatter={(label: Date) => format(label, period === '1d' ? 'MMM d, HH:mm' : 'MMM d, yyyy')}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
