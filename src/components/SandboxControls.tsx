// src/components/SandboxControls.tsx
import { useState } from 'react';

export type ControlDef =
  | { id: string; type: 'slider'; label: string; min: number; max: number; step: number; defaultValue: number }
  | { id: string; type: 'toggle'; label: string; defaultValue: boolean }
  | { id: string; type: 'select'; label: string; options: string[]; defaultValue: string }
  | { id: string; type: 'textarea'; label: string; defaultValue: string }
  | { id: string; type: 'text'; label: string; defaultValue: string };

type SandboxControlsProps = {
  schema: ControlDef[];
  onChange: (id: string, value: any) => void;
};

export default function SandboxControls({ schema, onChange }: SandboxControlsProps) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initialState: Record<string, any> = {};
    schema.forEach((ctrl) => {
      initialState[ctrl.id] = ctrl.defaultValue;
    });
    return initialState;
  });

  const handleChange = (id: string, value: any) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    onChange(id, value);
  };

  // The wrapper now forces children to stretch and fill rows gracefully
  return (
    <div className="flex flex-wrap items-stretch content-start gap-3 sm:gap-4 w-full text-white">
      {schema.map((ctrl) => {
        
        // Base styling for all control blocks to look uniform
        const blockClass = "flex-1 min-w-[200px] md:min-w-[250px] flex items-center justify-between gap-3 text-xs text-zinc-400 uppercase tracking-wider font-bold bg-black/50 p-2.5 sm:p-3 rounded border border-zinc-700/50 hover:border-zinc-500 transition-colors";

        switch (ctrl.type) {
          case 'text':
            return (
              <div key={ctrl.id} className={blockClass}>
                <span className="shrink-0">{ctrl.label}:</span>
                <input
                  type="text"
                  value={values[ctrl.id]}
                  onChange={(e) => handleChange(ctrl.id, e.target.value)}
                  className="w-full bg-transparent text-white focus:outline-none placeholder-zinc-600 font-mono text-right"
                  placeholder="..."
                  maxLength={25}
                />
              </div>
            );
           case 'textarea': 
            return (
              <div key={ctrl.id} className={`${blockClass} flex-col !items-start`}>
                <span className="shrink-0">{ctrl.label}:</span>
                <textarea
                  value={values[ctrl.id]}
                  onChange={(e) => handleChange(ctrl.id, e.target.value)}
                  className="w-full h-16 bg-zinc-900/50 p-2 rounded text-white focus:outline-none placeholder-zinc-600 font-mono resize-none leading-tight mt-1"
                  placeholder="..."
                />
              </div>
            ); 
          case 'slider':
            return (
              <div key={ctrl.id} className={blockClass}>
                <span className="shrink-0">{ctrl.label}:</span>
                <input 
                  type="range" 
                  min={ctrl.min} max={ctrl.max} step={ctrl.step} 
                  value={values[ctrl.id]}
                  onChange={(e) => handleChange(ctrl.id, parseFloat(e.target.value))}
                  className="flex-1 w-full min-w-[80px] accent-teal-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-mono text-white w-8 text-right shrink-0">
                  {Number(values[ctrl.id]).toFixed(1)}
                </span>
              </div>
            );
          case 'select':
            return (
              <div key={ctrl.id} className={blockClass}>
                <span className="shrink-0">{ctrl.label}:</span>
                <select
                  value={values[ctrl.id]}
                  onChange={(e) => handleChange(ctrl.id, e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer font-mono text-right flex-1"
                >
                  {ctrl.options.map(opt => (
                    <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                  ))}
                </select>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}