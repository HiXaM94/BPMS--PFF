import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — wraps page content with a smooth enter animation.
 * Triggers on every route change via `location.pathname`.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Reset animation on route change
    setIsVisible(false);
    const timeout = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timeout);
  }, [pathname]);

  // Initial mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      {children}
    </div>
  );
}
