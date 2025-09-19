import React from "react";

export type TimelineRulerProps = {
  duration: number;
  pixelsPerSecond: number;
  secondsPerMark: number;
  contentLeftOffset: number;
};

export default function TimelineRuler({ 
  duration, 
  pixelsPerSecond, 
  secondsPerMark, 
  contentLeftOffset 
}: TimelineRulerProps) {
  const totalWidth = duration * pixelsPerSecond;
  const marks: number[] = [];
  
  for (let s = 0; s <= duration; s += secondsPerMark) {
    marks.push(Number(s.toFixed(2)));
  }

  return (
    <div className="relative h-7 bg-muted/40">
      <div className="relative" style={{ width: contentLeftOffset + totalWidth }}>
        <div 
          className="absolute inset-y-0" 
          style={{ 
            left: 0, 
            width: contentLeftOffset, 
            borderRight: "1px solid #e5e7eb" 
          }} 
        />
        {marks.map((s) => (
          <div 
            key={s} 
            className="absolute top-0 bottom-0" 
            style={{ 
              left: contentLeftOffset + s * pixelsPerSecond, 
              width: 1, 
              background: "#e5e7eb" 
            }}
          >
            <div 
              className="absolute top-1 text-xs text-muted-foreground" 
              style={{ transform: "translateX(-50%)" }}
            >
              {s}s
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
