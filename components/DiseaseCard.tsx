
import React from 'react';
import { DiseaseRisk } from '../types';
import { COLORS } from '../constants';

const DiseaseCard: React.FC<{ risk: DiseaseRisk; isDarkMode: boolean }> = ({ risk, isDarkMode }) => {
  const percentage = Math.round(risk.probability * 100);
  
  const getLevelColor = (prob: number) => {
    if (prob < 0.3) return COLORS.SAFE;
    if (prob < 0.6) return COLORS.WARNING;
    return COLORS.CRITICAL;
  };

  const color = getLevelColor(risk.probability);

  return (
    <div 
        className={`rounded-[24px] border p-6 transition-all hover:scale-[1.02] relative overflow-hidden group shadow-md ${isDarkMode ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200'}`}
    >
      <div className="flex justify-between items-center mb-6">
        <h4 className={`font-black text-xs uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{risk.disease}</h4>
        <span 
          className="text-[9px] font-black px-3 py-1.5 rounded-xl text-white"
          style={{ backgroundColor: color }}
        >
          {percentage}% RISK
        </span>
      </div>
      
      <div className={`w-full rounded-full h-1.5 mb-6 overflow-hidden ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'}`}>
        <div 
          className="h-1.5 rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        ></div>
      </div>
      
      <p className={`text-[10px] font-bold leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{risk.description}</p>
    </div>
  );
};

export default DiseaseCard;
