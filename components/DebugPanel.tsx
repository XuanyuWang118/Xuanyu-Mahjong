import React, { useState, useLayoutEffect } from 'react';

interface DebugTarget {
  label: string;
  selector: string;
}

interface DebugPanelProps {
  targets: DebugTarget[];
  currentTarget: string;
  onTargetChange: (selector: string) => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ targets, currentTarget, onTargetChange }) => {
  const [styles, setStyles] = useState<any>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const element = document.querySelector(currentTarget) as HTMLElement;
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

    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [currentTarget]);

  const data = styles ? [
    { prop: 'top', value: styles.top },
    { prop: 'bottom', value: styles.bottom },
    { prop: 'left', value: styles.left },
    { prop: 'right', value: styles.right },
    { prop: 'width', value: `${styles.rect.width.toFixed(2)}px` },
    { prop: 'height', value: `${styles.rect.height.toFixed(2)}px` },
    { prop: 'transform', value: styles.transform === 'none' ? 'none' : 'matrix(...)' },
  ] : [];

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900/90 text-white p-4 rounded-xl backdrop-blur-md border border-gray-700 w-80 shadow-2xl z-[1001]">
      <h3 className="text-lg font-bold text-purple-400 mb-2 border-b border-purple-500/30 pb-2">Debug Inspector</h3>
      <div className="mb-4">
        <label className="text-xs font-bold uppercase text-gray-400">Inspect Element</label>
        <select 
          value={currentTarget} 
          onChange={(e) => onTargetChange(e.target.value)} 
          className="w-full bg-gray-800 border border-gray-600 rounded p-1.5 text-xs mt-1 appearance-none focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          {targets.map(t => <option key={t.selector} value={t.selector}>{t.label}</option>)}
        </select>
      </div>
      {styles ? (
        <table className="w-full text-xs text-left">
          <thead className="border-b-2 border-gray-600">
            <tr>
              <th className="py-1 font-semibold uppercase tracking-wider">Property</th>
              <th className="py-1 font-semibold uppercase tracking-wider">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map(({ prop, value }) => (
              <tr key={prop} className="border-b border-gray-700/50">
                <td className="py-1.5 font-mono text-purple-300">{prop}</td>
                <td className="py-1.5 font-mono text-gray-200 break-all">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="text-center text-xs text-gray-500 py-4">
            Element not found or not rendered.
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
