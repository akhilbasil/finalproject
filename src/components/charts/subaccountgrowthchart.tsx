'use client'
import React, { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSubaccountGrowthTrends } from '@/lib/queries';
import { useTheme } from 'next-themes';

interface GrowthData {
  periods: string[];
  counts: number[];
  total: number;
  averagePerPeriod: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-2 rounded shadow-sm text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-foreground">{`New Subaccounts: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const SubaccountGrowthChart = ({ agencyId }: { agencyId: string }) => {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [chartData, setChartData] = useState<GrowthData>({ 
    periods: [], 
    counts: [], 
    total: 0, 
    averagePerPeriod: 0 
  });
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  
  // Determine colors based on theme
  const isDark = theme === 'dark';
  const textColor = isDark ? '#e1e1e6' : '#1f2937';
  const gridColor = isDark ? '#2e2e3a' : '#e5e7eb';
  const barColor = isDark ? '#60a5fa' : '#4fa9ff';
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getSubaccountGrowthTrends(agencyId, timeframe);
        setChartData({
          periods: data.periods || [],
          counts: data.counts || [],
          total: data.total || 0,
          averagePerPeriod: data.averagePerPeriod || 0
        });
      } catch (error) {
        console.error('Error fetching growth data:', error);
        setChartData({ periods: [], counts: [], total: 0, averagePerPeriod: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [agencyId, timeframe]);

  // Format data for recharts
  const formattedData = chartData.periods.map((period, index) => ({
    period,
    count: chartData.counts[index]
  }));
  
  // Determine the label height based on number of periods
  const labelHeight = formattedData.length > 6 ? 70 : 40;

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as 'weekly' | 'monthly' | 'quarterly' | 'yearly')}
          className="text-xs border border-input rounded p-1 bg-background text-foreground"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-card/50 p-3 rounded">
          <p className="text-xs text-muted-foreground">Total Subaccounts</p>
          <p className="text-xl font-bold text-foreground">{chartData.total}</p>
        </div>
        <div className="bg-card/50 p-3 rounded">
          <p className="text-xs text-muted-foreground">Avg per {timeframe.slice(0, -2)}</p>
          <p className="text-xl font-bold text-foreground">{chartData.averagePerPeriod}</p>
        </div>
      </div>
      
      <div style={{ height: `${300 + labelHeight}px` }}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-muted-foreground">Loading data...</p>
          </div>
        ) : formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={formattedData} 
              margin={{ 
                top: 20, 
                right: 30, 
                left: 0, 
                bottom: labelHeight // Dynamic bottom margin for labels
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis 
                dataKey="period" 
                angle={0} 
                textAnchor="end" 
                height={labelHeight} 
                tick={{ fill: textColor, fontSize: 11 }}
                tickMargin={10}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fill: textColor }} 
                width={30}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="count" 
                name="New Subaccounts" 
                fill={barColor}
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-full">
            <p className="text-muted-foreground">No data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubaccountGrowthChart;