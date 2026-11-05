import React, { useCallback, useRef } from 'react';

/**
 * Ultra-smooth draggable splitter divider that resizes two sibling panels.
 * Works for both horizontal (left/right) and vertical (top/bottom) splits.
 */
export default function ResizableSplit({
  direction = 'horizontal',
  initialSizes = [60, 40],
  minSizes = [25, 20],
  children
}) {
  const containerRef = useRef(null);
  const [sizes, setSizes] = React.useState(initialSizes);
  const dragging = useRef(false);
  const startPos = useRef(0);
  const startSizes = useRef(initialSizes);

  // Sync if initialSizes change (e.g. on reset layout)
  React.useEffect(() => {
    setSizes(initialSizes);
  }, [initialSizes]);

  const childArray = React.Children.toArray(children);

  const handleMouseDown = useCallback((e) => {
    dragging.current = true;
    startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
    startSizes.current = [...sizes];
    e.preventDefault();

    const handleMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === 'horizontal' ? containerRect.width : containerRect.height;
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      const deltaPercent = (delta / containerSize) * 100;

      let newFirst = startSizes.current[0] + deltaPercent;
      let newSecond = startSizes.current[1] - deltaPercent;

      // Enforce minimum sizes
      if (newFirst < minSizes[0]) {
        newFirst = minSizes[0];
        newSecond = 100 - newFirst;
      }
      if (newSecond < minSizes[1]) {
        newSecond = minSizes[1];
        newFirst = 100 - newSecond;
      }

      setSizes([newFirst, newSecond]);
    };

    const handleMouseUp = () => {
      dragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [sizes, direction, minSizes]);

  const isH = direction === 'horizontal';

  return (
    <div
      ref={containerRef}
      className={`flex ${isH ? 'flex-row' : 'flex-col'} w-full h-full overflow-hidden`}
    >
      <div style={{ [isH ? 'width' : 'height']: `${sizes[0]}%` }} className="overflow-hidden min-w-0">
        {childArray[0]}
      </div>

      {/* Gutter Drag Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`shrink-0 ${isH ? 'resizer-h' : 'resizer-v'} flex items-center justify-center group z-10`}
        title="Drag to resize panel"
        role="separator"
        aria-orientation={isH ? 'vertical' : 'horizontal'}
      >
        <div className={`${isH ? 'w-1 h-6' : 'h-1 w-6'} rounded-full bg-slate-600/40 group-hover:bg-sky-400 group-hover:shadow-[0_0_8px_rgba(56,189,248,0.8)] transition-all`} />
      </div>

      <div style={{ [isH ? 'width' : 'height']: `${sizes[1]}%` }} className="overflow-hidden min-w-0">
        {childArray[1]}
      </div>
    </div>
  );
}
