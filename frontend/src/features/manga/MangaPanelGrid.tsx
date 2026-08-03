import React from 'react';
import type { MangaPanelLayout } from './types';

interface MangaPanelGridProps {
  layout: MangaPanelLayout;
}

export const MangaPanelGrid: React.FC<MangaPanelGridProps> = ({ layout }) => {
  if (!layout || layout === 'none') {
    return null;
  }

  const borderClass = "border-[3px] border-black bg-transparent relative shadow-xs";

  switch (layout) {
    case 'splash':
      return (
        <div className="absolute inset-4 pointer-events-none z-1 flex">
          <div className={`w-full h-full ${borderClass}`} />
        </div>
      );

    case '4koma':
      return (
        <div className="absolute inset-4 pointer-events-none z-1 flex flex-col gap-3">
          <div className={`flex-1 ${borderClass}`} />
          <div className={`flex-1 ${borderClass}`} />
          <div className={`flex-1 ${borderClass}`} />
          <div className={`flex-1 ${borderClass}`} />
        </div>
      );

    case 'classic-6':
      return (
        <div className="absolute inset-4 pointer-events-none z-1 grid grid-cols-2 grid-rows-3 gap-3">
          <div className={borderClass} />
          <div className={borderClass} />
          <div className={borderClass} />
          <div className={borderClass} />
          <div className={borderClass} />
          <div className={borderClass} />
        </div>
      );

    case 'dynamic-3':
      return (
        <div className="absolute inset-4 pointer-events-none z-1 flex flex-col gap-3">
          {/* Top Panorama */}
          <div className={`h-[48%] ${borderClass}`} />
          {/* Bottom Split */}
          <div className="h-[52%] grid grid-cols-2 gap-3">
            <div className={borderClass} />
            <div className={borderClass} />
          </div>
        </div>
      );

    case 'action-5':
      return (
        <div className="absolute inset-4 pointer-events-none z-1 flex flex-col gap-3">
          {/* Header Panel */}
          <div className={`h-[28%] ${borderClass}`} />
          {/* Middle 3 Panels */}
          <div className="h-[44%] grid grid-cols-3 gap-3">
            <div className={borderClass} />
            <div className={borderClass} />
            <div className={borderClass} />
          </div>
          {/* Footer Panel */}
          <div className={`h-[28%] ${borderClass}`} />
        </div>
      );

    case 'webtoon-strip':
      return (
        <div className="absolute inset-4 pointer-events-none z-1 flex flex-col justify-around py-4 gap-8">
          <div className={`h-64 ${borderClass}`} />
          <div className={`h-72 ${borderClass}`} />
          <div className={`h-64 ${borderClass}`} />
        </div>
      );

    default:
      return null;
  }
};
