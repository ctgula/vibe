'use client';

import { useEffect, useRef, useState, useMemo } from 'react';

interface GesturePoint {
  x: number;
  y: number;
  time: number;
}

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeMove?: (data: { 
    deltaX: number; 
    deltaY: number; 
    percentageX: number; 
    percentageY: number; 
    velocity: number;
  }) => void;
  onSwipeEnd?: (data: { 
    direction: 'left' | 'right' | 'up' | 'down' | null;
    velocity: number;
    distance: number;
  }) => void;
  threshold?: number;
  velocityThreshold?: number;
  preventDefault?: boolean;
  limitToAxis?: boolean;
  boundingElement?: React.RefObject<HTMLElement>;
  disabled?: boolean;
}

export function useSwipeGesture(options: SwipeOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onSwipeMove,
    onSwipeEnd,
    threshold = 50,
    velocityThreshold = 0.5, // px/ms
    preventDefault = true,
    limitToAxis = true,
    boundingElement,
    disabled = false
  } = options;

  // Store touch points to calculate velocity
  const touchPointsRef = useRef<GesturePoint[]>([]);
  const startTouchRef = useRef<GesturePoint | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'horizontal' | 'vertical' | null>(null);
  const elementBounds = useRef({ width: 0, height: 0 });

  // Update element bounds when they change
  useEffect(() => {
    const updateBounds = () => {
      if (boundingElement?.current) {
        elementBounds.current = {
          width: boundingElement.current.clientWidth,
          height: boundingElement.current.clientHeight
        };
      } else {
        elementBounds.current = {
          width: window.innerWidth,
          height: window.innerHeight
        };
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, [boundingElement]);

  useEffect(() => {
    if (disabled) return;

    // Store touch start point with timestamp
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const point = { 
        x: touch.clientX, 
        y: touch.clientY, 
        time: Date.now() 
      };
      touchPointsRef.current = [point];
      startTouchRef.current = point;
      setIsSwiping(true);
      setSwipeDirection(null);
    };

    // Track touch movement for velocity calculation and real-time feedback
    const handleTouchMove = (e: TouchEvent) => {
      if (!startTouchRef.current || !isSwiping) return;
      
      if (preventDefault) {
        // Consider preventing default only for established gesture directions
        if (swipeDirection) {
          e.preventDefault();
        }
      }

      const touch = e.touches[0];
      const currentPoint = { 
        x: touch.clientX, 
        y: touch.clientY, 
        time: Date.now() 
      };
      
      // Calculate deltas
      const deltaX = currentPoint.x - startTouchRef.current.x;
      const deltaY = currentPoint.y - startTouchRef.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Add to history for velocity calculation (limit history size)
      touchPointsRef.current.push(currentPoint);
      if (touchPointsRef.current.length > 5) {
        touchPointsRef.current.shift();
      }
      
      // Determine swipe direction axis if not already set
      if (!swipeDirection && (absDeltaX > 10 || absDeltaY > 10)) {
        setSwipeDirection(absDeltaX > absDeltaY ? 'horizontal' : 'vertical');
      }
      
      // Calculate velocity
      const velocity = calculateVelocity(touchPointsRef.current);
      
      // Call onSwipeMove if provided
      if (onSwipeMove && startTouchRef.current) {
        // Calculate percentage of swipe relative to element dimensions
        const percentageX = elementBounds.current.width ? deltaX / elementBounds.current.width : 0;
        const percentageY = elementBounds.current.height ? deltaY / elementBounds.current.height : 0;
        
        onSwipeMove({ 
          deltaX, 
          deltaY, 
          percentageX, 
          percentageY, 
          velocity 
        });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startTouchRef.current || !isSwiping) return;

      const endPoint = { 
        x: e.changedTouches[0].clientX, 
        y: e.changedTouches[0].clientY, 
        time: Date.now() 
      };
      
      // Calculate final deltas
      const deltaX = endPoint.x - startTouchRef.current.x;
      const deltaY = endPoint.y - startTouchRef.current.y;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Calculate velocity with most recent points
      touchPointsRef.current.push(endPoint);
      const velocity = calculateVelocity(touchPointsRef.current);
      
      // Determine if swipe was horizontal or vertical
      const isHorizontal = absDeltaX > absDeltaY;
      
      // Determine direction and distance
      let direction: 'left' | 'right' | 'up' | 'down' | null = null;
      let distance = 0;
      
      // Apply threshold and velocity checks for swipe detection
      const meetsVelocityThreshold = velocity >= velocityThreshold;
      const meetsDistanceThreshold = isHorizontal ? absDeltaX >= threshold : absDeltaY >= threshold;
      const isValidSwipe = meetsDistanceThreshold || meetsVelocityThreshold;
      
      if (isValidSwipe) {
        if (isHorizontal) {
          direction = deltaX > 0 ? 'right' : 'left';
          distance = absDeltaX;
          
          if (direction === 'left' && onSwipeLeft) onSwipeLeft();
          if (direction === 'right' && onSwipeRight) onSwipeRight();
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
          distance = absDeltaY;
          
          if (direction === 'up' && onSwipeUp) onSwipeUp();
          if (direction === 'down' && onSwipeDown) onSwipeDown();
        }
      }
      
      // Call onSwipeEnd with detailed swipe information
      if (onSwipeEnd) {
        onSwipeEnd({
          direction,
          velocity,
          distance
        });
      }
      
      // Reset state
      setIsSwiping(false);
      setSwipeDirection(null);
      touchPointsRef.current = [];
      startTouchRef.current = null;
    };

    // Calculate velocity from touch points history
    const calculateVelocity = (points: GesturePoint[]): number => {
      if (points.length < 2) return 0;
      
      const newest = points[points.length - 1];
      const oldest = points[0];
      
      const timeDiff = newest.time - oldest.time;
      if (timeDiff <= 0) return 0;
      
      // Calculate distance using both dimensions
      const xDist = newest.x - oldest.x;
      const yDist = newest.y - oldest.y;
      const distance = Math.sqrt(xDist * xDist + yDist * yDist);
      
      // Return velocity in pixels per millisecond
      return distance / timeDiff;
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    // Clean up
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [
    onSwipeLeft, 
    onSwipeRight, 
    onSwipeUp, 
    onSwipeDown, 
    onSwipeMove,
    onSwipeEnd,
    threshold, 
    velocityThreshold,
    preventDefault, 
    isSwiping,
    swipeDirection,
    limitToAxis,
    disabled
  ]);

  // Expose swipe state
  return {
    isSwiping,
    swipeDirection
  };
}
