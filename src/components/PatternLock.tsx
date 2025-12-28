import { useState, useRef, useEffect, useCallback } from 'react';

interface PatternLockProps {
  value: string;
  onChange: (pattern: string) => void;
  disabled?: boolean;
}

const DOTS = [
  { id: 1, x: 50, y: 50 },
  { id: 2, x: 150, y: 50 },
  { id: 3, x: 250, y: 50 },
  { id: 4, x: 50, y: 150 },
  { id: 5, x: 150, y: 150 },
  { id: 6, x: 250, y: 150 },
  { id: 7, x: 50, y: 250 },
  { id: 8, x: 150, y: 250 },
  { id: 9, x: 250, y: 250 },
];

export const PatternLock = ({ value, onChange, disabled = false }: PatternLockProps) => {
  const [selectedDots, setSelectedDots] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value && !isDrawing) {
      const dots = value.split('-').map(Number).filter(n => !isNaN(n) && n >= 1 && n <= 9);
      setSelectedDots(dots);
    }
  }, [value, isDrawing]);

  const getMousePos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * 300,
      y: ((clientY - rect.top) / rect.height) * 300,
    };
  }, []);

  const getDotAtPos = useCallback((pos: { x: number; y: number }) => {
    for (const dot of DOTS) {
      const dist = Math.sqrt(Math.pow(pos.x - dot.x, 2) + Math.pow(pos.y - dot.y, 2));
      if (dist < 30) return dot.id;
    }
    return null;
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const pos = getMousePos(e);
    if (!pos) return;
    
    const dotId = getDotAtPos(pos);
    if (dotId) {
      setIsDrawing(true);
      setSelectedDots([dotId]);
      setCurrentPos(pos);
    }
  }, [disabled, getMousePos, getDotAtPos]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    const pos = getMousePos(e);
    if (!pos) return;
    
    setCurrentPos(pos);
    const dotId = getDotAtPos(pos);
    if (dotId && !selectedDots.includes(dotId)) {
      setSelectedDots(prev => [...prev, dotId]);
    }
  }, [isDrawing, disabled, getMousePos, getDotAtPos, selectedDots]);

  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentPos(null);
    
    if (selectedDots.length > 0) {
      const patternString = selectedDots.join('-');
      onChange(patternString);
    }
  }, [isDrawing, selectedDots, onChange]);

  const handleClear = () => {
    setSelectedDots([]);
    onChange('');
  };

  // Generate path for connected dots
  const generatePath = () => {
    if (selectedDots.length < 2) return '';
    
    const points = selectedDots.map(id => DOTS.find(d => d.id === id)!);
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    // Add line to current position while drawing
    if (isDrawing && currentPos && selectedDots.length > 0) {
      path += ` L ${currentPos.x} ${currentPos.y}`;
    }
    
    return path;
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox="0 0 300 300"
          className={`w-full max-w-[200px] h-auto border rounded-lg bg-muted/50 touch-none ${disabled ? 'opacity-50' : 'cursor-pointer'}`}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          {/* Connection lines */}
          {selectedDots.length > 0 && (
            <path
              d={generatePath()}
              stroke="hsl(var(--primary))"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
          
          {/* Dots */}
          {DOTS.map((dot) => {
            const isSelected = selectedDots.includes(dot.id);
            const order = selectedDots.indexOf(dot.id) + 1;
            
            return (
              <g key={dot.id}>
                <circle
                  cx={dot.x}
                  cy={dot.y}
                  r={isSelected ? 20 : 15}
                  className={`transition-all ${
                    isSelected 
                      ? 'fill-primary stroke-primary' 
                      : 'fill-background stroke-muted-foreground'
                  }`}
                  strokeWidth="2"
                />
                {isSelected && (
                  <text
                    x={dot.x}
                    y={dot.y + 5}
                    textAnchor="middle"
                    className="fill-primary-foreground text-sm font-bold"
                    style={{ fontSize: '14px' }}
                  >
                    {order}
                  </text>
                )}
                {!isSelected && (
                  <text
                    x={dot.x}
                    y={dot.y + 5}
                    textAnchor="middle"
                    className="fill-muted-foreground text-xs"
                    style={{ fontSize: '12px' }}
                  >
                    {dot.id}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Desen:</span>
        <code className="px-2 py-1 bg-muted rounded font-mono">
          {selectedDots.length > 0 ? selectedDots.join('-') : 'Çizim yapın'}
        </code>
        {selectedDots.length > 0 && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-destructive hover:underline"
          >
            Temizle
          </button>
        )}
      </div>
    </div>
  );
};

export default PatternLock;
