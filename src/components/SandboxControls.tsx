// src/components/SandboxControls.tsx
import { useState } from 'react';

export type ControlDef =
  | { id: string; type: 'slider'; label: string; min: number; max: number; step: number; defaultValue: number }
  | { id: string; type: 'toggle'; label: string; defaultValue: boolean }
  | { id: string; type: 'select'; label: string; options: string[]; defaultValue: string }
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

  // Changed to flex-row layout to fit inside the new unified shell
  return (
    <div className="flex flex-wrap items-center gap-4 text-white">
      {schema.map((ctrl) => {
        switch (ctrl.type) {
          case 'text':
            return (
              <div key={ctrl.id} className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-wider font-bold bg-black/50 p-1.5 rounded border border-zinc-700/50">
                <span>{ctrl.label}:</span>
                <input
                  type="text"
                  value={values[ctrl.id]}
                  onChange={(e) => handleChange(ctrl.id, e.target.value)}
                  className="w-32 bg-transparent text-white focus:outline-none placeholder-zinc-600 font-mono"
                  placeholder="..."
                  maxLength={15}
                />
              </div>
            );
          case 'slider':
            return (
              <div key={ctrl.id} className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-wider font-bold bg-black/50 p-1.5 rounded border border-zinc-700/50">
                <span>{ctrl.label}:</span>
                <input 
                  type="range" 
                  min={ctrl.min} max={ctrl.max} step={ctrl.step} 
                  value={values[ctrl.id]}
                  onChange={(e) => handleChange(ctrl.id, parseFloat(e.target.value))}
                  className="w-24 accent-teal-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                />
                <span className="font-mono text-white w-6">{Number(values[ctrl.id]).toFixed(1)}</span>
              </div>
            );
          case 'select':
            return (
              <div key={ctrl.id} className="flex items-center gap-2 text-xs text-zinc-400 uppercase tracking-wider font-bold bg-black/50 p-1.5 rounded border border-zinc-700/50">
                <span>{ctrl.label}:</span>
                <select
                  value={values[ctrl.id]}
                  onChange={(e) => handleChange(ctrl.id, e.target.value)}
                  className="bg-transparent text-white focus:outline-none cursor-pointer"
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