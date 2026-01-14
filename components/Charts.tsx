
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, LabelList
} from 'recharts';
import { Transaction, TransactionType } from '../types';
import { COLORS } from '../constants';

interface ChartProps {
  transactions: Transaction[];
}

export const DailyTrend: React.FC<ChartProps> = ({ transactions }) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const data = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date.startsWith(date));
    return {
      date: date.split('-').slice(1).join('/'),
      income: dayTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0),
      expense: dayTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0),
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data}
          style={{ outline: 'none' }}
        >
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[TransactionType.INCOME]} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={COLORS[TransactionType.INCOME]} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[TransactionType.EXPENSE]} stopOpacity={0.1}/>
              <stop offset="95%" stopColor={COLORS[TransactionType.EXPENSE]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} />
          <YAxis fontSize={10} axisLine={false} tickLine={false} />
          <Tooltip 
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              background: '#0f172a', 
              color: '#ffffff',
              outline: 'none',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: '#ffffff', textTransform: 'uppercase', fontWeight: 900, fontSize: '10px' }}
            labelStyle={{ color: '#94a3b8', fontWeight: 900, fontSize: '9px', marginBottom: '4px', textTransform: 'uppercase' }}
          />
          <Area 
            type="monotone" 
            dataKey="income" 
            stroke={COLORS[TransactionType.INCOME]} 
            fillOpacity={1} 
            fill="url(#colorIncome)" 
            style={{ outline: 'none' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Area 
            type="monotone" 
            dataKey="expense" 
            stroke={COLORS[TransactionType.EXPENSE]} 
            fillOpacity={1} 
            fill="url(#colorExpense)" 
            style={{ outline: 'none' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryPie: React.FC<ChartProps> = ({ transactions }) => {
  const expenseData = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart style={{ outline: 'none' }}>
          <Pie
            data={expenseData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            style={{ outline: 'none' }}
          >
            {expenseData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" style={{ outline: 'none' }} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              background: '#0f172a', 
              color: '#ffffff',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: '#ffffff', textTransform: 'uppercase', fontWeight: 900, fontSize: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const TopSpendingChart: React.FC<{ data: { category: string; amount: number }[] }> = ({ data }) => {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={data} 
          layout="vertical" 
          margin={{ left: -20, right: 30, top: 10, bottom: 0 }}
          style={{ outline: 'none' }}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="category" 
            type="category" 
            fontSize={10} 
            axisLine={false} 
            tickLine={false} 
            width={80}
            tick={{ fontWeight: 900, fill: '#64748b', textTransform: 'uppercase' }}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              background: '#0f172a', 
              color: '#ffffff',
              outline: 'none',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: '#ffffff', textTransform: 'uppercase', fontWeight: 900, fontSize: '10px' }}
            labelStyle={{ display: 'none' }}
          />
          <Bar 
            dataKey="amount" 
            radius={[0, 10, 10, 0]} 
            barSize={20}
            activeBar={false}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={['#ef4444', '#f97316', '#f59e0b'][index % 3]} 
                stroke="none"
                style={{ outline: 'none' }}
              />
            ))}
            <LabelList 
              dataKey="amount" 
              position="right" 
              formatter={(val: number) => `₹${val.toLocaleString()}`} 
              fontSize={9} 
              fontWeight={900} 
              fill="#94a3b8" 
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
