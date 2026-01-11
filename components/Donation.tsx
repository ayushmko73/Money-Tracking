
import React, { useState } from 'react';

export const Donation: React.FC = () => {
  const [amount, setAmount] = useState<number | null>(null);

  const plans = [
    { value: 100, label: '₹100', icon: '☕', desc: 'Buy us a chai' },
    { value: 500, label: '₹500', icon: '🚀', desc: 'Support development' },
    { value: 2000, label: '₹2000', icon: '🌟', desc: 'Sovereign supporter' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tighter">Support FinTrack Sovereign</h1>
        <p className="text-lg text-slate-600 font-medium">Help us keep the financial management tools free and accessible for everyone.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => (
          <button
            key={plan.value}
            onClick={() => setAmount(plan.value)}
            className={`p-8 rounded-[2.5rem] transition-all border-2 text-center group ${
              amount === plan.value 
                ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-50' 
                : 'border-white bg-white hover:border-slate-200 shadow-sm'
            }`}
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{plan.icon}</div>
            <div className="text-2xl font-black text-slate-800 mb-1">{plan.label}</div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{plan.desc}</div>
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
        <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Payment Detail Identification</h3>
        <div className="space-y-6 mb-10">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Custom Contribution Amount</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">₹</span>
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-black text-lg text-slate-900 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-3">
          <i className="fas fa-indian-rupee-sign text-sm opacity-50"></i>
          Secure Sovereign Contribution
        </button>

        <div className="mt-10 flex items-center justify-center gap-8 opacity-20">
          <i className="fab fa-cc-visa text-3xl"></i>
          <i className="fab fa-cc-mastercard text-3xl"></i>
          <i className="fab fa-cc-stripe text-3xl"></i>
          <i className="fab fa-google-pay text-3xl"></i>
        </div>
      </div>
      
      <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-10">End of Support Terminal</p>
    </div>
  );
};
