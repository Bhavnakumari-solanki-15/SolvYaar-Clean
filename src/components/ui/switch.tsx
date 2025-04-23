import * as React from "react"
// Remove direct import of Radix UI
// import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, onChange, ...props }, ref) => {
    const [checked, setChecked] = React.useState(props.checked !== undefined ? props.checked : props.defaultChecked || false);
    
    // Update internal state when props change
    React.useEffect(() => {
      if (props.checked !== undefined) {
        setChecked(props.checked);
      }
    }, [props.checked]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked;
      
      if (props.checked === undefined) {
        setChecked(newChecked);
      }
      
      // Call both callback methods if provided
      onChange?.(e);
      onCheckedChange?.(newChecked);
    };
    
    return (
      <div
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-input",
          className
        )}
        onClick={() => {
          if (!props.disabled) {
            const newChecked = !checked;
            if (props.checked === undefined) {
              setChecked(newChecked);
            }
            onCheckedChange?.(newChecked);
          }
        }}
      >
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
          aria-hidden="true"
        />
      </div>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }
