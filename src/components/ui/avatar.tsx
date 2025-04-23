import * as React from "react"
// Replace direct import with our own implementation
// import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

// Custom interfaces for our Avatar components
interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  asChild?: boolean;
  onLoadingStatusChange?: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  delayMs?: number;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
)
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, onError, onLoadingStatusChange, ...props }, ref) => {
    const [status, setStatus] = React.useState<'idle' | 'loading' | 'loaded' | 'error'>(
      src ? 'loading' : 'idle'
    )
    
    React.useEffect(() => {
      if (!src) {
        setStatus('idle')
        onLoadingStatusChange?.('idle')
        return
      }
      
      setStatus('loading')
      onLoadingStatusChange?.('loading')
    }, [src, onLoadingStatusChange])
    
    const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setStatus('error')
      onLoadingStatusChange?.('error')
      onError?.(e)
    }
    
    const handleLoad = () => {
      setStatus('loaded')
      onLoadingStatusChange?.('loaded')
    }
    
    return (
      <img
        ref={ref}
        className={cn(
          "aspect-square h-full w-full",
          status !== 'loaded' && "hidden",
          className
        )}
        src={src}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, delayMs = 600, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(delayMs === 0)
    
    React.useEffect(() => {
      if (delayMs === 0) return
      
      const timeout = setTimeout(() => {
        setIsVisible(true)
      }, delayMs)
      
      return () => clearTimeout(timeout)
    }, [delayMs])
    
    if (!isVisible) return null
    
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-muted",
          className
        )}
        {...props}
      />
    )
  }
)
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
