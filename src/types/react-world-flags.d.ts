declare module 'react-world-flags' {
  import React from 'react';
  
  interface FlagProps {
    code: string;
    height?: number | string;
    width?: number | string;
    style?: React.CSSProperties;
    className?: string;
    fallback?: JSX.Element | null;
    [key: string]: any;
  }
  
  const Flag: React.FC<FlagProps>;
  
  export default Flag;
} 