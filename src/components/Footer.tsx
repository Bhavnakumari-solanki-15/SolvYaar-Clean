import { Link } from "react-router-dom";
import { Calculator, Github, Twitter, BookOpen, HelpCircle, Linkedin } from "lucide-react";
import { useEffect, useState } from "react";

const Footer = () => {
  // For the clock (optional)
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="relative z-10">
      {/* 3D Mathematical Grid Background */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="w-full h-full math-3d-grid opacity-[0.15] dark:opacity-[0.2]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      </div>
      {/* Glassy Panel with Neon Border */}
      <div className="container mx-auto px-4 py-10 relative">
        <div className="rounded-3xl shadow-md bg-background/95 dark:bg-background/80 backdrop-blur-xl border border-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-8">
            {/* Brand Block */}
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shadow-sm border border-primary/20 backdrop-blur-sm">
                  <Calculator className="h-6 w-6 text-primary" />
                </span>
                <span className="font-extrabold text-2xl text-foreground">SolvYaar</span>
              </div>
              <span className="text-sm text-muted-foreground max-w-xs block">
                AI-powered math solver for all your mathematical needs.
              </span>
              <div className="mt-2 flex space-x-4">
                
                <a href="https://github.com/Bhavnakumari-solanki-15" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-6 w-6" />
                  <span className="sr-only">GitHub</span>
                </a>
                <a href="https://github.com/ShravanGupta07" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-6 w-6" />
                  <span className="sr-only">GitHub</span>
                </a>
                <a href="https://github.com/rustyy1" className="text-muted-foreground hover:text-primary transition-colors">
                  <Github className="h-6 w-6" />
                  <span className="sr-only">GitHub</span>
                </a>
              </div>
              <div className="mt-2 flex space-x-4">
                <a href="https://www.linkedin.com/in/bhavna-solanki-a03b8728a/" className="text-muted-foreground hover:text-[#0077b5] transition-colors">
                  <Linkedin className="h-6 w-6" />
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a href="https://www.linkedin.com/in/shravan-gupta-b785712a5/" className="text-muted-foreground hover:text-[#0077b5] transition-colors">
                  <Linkedin className="h-6 w-6" />
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a href="https://www.linkedin.com/in/vipul-gavade-1b788826b/" className="text-muted-foreground hover:text-[#0077b5] transition-colors">
                  <Linkedin className="h-6 w-6" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              </div>
            </div>
            {/* Enhanced Link Columns */}
            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
              {/* Product */}
              <div className="rounded-xl bg-background/50 dark:bg-background/40 backdrop-blur-sm shadow-sm p-6 flex flex-col items-start group transition-all hover:bg-background/70 dark:hover:bg-background/60">
                <h3 className="text-base font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                  Products
                </h3>
                <ul className="space-y-2 w-full">
                  <li>
                    <Link to="/solver" className="block text-muted-foreground hover:text-foreground transition-colors">
                      Solver
                    </Link>
                  </li>
                  <li>
                    <Link to="/practice" className="block text-muted-foreground hover:text-foreground transition-colors">
                      Practice
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div className="rounded-xl bg-background/50 dark:bg-background/40 backdrop-blur-sm shadow-sm p-6 flex flex-col items-start group transition-all hover:bg-background/70 dark:hover:bg-background/60">
                <h3 className="text-base font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                  Services
                </h3>
                <ul className="space-y-2 w-full">
                  <li>
                    <Link to="/math-mentor" className="block text-muted-foreground hover:text-foreground transition-colors">
                      Mentor
                    </Link>
                  </li>
                  <li>
                    <Link to="/science-calculators" className="block text-muted-foreground hover:text-foreground transition-colors">
                      Science
                    </Link>
                  </li>
                </ul>
              </div>
              
              {/* Resources - moved to last position */}
              <div className="rounded-xl bg-background/50 dark:bg-background/40 backdrop-blur-sm shadow-sm p-6 flex flex-col items-start group transition-all hover:bg-background/70 dark:hover:bg-background/60">
                <h3 className="text-base font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                  Resources
                </h3>
                <ul className="space-y-2 w-full">
                  <li>
                    <Link to="/documentation" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <BookOpen className="h-4 w-4" />
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="h-4 w-4" />
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/* Bottom Bar */}
          <div className="h-px w-full bg-border opacity-50" />
          <div className="flex flex-col md:flex-row justify-between items-center px-8 py-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SolvYaar. All rights reserved.
            </p>
            <div className="flex items-center gap-2 mt-2 md:mt-0">
              <span className="text-xs text-muted-foreground">{time.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
