import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Calculator, History, BarChart3, User, Settings, BookOpen, LogOut, Beaker, BarChart2, Trophy, Sparkles, Wand2, LockIcon, Menu, X } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";
import { useIsMobile } from "../hooks/use-mobile";
import { useToast } from "../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItemProps {
  to: string;
  icon: React.FC<{ className?: string }>;
  label: string;
  isActive: boolean;
  disabled?: boolean;
  requiresAuth?: boolean;
}

const NavItem = ({ to, icon: Icon, label, isActive, disabled, requiresAuth }: NavItemProps) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={to}
            className={cn(
              "flex h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors touch-target",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-foreground/60 hover:bg-accent/50 hover:text-accent-foreground",
              disabled && "pointer-events-none opacity-30"
            )}
            onClick={(e) => {
              if (requiresAuth && !isAuthenticated) {
                e.preventDefault();
              }
            }}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
            {requiresAuth && !isAuthenticated && (
              <LockIcon className="ml-1 h-3 w-3" />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          {requiresAuth && !isAuthenticated 
            ? `Login required to access ${label}`
            : label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const MobileNavItem = ({ to, icon: Icon, label, isActive, disabled, requiresAuth }: NavItemProps) => {
  const { isAuthenticated } = useAuth();
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-3 text-base transition-colors touch-target",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-foreground/70 hover:bg-accent/50 hover:text-accent-foreground",
        disabled && "pointer-events-none opacity-30"
      )}
      onClick={(e) => {
        if (requiresAuth && !isAuthenticated) {
          e.preventDefault();
        }
      }}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="truncate">{label}</span>
      {requiresAuth && !isAuthenticated && (
        <LockIcon className="ml-1 h-3 w-3 flex-shrink-0" />
      )}
    </Link>
  );
};

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user, signOut, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Force detect mobile
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const forceMobile = windowWidth < 768;

  // Log the state of mobile detection
  useEffect(() => {
    console.log('useIsMobile says:', isMobile);
    console.log('Window width says:', windowWidth, 'forceMobile:', forceMobile);

    function handleResize() {
      setWindowWidth(window.innerWidth);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, windowWidth]);
  
  const isAdmin = () => {
    return user && user.role === 'admin';
  };
  
  const isDeveloper = () => {
    return user && user.role === 'developer';
  };
  
  const handleLogout = async () => {
    try {
      setMobileMenuOpen(false);
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center px-2 sm:px-4">
        {/* Left side with logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center justify-center mr-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="ml-2 text-lg font-bold tracking-tight hidden sm:inline-block">
              SolvYaar
            </span>
          </Link>

          {/* Mobile hamburger menu - Positioned on the left */}
          {(isMobile || forceMobile) && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="touch-target">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col w-[85vw] max-w-[300px] py-6">
                <div className="flex items-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6 text-primary"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="ml-2 text-lg font-bold tracking-tight truncate">
                    SolvYaar
                  </span>
                </div>
                
                <div className="flex flex-col gap-2 mb-6 overflow-y-auto">
                  <MobileNavItem 
                    to="/solver" 
                    icon={Calculator} 
                    label="Solver" 
                    isActive={location.pathname === "/solver"}
                  />
                  <MobileNavItem 
                    to="/math-mentor" 
                    icon={BookOpen} 
                    label="Mentor" 
                    isActive={location.pathname === "/math-mentor"}
                    disabled={!isAuthenticated}
                    requiresAuth={true}
                  />
                  <MobileNavItem 
                    to="/math-oracle" 
                    icon={Wand2} 
                    label="Oracle" 
                    isActive={location.pathname === "/math-oracle"}
                    disabled={!isAuthenticated}
                    requiresAuth={true}
                  />
                  <MobileNavItem 
                    to="/math-chaos" 
                    icon={Sparkles} 
                    label="Chaos" 
                    isActive={location.pathname === "/math-chaos"}
                    disabled={!isAuthenticated}
                    requiresAuth={true}
                  />
                  <MobileNavItem 
                    to="/science-calculators" 
                    icon={Beaker} 
                    label="Science" 
                    isActive={location.pathname === "/science-calculators"}
                    disabled={!isAuthenticated}
                    requiresAuth={true}
                  />
                  
                  {(isAdmin() || isDeveloper()) && (
                    <MobileNavItem 
                      to="/dashboard" 
                      icon={BarChart2} 
                      label="Dashboard" 
                      isActive={location.pathname === "/dashboard"}
                    />
                  )}
                </div>
                
                <div className="mt-auto flex flex-col gap-2">
                  {isAuthenticated ? (
                    <>
                      <MobileNavItem 
                        to="/profile" 
                        icon={User} 
                        label="Profile" 
                        isActive={location.pathname === "/profile"}
                      />
                      <MobileNavItem 
                        to="/history" 
                        icon={History} 
                        label="History" 
                        isActive={location.pathname === "/history"}
                      />
                      <Button 
                        variant="outline" 
                        className="justify-start gap-2 h-12 text-base"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">Logout</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/login" 
                        className="flex h-12 items-center gap-2 rounded-md px-3 py-3 text-base transition-colors touch-target bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <span className="truncate">Login</span>
                      </Link>
                      <Link 
                        to="/signup" 
                        className="flex h-12 items-center gap-2 rounded-md px-3 py-3 text-base transition-colors touch-target border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                      >
                        <span className="truncate">Sign Up</span>
                      </Link>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
        
        {/* Center area with desktop navigation */}
        <div className="flex-1 flex justify-center">
          {!isMobile && !forceMobile && (
            <nav className="hidden md:flex items-center space-x-4">
              <NavItem 
                to="/solver" 
                icon={Calculator} 
                label="Solver" 
                isActive={location.pathname === "/solver"}
              />
              <NavItem 
                to="/math-mentor" 
                icon={BookOpen} 
                label="Mentor" 
                isActive={location.pathname === "/math-mentor"}
                disabled={!isAuthenticated}
                requiresAuth={true}
              />
              <NavItem 
                to="/math-oracle" 
                icon={Wand2} 
                label="Oracle" 
                isActive={location.pathname === "/math-oracle"}
                disabled={!isAuthenticated}
                requiresAuth={true}
              />
              <NavItem 
                to="/math-chaos" 
                icon={Sparkles} 
                label="Chaos" 
                isActive={location.pathname === "/math-chaos"}
                disabled={!isAuthenticated}
                requiresAuth={true}
              />
              <NavItem 
                to="/science-calculators" 
                icon={Beaker} 
                label="Science" 
                isActive={location.pathname === "/science-calculators"}
                disabled={!isAuthenticated}
                requiresAuth={true}
              />
              
              {(isAdmin() || isDeveloper()) && (
                <NavItem 
                  to="/dashboard" 
                  icon={BarChart2} 
                  label="Dashboard" 
                  isActive={location.pathname === "/dashboard"}
                />
              )}
            </nav>
          )}
        </div>
        
        {/* Right side with user controls */}
        <div className="flex items-center justify-end">
          <ModeToggle />
          
          {/* User account dropdown (desktop) */}
          {!isMobile && !forceMobile && (
            <div className="ml-4">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full touch-target">
                      <User className="h-5 w-5" />
                      <span className="sr-only">User menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center gap-2 cursor-pointer touch-target">
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/history" className="flex items-center gap-2 cursor-pointer touch-target">
                        <History className="h-4 w-4" />
                        <span>History</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-500 flex gap-2 cursor-pointer touch-target" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" className="h-9 touch-target">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button asChild className="h-9 touch-target">
                    <Link to="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
