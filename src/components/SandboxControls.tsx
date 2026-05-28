// src/components/SandboxControls.tsx
import { useState } from 'react';

// Define the schema types
export type ControlDef =
  | { id: string; type: 'slider'; label: string; min: number; max: number; step: number; defaultValue: number }
  | { id: string; type: 'toggle'; label: string; defaultValue: boolean }
  | { id: string; type: 'select'; label: string; options: string[]; defaultValue: string }
  | { id: string; type: 'text'; label: string; defaultValue: string }; // NEW: Text input

type SandboxControlsProps = {
  title?: string;
  schema: ControlDef[];
  onChange: (id: string, value: any) => void;
};

export default function SandboxControls({ title = "Property Inspector", schema, onChange }: SandboxControlsProps) {
  // Maintain local state so the UI updates instantly
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

  return (
    <div className="absolute top-24 right-8 w-80 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-xl z-30 text-white shadow-2xl">
      <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-teal-400">
        {title}
      </h3>
      
      <div className="space-y-6">
        {schema.map((ctrl) => {
          switch (ctrl.type) {
            case 'text':
              return (
                <div key={ctrl.id} className="flex flex-col text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  <span className="mb-2">{ctrl.label}</span>
                  <input
                    type="text"
                    value={values[ctrl.id]}
                    onChange={(e) => handleChange(ctrl.id, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-2 focus:border-teal-500 outline-none placeholder-zinc-600 font-mono"
                    placeholder="Enter signature..."
                    maxLength={15} // Prevents massively wide 3D geometry
                  />
                </div>
              );
            case 'slider':
              return (
                <div key={ctrl.id} className="flex flex-col">
                  <div className="flex justify-between text-xs mb-2 text-zinc-400 uppercase tracking-wider font-bold">
                    <span>{ctrl.label}</span>
                    <span className="font-mono text-white">{Number(values[ctrl.id]).toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={ctrl.min} max={ctrl.max} step={ctrl.step} 
                    value={values[ctrl.id]}
                    onChange={(e) => handleChange(ctrl.id, parseFloat(e.target.value))}
                    className="w-full accent-teal-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              );
            case 'toggle':
              return (
                <div key={ctrl.id} className="flex justify-between items-center text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  <span>{ctrl.label}</span>
                  <input 
                    type="checkbox" 
                    checked={values[ctrl.id]}
                    onChange={(e) => handleChange(ctrl.id, e.target.checked)}
                    className="w-5 h-5 accent-teal-500 rounded cursor-pointer border-zinc-700 bg-zinc-800"
                  />
                </div>
              );
            case 'select':
              return (
                <div key={ctrl.id} className="flex flex-col text-xs text-zinc-400 uppercase tracking-wider font-bold">
                  <span className="mb-2">{ctrl.label}</span>
                  <select
                    value={values[ctrl.id]}
                    onChange={(e) => handleChange(ctrl.id, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded p-2 focus:border-teal-500 outline-none"
                  >
                    {ctrl.options.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}