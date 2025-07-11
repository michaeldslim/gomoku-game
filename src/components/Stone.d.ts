import React from 'react';

interface StoneProps {
  player: number; // 1 for black, 2 for white
}

declare const Stone: React.FC<StoneProps>;

export default Stone;
