import React from 'react';

export default function Perforation({
  bgClass = 'bg-cream-50',
  className = '',
  notchSize = 'w-5 h-5',
}) {
  return (
    <div className={`relative flex items-center w-full my-3 ${className}`}>
      {/* Left notch */}
      <div
        className={`absolute -left-3 top-1/2 -translate-y-1/2 ${notchSize} rounded-full ${bgClass} shadow-inner border border-line pointer-events-none`}
      />
      
      {/* Perforated dashed line */}
      <div className="w-full border-t border-dashed border-line" />
      
      {/* Right notch */}
      <div
        className={`absolute -right-3 top-1/2 -translate-y-1/2 ${notchSize} rounded-full ${bgClass} shadow-inner border border-line pointer-events-none`}
      />
    </div>
  );
}
