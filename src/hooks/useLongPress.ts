import { useCallback, useRef } from 'react';

interface LongPressOptions {
  delay?: number;
  shouldPreventDefault?: boolean;
}

export const useLongPress = <T>(
  onLongPress: (item: T) => void,
  onClick: (item: T) => void,
  options: LongPressOptions = {}
) => {
  const { delay = 500, shouldPreventDefault = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const itemRef = useRef<T>();
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleStart = useCallback(
    (item: T, event: React.MouseEvent | React.TouchEvent) => {
      if (shouldPreventDefault) {
        event.preventDefault();
      }
      isLongPressRef.current = false;
      itemRef.current = item;
      startPosRef.current = {
        x: 'touches' in event ? event.touches[0].clientX : event.clientX,
        y: 'touches' in event ? event.touches[0].clientY : event.clientY,
      };
      timeoutRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress(item);
      }, delay);
    },
    [delay, onLongPress, shouldPreventDefault]
  );

  const handleEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isLongPressRef.current && itemRef.current) {
      onClick(itemRef.current);
    }
    startPosRef.current = null;
  }, [onClick]);

  const handleMove = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!startPosRef.current) return;

    const currentPos = {
      x: 'touches' in event ? event.touches[0].clientX : event.clientX,
      y: 'touches' in event ? event.touches[0].clientY : event.clientY,
    };

    const distance = Math.sqrt(
      Math.pow(currentPos.x - startPosRef.current.x, 2) +
      Math.pow(currentPos.y - startPosRef.current.y, 2)
    );

    // If moved more than 10px, cancel the long press
    if (distance > 10) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      startPosRef.current = null;
    }
  }, []);

  return (item: T) => ({
    onMouseDown: (e: React.MouseEvent) => handleStart(item, e),
    onMouseUp: handleEnd,
    onMouseLeave: handleEnd,
    onMouseMove: handleMove,
    onTouchStart: (e: React.TouchEvent) => handleStart(item, e),
    onTouchEnd: handleEnd,
    onTouchMove: handleMove,
  });
}; 