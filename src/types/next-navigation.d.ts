declare module 'next/navigation' {
  export function useRouter(): {
    push: (url: string) => void;
    replace: (url: string) => void;
    back: () => void;
    forward: () => void;
    refresh: () => void;
    prefetch: (url: string) => void;
  };
  
  export function useSearchParams(): {
    get: (key: string) => string | null;
    getAll: (key: string) => string[];
    has: (key: string) => boolean;
    keys: () => IterableIterator<string>;
    values: () => IterableIterator<string>;
    entries: () => IterableIterator<[string, string]>;
    toString: () => string;
  };
  
  export function usePathname(): string;
  
  export function useParams<T = Record<string, string | string[]>>(): T;
} 