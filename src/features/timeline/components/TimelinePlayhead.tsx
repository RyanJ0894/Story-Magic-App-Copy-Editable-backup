import React from "react";

export type TimelinePlayheadProps = {
  time: number;
  pixelsPerSecond: number;
  totalHeight: number;
  contentLeftOffset: number;
};

export default function TimelinePlayhead({ 
  time, 
  pixelsPerSecond, 
  totalHeight, 
  contentLeftOffset 
}: TimelinePlayheadProps) {
  const left = contentLeftOffset + time * pixelsPerSecond;
  
  return (
    <div 
      className="absolute z-50" 
      style={{ 
        left, 
        top: 0, 
        height: totalHeight, 
        width: 2, 
        background: "#ef4444", 
        pointerEvents: "none" 
      }}
    >
      <div 
        className="absolute" 
        style={{ 
          top: 0, 
          left: -6, 
          width: 14, 
          height: 14, 
          background: "#ef4444", 
          transform: "rotate(45deg)", 
          borderRadius: 2 
        }} 
      />
    </div>
  );
}
