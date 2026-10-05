import React from 'react';

interface LogoProps {
  size?: number | string;
  className?: string;
  showText?: boolean;
  textColor?: string;
  taglineColor?: string;
  variant?: 'emblem' | 'full';
}

export const Logo: React.FC<LogoProps> = ({
  size = 42,
  className = '',
  showText = false,
  textColor = 'text-blue-600',
  taglineColor = 'text-[#64748B]',
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className={`inline-flex items-center space-x-3 select-none ${className}`}>
      {/* Centralized CirKit Logo Emblem */}
      <img
        src="/assets/cirkit-logo.svg"
        alt="CirKit Logo"
        style={{
          width: pixelSize,
          height: pixelSize,
          objectFit: 'contain',
        }}
        className="flex-shrink-0 drop-shadow-xs transition-transform duration-200 group-hover:scale-105"
      />

      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-extrabold text-lg tracking-tight font-sans ${textColor}`}>
            CirKit
          </span>
          <span className={`text-[10px] font-medium tracking-normal mt-1 ${taglineColor}`}>
            Virtual Electronics Laboratory
          </span>
        </div>
      )}
    </div>
  );
};
