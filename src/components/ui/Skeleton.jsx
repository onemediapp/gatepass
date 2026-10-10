import React from 'react';

export default function Skeleton({
  className = '',
  circle = false,
  ...props
}) {
  return (
    <div
      className={`animate-pulse bg-line/70 ${circle ? 'rounded-full' : 'rounded-[0.875rem]'} ${className}`}
      {...props}
    />
  );
}
