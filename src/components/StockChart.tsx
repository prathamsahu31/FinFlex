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
      <div className="h-[300px] w-full flex flex-col items-center justify-center bg-white border-4 border-black animate-pulse">
        <div className="w-12 h-12 border-4 border-black bg-gumroad-pink mb-4" />
        <span className="text-black font-black uppercase tracking-widest text-xs">Loading chart...</span>
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="h-[300px] w-full flex flex-col items-center justify-center bg-white border-4 border-black">
         <div className="w-12 h-12 border-4 border-black bg-rose-400 mb-4 flex items-center justify-center">
           <span className="font-black text-2xl">!</span>
         </div>
        <span className="text-black font-black uppercase tracking-widest text-xs">{error || 'No data available'}</span>
      </div>
    );
  }

  const isPositive = data[data.length - 1]?.price >= data[0]?.price;
  const color = isPositive ? '#10b981' : '#ef4444'; // emerald-500 / rose-500

  return (
    <div className="h-[300px] w-full p-2">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.4} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#000000" vertical={false} strokeOpacity={0.1} />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => {
              if (period === '1d' || period === '5d') return format(date, 'HH:mm');
              return format(date, 'MMM d');
            }}
            stroke="#000000"
            fontSize={10}
            fontWeight={900}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            stroke="#000000"
            fontSize={10}
            fontWeight={900}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{ 
              backgroundColor: '#ffffff', 
              border: '4px solid #000000', 
              borderRadius: '0px',
              padding: '8px',
              boxShadow: '4px 4px 0px #000000'
            }}
            itemStyle={{ color: '#000000', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px' }}
            labelStyle={{ color: '#000000', fontWeight: 900, textTransform: 'uppercase', fontSize: '10px', marginBottom: '4px' }}
            labelFormatter={(label: any) => format(new Date(label), period === '1d' ? 'MMM d, HH:mm' : 'MMM d, yyyy')}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={4}
            fillOpacity={1}
            fill="url(#colorPrice)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
