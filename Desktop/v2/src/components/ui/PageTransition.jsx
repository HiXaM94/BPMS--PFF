import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * PageTransition — wraps page content with a smooth enter animation.
 * Triggers on every route change via `location.pathname`.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [currentPath, setCurrentPath] = useState(pathname);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    if (pathname !== currentPath) {
      // Exit animation
      setIsVisible(false);

      const timeout = setTimeout(() => {
        setCurrentPath(pathname);
        setDisplayChildren(children);
        // Enter animation
        requestAnimationFrame(() => setIsVisible(true));
      }, 150); // match CSS transition duration

      return () => clearTimeout(timeout);
    }
  }, [pathname, children, currentPath]);

  // Initial mount
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      {displayChildren}
    </div>
  );
}
