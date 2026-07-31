import React, { useState } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className={`absolute z-[100] px-2 py-1 bg-black text-white text-xs font-medium rounded whitespace-nowrap pointer-events-none opacity-100 transition-opacity
          ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
          ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
          ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}
          ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
        `}>
          {content}
          
          {/* Triángulo del tooltip */}
          <div className={`absolute w-0 h-0 border-4 border-transparent
            ${position === 'top' ? 'border-t-black top-full left-1/2 -translate-x-1/2' : ''}
            ${position === 'bottom' ? 'border-b-black bottom-full left-1/2 -translate-x-1/2' : ''}
            ${position === 'right' ? 'border-r-black right-full top-1/2 -translate-y-1/2' : ''}
            ${position === 'left' ? 'border-l-black left-full top-1/2 -translate-y-1/2' : ''}
          `} />
        </div>
      )}
    </div>
  );
}
