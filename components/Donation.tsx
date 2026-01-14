
import React, { useState } from 'react';

export const Donation: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const upiId = "swatiakm@axl";
  const upiName = "FinTrack Sovereign";
  
  const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}&bgcolor=ffffff&color=0f172a&margin=20`;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-12 md:py-24 px-4 animate-fade-in font-['Inter'] pb-40">
      <div className="text-center mb-16 md:mb-20">
        <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full mb-6">
          <i className="fas fa-heart text-[10px] text-red-500 animate-pulse"></i>
          <span className="text-[10px] font-black uppercase tracking-[0.4em]">Support Protocol</span>
        </div>
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase leading-none text-slate-900">SUPPORT</h1>
        <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.6em] mt-4 ml-1">Secure Capital Flow Authorized</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-[3rem] md:rounded-[3.5rem] p-8 md:p-14 border border-slate-100 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16"></div>
          
          <h3 className="text-slate-900 text-[10px] font-black uppercase tracking-[0.3em] mb-10 relative z-10">AUTHORIZE DONATION</h3>
          
          <div className="relative z-10 mx-auto w-full max-w-[240px] aspect-square bg-slate-50 rounded-[2.5rem] p-4 border border-slate-100 mb-10 group">
            <img 
              src={qrUrl} 
              alt="UPI QR Code" 
              className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-12">
              <i className="fas fa-qrcode"></i>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">UPI IDENTIFIER</p>
              <p className="text-slate-900 text-lg font-black tracking-tight mb-4 font-mono">{upiId}</p>
              
              <button 
                onClick={handleCopy}
                className={`w-full py-4 rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
                  copied ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg active:scale-95'
                }`}
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                {copied ? 'COPIED' : 'COPY ID'}
              </button>
            </div>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
              Use any UPI app: GPay, PhonePe, Paytm...
            </p>
          </div>
        </div>
        
        <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] text-white flex items-center gap-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl"></div>
           <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-blue-400 relative z-10">
             <i className="fas fa-shield-halved"></i>
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed relative z-10 text-slate-400">
             All contributions directly fund <span className="text-white">infrastructure</span> and <span className="text-white">secure hosting</span>.
           </p>
        </div>
      </div>
    </div>
  );
};
