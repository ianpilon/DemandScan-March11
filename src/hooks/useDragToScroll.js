import { useEffect, useRef } from 'react';

/**
 * Custom hook to enable drag-to-scroll functionality on a container
 * Makes content scrollable via mouse dragging for users without scroll wheels
 */
const useDragToScroll = () => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    let isDragging = false;
    let startY = 0;
    let scrollTop = 0;
    
    const handleMouseDown = (e) => {
      isDragging = true;
      startY = e.clientY;
      scrollTop = container.scrollTop;
      container.style.cursor = 'grabbing';
      container.style.userSelect = 'none';
    };
    
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      container.scrollTop = scrollTop - deltaY;
    };
    
    const handleMouseUp = () => {
      isDragging = false;
      container.style.cursor = 'grab';
      container.style.userSelect = '';
    };
    
    // Apply grab cursor to indicate draggable
    container.style.cursor = 'grab';
    
    // Add event listeners
    container.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
    
    // Clean up event listeners
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);
  
  return containerRef;
};

export default useDragToScroll;
