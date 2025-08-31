import { useState, useEffect, useCallback } from 'react';

// Throttle function for better performance
function throttle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

export function useScrollSpy(headingIds: string[], offset?: number) {
  const [activeId, setActiveId] = useState<string>('');

  const handleScroll = useCallback(() => {
    if (headingIds.length === 0) return;

    // Calculate dynamic offset based on screen size and sticky elements
    const dynamicOffset = offset || (() => {
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      if (isMobile) {
        // Mobile: Header (64px) + Fixed Mobile TOC (64px) + margin (20px)
        return 148;
      } else {
        // Desktop: Header (64px) + margin (40px) 
        return 104;
      }
    })();

    const scrollPosition = window.scrollY + dynamicOffset;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // If we're near the bottom of the page, activate the last section
    if (window.scrollY + windowHeight >= documentHeight - 100) {
      const lastId = headingIds[headingIds.length - 1];
      const lastElement = document.getElementById(lastId);
      if (lastElement) {
        setActiveId(lastId);
        return;
      }
    }

    // Find the active section based on scroll position
    let newActiveId = '';
    
    for (let i = headingIds.length - 1; i >= 0; i--) {
      const element = document.getElementById(headingIds[i]);
      if (element) {
        const elementTop = element.offsetTop;
        const elementHeight = element.offsetHeight;
        
        // Check if the section is currently in view
        if (elementTop <= scrollPosition && 
            (elementTop + elementHeight > scrollPosition - dynamicOffset)) {
          newActiveId = headingIds[i];
          break;
        }
      }
    }

    // If no section is actively in view, find the closest one above
    if (!newActiveId) {
      for (let i = headingIds.length - 1; i >= 0; i--) {
        const element = document.getElementById(headingIds[i]);
        if (element && element.offsetTop <= scrollPosition) {
          newActiveId = headingIds[i];
          break;
        }
      }
    }

    if (newActiveId && newActiveId !== activeId) {
      setActiveId(newActiveId);
    }
  }, [headingIds, offset, activeId]);

  // Throttled scroll handler for better performance
  const throttledHandleScroll = useCallback(throttle(handleScroll, 50), [handleScroll]);

  useEffect(() => {
    if (headingIds.length === 0) return;

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    window.addEventListener('resize', throttledHandleScroll, { passive: true });
    
    // Initial call
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      window.removeEventListener('resize', throttledHandleScroll);
    };
  }, [headingIds, throttledHandleScroll, handleScroll]);

  const scrollToHeading = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Calculate dynamic offset based on screen size
      const isMobile = window.innerWidth < 1024; // lg breakpoint
      const headerOffset = isMobile 
        ? 148 // Mobile: Header (64px) + Fixed Mobile TOC (64px) + margin (20px)
        : 100; // Desktop: Header (64px) + margin (36px)
      
      const offsetTop = element.offsetTop - headerOffset;
      
      window.scrollTo({
        top: Math.max(0, offsetTop),
        behavior: 'smooth'
      });

      // Update active id immediately for visual feedback
      setActiveId(id);
    }
  }, []);

  return { activeId, scrollToHeading };
}