import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Create a context for the accordion
interface AccordionContextProps {
  value: string[];
  onValueChange: (value: string) => void;
  type: "single" | "multiple";
  collapsible?: boolean;
}

const AccordionContext = React.createContext<AccordionContextProps>({
  value: [],
  onValueChange: () => {},
  type: "single",
  collapsible: false,
});

// Define component interfaces
interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  collapsible?: boolean;
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  forceMount?: boolean;
}

// Root component
const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ 
    className, 
    type = "single", 
    collapsible = false, 
    value, 
    defaultValue = [], 
    onValueChange,
    ...props 
  }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(value || defaultValue);
    
    // Update internal state when controlled value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);
    
    const handleValueChange = React.useCallback((itemValue: string) => {
      const newValue = [...internalValue];
      const index = newValue.indexOf(itemValue);
      
      if (index > -1) {
        if (type === "multiple" || (type === "single" && collapsible)) {
          newValue.splice(index, 1);
        }
      } else {
        if (type === "single") {
          newValue.length = 0;
        }
        newValue.push(itemValue);
      }
      
      setInternalValue(newValue);
      if (onValueChange) {
        onValueChange(newValue);
      }
    }, [internalValue, type, collapsible, onValueChange]);
    
    // Create a handler that accepts a single string for the context
    const handleValueChangeForContext = React.useCallback((itemValue: string) => {
      handleValueChange(itemValue);
    }, [handleValueChange]);
    
    return (
      <AccordionContext.Provider 
        value={{ 
          value: internalValue, 
          onValueChange: handleValueChangeForContext, 
          type, 
          collapsible 
        }}
      >
        <div 
          ref={ref} 
          className={cn("space-y-1", className)}
          {...props}
        />
      </AccordionContext.Provider>
    );
  }
);
Accordion.displayName = "Accordion";

// Item component
const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, disabled = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-state={disabled ? "disabled" : "enabled"}
        data-value={value}
        className={cn("border-b", className)}
        {...props}
      />
    );
  }
);
AccordionItem.displayName = "AccordionItem";

// Trigger component
const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { value, onValueChange } = React.useContext(AccordionContext);
    const itemValue = React.useContext(ItemContext);
    const isOpen = value.includes(itemValue);
    
    return (
      <div className="flex">
        <button
          ref={ref}
          type="button"
          aria-expanded={isOpen}
          disabled={props.disabled}
          onClick={() => onValueChange(itemValue)}
          className={cn(
            "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
            className
          )}
          {...props}
        >
          {children}
          <ChevronDown 
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              isOpen && "rotate-180"
            )} 
          />
        </button>
      </div>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

// Context for passing item value to children
const ItemContext = React.createContext<string>("");

// Content component
const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, forceMount, ...props }, ref) => {
    const { value } = React.useContext(AccordionContext);
    const itemValue = React.useContext(ItemContext);
    const isOpen = value.includes(itemValue);
    
    if (!forceMount && !isOpen) return null;
    
    return (
      <div
        ref={ref}
        data-state={isOpen ? "open" : "closed"}
        className={cn(
          "overflow-hidden text-sm",
          isOpen ? "animate-accordion-down" : "animate-accordion-up",
          className
        )}
        {...props}
      >
        <div className={cn("pb-4 pt-0")}>
          {children}
        </div>
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";

// Higher-order component to provide item context
const withItemContext = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return ({ value, ...props }: P & { value: string }) => (
    <ItemContext.Provider value={value}>
      <Component {...props as any} />
    </ItemContext.Provider>
  );
};

// Apply item context to item component
const AccordionItemWithContext = withItemContext(AccordionItem);

export { 
  Accordion, 
  AccordionItemWithContext as AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
}
