import { cn } from '../../lib/utils';

export function PhoneInput({ value, onChange, className, required }) {
  const handleChange = (e) => {
    // Only allow digits inside value
    const digitsOnly = e.target.value.replace(/\D/g, '').substring(0, 10);
    onChange(digitsOnly);
  };

  return (
    <div className={cn("flex items-center w-full bg-transparent overflow-hidden", className)}>
      <div className="bg-transparent border-r border-gray-200/60 px-5 py-4 text-gray-400 font-bold">
        +91
      </div>
      <input
        type="tel"
        pattern="[0-9]{10}"
        className="flex-grow px-5 py-4 min-w-0 outline-none w-full bg-transparent font-medium placeholder:text-gray-400 text-gray-900"
        placeholder="98765 43210"
        value={value}
        onChange={handleChange}
        required={required}
      />
    </div>
  );
}
