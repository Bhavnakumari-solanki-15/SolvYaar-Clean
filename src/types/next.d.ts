declare module 'next/router' {
  export interface NextRouter {
    route: string;
    pathname: string;
    query: { [key: string]: string | string[] | undefined };
    asPath: string;
    push(url: string, as?: string, options?: any): Promise<boolean>;
    replace(url: string, as?: string, options?: any): Promise<boolean>;
    reload(): void;
    back(): void;
    prefetch(url: string): Promise<void>;
    beforePopState(cb: (state: any) => boolean): void;
    events: {
      on(type: string, handler: (...events: any[]) => void): void;
      off(type: string, handler: (...events: any[]) => void): void;
      emit(type: string, ...events: any[]): void;
    };
    isFallback: boolean;
    isReady: boolean;
    isPreview: boolean;
  }

  export function useRouter(): NextRouter;
}

declare module 'next/link' {
  import { ReactElement, ReactNode } from 'react';
  
  export interface LinkProps {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean;
    locale?: string | false;
    children?: ReactNode;
  }
  
  export default function Link(props: LinkProps): ReactElement;
} 