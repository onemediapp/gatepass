import { cn } from '../../lib/utils';

export function ToggleSwitch({ checked, onChange, label, description, className }) {
  return (
    <label className={cn("flex items-start justify-between cursor-pointer group", className)}>
      <div className="flex flex-col pr-4">
        {label && <span className="font-bold text-premium-900 group-active:opacity-80 transition-opacity tracking-tight text-[15px]">{label}</span>}
        {description && <span className="text-[13px] text-gray-500 mt-0.5 font-medium leading-tight group-active:opacity-80 transition-opacity">{description}</span>}
      </div>
      <div className="relative inline-flex items-center mt-1 flex-shrink-0">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-[50px] h-[30px] bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[20px] peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-[26px] after:w-[26px] after:shadow-[0_2px_4px_rgba(0,0,0,0.1)] after:transition-all after:duration-300 peer-checked:bg-emerald-500 border border-black/5 active:after:w-[32px] peer-checked:active:after:-ml-[6px]"></div>
      </div>
    </label>
  );
}
