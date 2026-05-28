// src/components/SandboxControls.tsx
import React from 'react';

export type ControlDef = 
  | { id: string; type: 'slider'; label: string; min: number; max: number; step: number; value: number }
  | { id: string; type: 'toggle'; label: string; value: boolean }
  | { id: string; type: 'select'; label: string; options: string[]; value: string };

type SandboxControlsProps = {
  schema: ControlDef[];
  onChange: (id: string, value: any) => void;
};

export default function SandboxControls({ schema, onChange }: SandboxControlsProps) {
  return (
    <div className="absolute top-4 right-4 w-80 bg-black/80 backdrop-blur-md border border-white/20 p-6 rounded-xl z-50 text-white">
      <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Property Inspector</h3>
      
      <div className="space-y-6">
        {schema.map((ctrl) => {
          switch (ctrl.type) {
            case 'slider':
              return (
                <div key={ctrl.id} className="flex flex-col">
                  <div className="flex justify-between text-xs mb-2">
                    <span>{ctrl.label}</span>
                    <span className="font-mono text-teal-400">{ctrl.value.toFixed(2)}</span>
                  </div>
                  <input 
                    type="range" 
                    min={ctrl.min} max={ctrl.max} step={ctrl.step} value={ctrl.value}
                    onChange={(e) => onChange(ctrl.id, parseFloat(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                </div>
              );
            case 'toggle':
              return (
                <div key={ctrl.id} className="flex justify-between items-center text-xs">
                  <span>{ctrl.label}</span>
                  <input 
                    type="checkbox" 
                    checked={ctrl.value}
                    onChange={(e) => onChange(ctrl.id, e.target.checked)}
                    className="w-4 h-4 accent-teal-500"
                  />
                </div>
              );
            // Add 'select' case here...
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}