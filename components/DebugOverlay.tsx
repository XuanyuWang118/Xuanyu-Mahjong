import React, { useState, useLayoutEffect } from 'react';

interface DebugOverlayProps {
  selector: string;
  label: string;
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({ selector, label }) => {
  const [styles, setStyles] = useState<any>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        const rect = element.getBoundingClientRect();
        const computed = window.getComputedStyle(element);
        setStyles({
          rect,
          transform: computed.transform,
          top: computed.top,
          left: computed.left,
          bottom: computed.bottom,
          right: computed.right,
        });
      } else {
        setStyles(null);
      }
    };

    measure(); // Initial measure

    // More robustly update on any DOM change
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [selector]);

  if (!styles) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: `${styles.rect.top}px`,
        left: `${styles.rect.left}px`,
        width: `${styles.rect.width}px`,
        height: `${styles.rect.height}px`,
        backgroundColor: 'rgba(128, 0, 128, 0.4)',
        border: '2px dashed purple',
        color: 'white',
        zIndex: 1000,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        fontSize: '12px',
        fontFamily: 'monospace',
        flexDirection: 'column',
        padding: '4px',
      }}
    >
      <strong className="bg-purple-800 px-2 py-0.5 rounded text-xs mb-1">{label}</strong>
      <div className="text-left text-[10px] bg-black/50 p-1 rounded">
        {styles.top !== 'auto' && <div>top: {styles.top}</div>}
        {styles.left !== 'auto' && <div>left: {styles.left}</div>}
        {styles.bottom !== 'auto' && <div>bottom: {styles.bottom}</div>}
        {styles.right !== 'auto' && <div>right: {styles.right}</div>}
        {styles.transform !== 'none' && <div>transform: {styles.transform}</div>}
      </div>
    </div>
  );
};

export default DebugOverlay;