import * as React from "react"
// We'll use dynamic imports for Radix UI
// import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

// Define our own interfaces until Radix is loaded
interface TabsRootProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl";
  activationMode?: "automatic" | "manual";
  className?: string;
  children?: React.ReactNode;
}

interface TabsListProps {
  loop?: boolean;
  children?: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  tabIndex?: number;
  title?: string;
  "aria-disabled"?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

interface TabsContentProps {
  value: string;
  children?: React.ReactNode;
  className?: string;
}

// Create a context to properly manage tabs state
interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs component");
  }
  return context;
}

// Create placeholders for the components
const TabsRoot: React.FC<TabsRootProps> = ({ defaultValue, value, onValueChange, children, className, ...props }) => {
  const [localValue, setLocalValue] = React.useState(value || defaultValue || "");
  
  React.useEffect(() => {
    if (value !== undefined && value !== localValue) {
      setLocalValue(value);
    }
  }, [value, localValue]);
  
  const handleValueChange = React.useCallback((newValue: string) => {
    setLocalValue(newValue);
    onValueChange?.(newValue);
  }, [onValueChange]);
  
  // Use context to provide values to children
  return (
    <TabsContext.Provider value={{ value: localValue, onValueChange: handleValueChange }}>
      <div className={className} data-state={value || localValue} data-orientation="horizontal" {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList: React.FC<TabsListProps> = ({ className, children, ...props }) => {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-14 items-center justify-center rounded-2xl bg-white/10 dark:bg-slate-900/60 backdrop-blur-xl p-2 text-muted-foreground border border-purple-500/30 shadow-[0_4px_32px_0_rgba(168,85,247,0.15)] transition-all",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  className, 
  value, 
  children,
  ...props 
}) => {
  const { value: selectedValue, onValueChange } = useTabsContext();
  const isActive = selectedValue === value;
  
  return (
    <button
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      data-value={value}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-5 py-2 text-base font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-md bg-white/5 dark:bg-slate-800/40 backdrop-blur-md border border-transparent hover:scale-105 hover:brightness-125 hover:shadow-[0_0_16px_#a855f7] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600/80 data-[state=active]:to-blue-600/80 data-[state=active]:text-white data-[state=active]:shadow-[0_0_24px_#a855f7,0_2px_8px_rgba(0,0,0,0.25)] data-[state=active]:border-purple-400/80",
        className
      )}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent: React.FC<TabsContentProps> = ({ 
  className, 
  value, 
  children,
  ...props 
}) => {
  const { value: selectedValue } = useTabsContext();
  const isActive = selectedValue === value;
  
  if (!isActive) return null;
  
  return (
    <div
      role="tabpanel"
      data-state={isActive ? "active" : "inactive"}
      data-value={value}
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

// Set up component aliases
const Tabs = TabsRoot;
TabsList.displayName = "TabsList";
TabsTrigger.displayName = "TabsTrigger";
TabsContent.displayName = "TabsContent";

// Load Radix UI in client-side only
if (typeof window !== 'undefined') {
  // Function to load script
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
