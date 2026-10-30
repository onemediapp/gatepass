import React from 'react';

export default function Perforation({
  bgClass = 'bg-cream-50',
  className = '',
  notchSize = 'w-5 h-5',
  lineColor = 'border-line',
}) {
  return (
    <div className={`relative flex items-center w-full my-3 select-none ${className}`}>
      {/* Left notch with tactile physical punch cutout */}
      <div
        className={`absolute -left-3 top-1/2 -translate-y-1/2 ${notchSize} rounded-full ${bgClass} shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] border border-line/80 pointer-events-none z-20`}
      />
      
      {/* Perforated dashed separator line */}
      <div className={`w-full border-t-2 border-dashed ${lineColor} opacity-70`} />
      
      {/* Right notch with tactile physical punch cutout */}
      <div
        className={`absolute -right-3 top-1/2 -translate-y-1/2 ${notchSize} rounded-full ${bgClass} shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)] border border-line/80 pointer-events-none z-20`}
      />
    </div>
  );
}
