import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const follower = followerRef.current;
    if (!cursor || !follower) return;

    // Hide default cursor on the whole body
    document.body.style.cursor = 'none';

    // Move the cursor instantly, but let the follower "lag" smoothly behind
    const onMouseMove = (e: MouseEvent) => {
      gsap.to(cursor, { x: e.clientX, y: e.clientY, duration: 0, ease: 'none' });
      gsap.to(follower, { x: e.clientX, y: e.clientY, duration: 0.6, ease: 'power3.out' });
    };

    // Make the cursor expand when hovering over clickable elements
    const onMouseEnter = () => gsap.to(follower, { scale: 2, backgroundColor: 'white', duration: 0.3 });
    const onMouseLeave = () => gsap.to(follower, { scale: 1, backgroundColor: 'transparent', duration: 0.3 });

    window.addEventListener('mousemove', onMouseMove);
    
    // Attach hover effects to buttons and links
    const clickables = document.querySelectorAll('button, a, .cursor-pointer');
    clickables.forEach((el) => {
      el.addEventListener('mouseenter', onMouseEnter);
      el.addEventListener('mouseleave', onMouseLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      clickables.forEach((el) => {
        el.removeEventListener('mouseenter', onMouseEnter);
        el.removeEventListener('mouseleave', onMouseLeave);
      });
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <>
      {/* The exact dot point */}
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      />
      {/* The smooth trailing ring */}
      <div 
        ref={followerRef} 
        className="fixed top-0 left-0 w-8 h-8 border border-white rounded-full pointer-events-none z-[9998] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      />
    </>
  );
}