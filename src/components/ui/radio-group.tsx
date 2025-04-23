import * as React from "react"
// Replace direct import with our own implementation
// import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

// Define types for our custom implementation
interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  loop?: boolean;
}

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  RadioGroupProps
>(({ className, value, defaultValue, onValueChange, ...props }, ref) => {
  // Manage state internally if not controlled
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  
  // Update internal state when props change
  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);
  
  // Handle value change
  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };
  
  return (
    <RadioGroupContext.Provider 
      value={{ 
        value: value !== undefined ? value : internalValue, 
        onValueChange: handleValueChange 
      }}
    >
      <div
        ref={ref}
        className={cn("grid gap-2", className)}
        role="radiogroup"
        {...props}
      />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  RadioGroupItemProps
>(({ className, value, ...props }, ref) => {
  const { value: groupValue, onValueChange } = React.useContext(RadioGroupContext);
  const checked = value === groupValue;
  
  return (
    <div className="relative">
      <input 
        type="radio"
        ref={ref}
        className="sr-only"
        value={value}
        checked={checked}
        onChange={() => onValueChange?.(value)}
        {...props}
      />
      <div
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "border-primary" : "border-muted",
          className
        )}
      >
        {checked && (
          <div className="flex items-center justify-center">
            <Circle className="h-2.5 w-2.5 fill-current text-current" />
          </div>
        )}
      </div>
    </div>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
