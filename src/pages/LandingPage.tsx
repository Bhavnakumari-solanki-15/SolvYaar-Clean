import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { BookOpen, Calculator, Lightbulb, BrainCircuit, GraduationCap, Share2, ArrowRight, Sparkles, Gamepad, GemIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import LandingNavbar from '@/components/LandingNavbar';
import BackgroundEffects from '@/components/BackgroundEffects';
import DemoSection from '@/components/DemoSection';
import WizardCanvas from '@/components/WizardCanvas';
import Footer from '@/components/Footer';
import CubeWireframeCanvas from '@/components/CubeWireframeCanvas';

// Feature card component
const FeatureCard = ({ title, description, icon, delay }: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  delay: number; 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all border border-border bg-background/95 dark:bg-background/80 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="mb-4 p-3 rounded-full w-12 h-12 bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LandingPage = () => {
  const [motionReduced, setMotionReduced] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMotionReduced(prefersReducedMotion);
  }, []);

  const features = [
    {
      title: "AI-Powered Solutions",
      description: "Watch problems solve themselves step-by-step with our advanced AI algorithms.",
      icon: <BrainCircuit className="h-6 w-6" />,
    },
    {
      title: "Multiple Subjects",
      description: "From algebra to calculus, physics to chemistry — we've got all your STEM needs covered.",
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      title: "Interactive Games",
      description: "Learn math through engaging games and puzzles that make practice fun and rewarding.",
      icon: <Gamepad className="h-6 w-6" />,
    },
    {
      title: "Mathematical Fortune",
      description: "Receive mystical mathematical fortunes powered by AI and mint them as unique NFTs on the blockchain.",
      icon: <GemIcon className="h-6 w-6" />,
    },
    {
      title: "Math Mentor",
      description: "Get personalized guidance and support from our AI math mentor to master any mathematical concept.",
      icon: <GraduationCap className="h-6 w-6" />,
    },
    {
      title: "Mathematical Chaos",
      description: "Explore the fascinating world of chaos theory and fractals through interactive mathematical visualizations.",
      icon: <Share2 className="h-6 w-6" />,
    }
  ];

  const testimonials = [
    {
      name: "Sarah K.",
      role: "High School Student",
      content: "SolvYaar helped me improve my calculus grade from a C to an A. The step-by-step explanations make complex concepts so much easier to understand!",
      avatar: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    {
      name: "Michael T.",
      role: "College Student",
      content: "I was struggling with differential equations until I found SolvYaar. The visualizations and practice problems have been a game-changer for me.",
      avatar: "https://randomuser.me/api/portraits/men/45.jpg"
    },
    {
      name: "Dr. Jessica Chen",
      role: "Math Professor",
      content: "I recommend SolvYaar to all my students. It's an excellent supplement to classroom learning, and the AI explanations are remarkably clear and accurate.",
      avatar: "https://randomuser.me/api/portraits/women/68.jpg"
    }
  ];

  // Use a ref for the hero section
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroSectionRef,
    offset: ["start start", "end start"]
  });
  
  const heroY = useTransform(heroScrollProgress, [0, 1], [0, 300]);
  const heroOpacity = useTransform(heroScrollProgress, [0, 0.8], [1, 0]);

  return (
    <div className={`relative ${motionReduced ? 'reduced-motion' : ''}`}>
      {/* Progress bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 z-50 origin-left"
        style={{ scaleX }}
      />
      
      {/* Background elements */}
      <BackgroundEffects />
      
      {/* Navbar */}
      <LandingNavbar />
      
      {/* Main content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section 
          ref={heroSectionRef}
          className="min-h-screen pt-20 md:pt-32 pb-16 md:pb-20 relative overflow-hidden"
          id="hero"
        >
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="particle hide-xs" 
                style={{
                  width: `${Math.random() * 6 + 2}px`,
                  height: `${Math.random() * 6 + 2}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.5 + 0.3,
                  animationDuration: `${Math.random() * 20 + 10}s`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              />
            ))}
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left content */}
              <motion.div 
                className="stagger-animate text-center lg:text-left"
                style={{ y: heroY, opacity: heroOpacity }}
              >
                <motion.h1 
                  className="text-responsive-5xl font-bold gradient-text mb-4 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  SolvYaar
                </motion.h1>
                
                <motion.h2 
                  className="text-responsive-2xl text-foreground/90 mb-6 max-w-xl mx-auto lg:mx-0 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  Your AI-Powered <span className="text-primary font-semibold">Math</span> Companion
                </motion.h2>
                
                <motion.p 
                  className="text-responsive-base text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Solve any math problem instantly with step-by-step explanations. 
                  From algebra to calculus, our AI solver has the magic touch.
                </motion.p>
                
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Link to="/solver" className="btn-primary flex items-center justify-center gap-2 group py-3 px-6 touch-target">
                    Start Solving
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <a href="#features" className="btn-secondary flex items-center justify-center py-3 px-6 touch-target">
                    Explore Features
                  </a>
                </motion.div>
                
                <motion.div 
                  className="mt-12 flex items-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  
                </motion.div>
              </motion.div>
              
              {/* Right content - 3D wizard */}
              <motion.div 
                className="h-[300px] sm:h-[400px] lg:h-[500px] max-w-lg mx-auto lg:max-w-none relative flex items-center justify-center order-first lg:order-last"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <div className="absolute inset-0">
                  <WizardCanvas />
                </div>
                
                {/* Floating equations - hide some on very small screens */}
                <div className="absolute top-1/4 left-1/4 glass-panel-equation float-slow hide-xs">
                  E = mc<sup>2</sup>
                </div>
                <div className="absolute bottom-1/3 right-1/3 glass-panel-equation float">
                  F = ma
                </div>
                <div className="absolute top-1/2 right-1/5 glass-panel-equation float-fast hide-xs">
                  a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup>
                </div>
              </motion.div>
            </div>
            
            {/* Stats */}
            <motion.div 
              className="mt-12 md:mt-16 lg:mt-24"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <div className="rounded-2xl md:rounded-3xl shadow-md bg-background/95 dark:bg-background/80 backdrop-blur-xl border border-border p-4 md:p-6">
                <div className="text-center">
                  <h3 className="text-responsive-xl font-bold text-foreground mb-2 md:mb-3">
                    Discover the Power of Mathematics
                  </h3>
                  <p className="text-responsive-sm text-muted-foreground max-w-2xl mx-auto">
                    Our advanced mathematical technology helps you visualize, solve, and understand complex concepts with ease.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
                  <div className="p-3 md:p-4 rounded-xl bg-background/50 dark:bg-background/40 backdrop-blur-sm shadow-sm flex items-center justify-center group transition-all hover:bg-background/70 dark:hover:bg-background/60">
                    <div className="text-center">
                      <div className="p-2 md:p-3 rounded-full bg-primary/10 w-10 h-10 md:w-12 md:h-12 mx-auto flex items-center justify-center mb-2 md:mb-3 border border-primary/20 shadow-sm">
                        <Calculator className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      </div>
                      <p className="text-xs md:text-sm font-medium text-foreground group-hover:text-primary transition-colors">Instant Problem Solving</p>
                    </div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-background/50 dark:bg-background/40 backdrop-blur-sm shadow-sm flex items-center justify-center group transition-all hover:bg-background/70 dark:hover:bg-background/60">
                    <div className="text-center">
                      <div className="p-2 md:p-3 rounded-full bg-primary/10 w-10 h-10 md:w-12 md:h-12 mx-auto flex items-center justify-center mb-2 md:mb-3 border border-primary/20 shadow-sm">
                        <Lightbulb className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      </div>
                      <p className="text-xs md:text-sm font-medium text-foreground group-hover:text-primary transition-colors">Step-by-Step Guidance</p>
                    </div>
                  </div>
                  <div className="p-3 md:p-4 rounded-xl bg-background/50 dark:bg-background/40 backdrop-blur-sm shadow-sm flex items-center justify-center group transition-all hover:bg-background/70 dark:hover:bg-background/60 sm:col-span-2 md:col-span-1">
                    <div className="text-center">
                      <div className="p-2 md:p-3 rounded-full bg-primary/10 w-10 h-10 md:w-12 md:h-12 mx-auto flex items-center justify-center mb-2 md:mb-3 border border-primary/20 shadow-sm">
                        <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                      </div>
                      <p className="text-xs md:text-sm font-medium text-foreground group-hover:text-primary transition-colors">Interactive Learning</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-16 md:h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        </section>

        {/* Demo Section */}
        <DemoSection />

        {/* Features Section */}
        <section id="features" className="py-16 md:py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <motion.h2 
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gradient-text inline-block"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Powerful Features
              </motion.h2>
              <motion.p 
                className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Unleash the full power of your mathematical potential with our suite of enchanted tools
              </motion.p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="group p-6 md:p-8 rounded-2xl bg-background/95 dark:bg-background/80 backdrop-blur-xl border border-border hover:border-primary/50 shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <div className="mb-5 p-3 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors duration-300">
                    {React.cloneElement(feature.icon, { className: "h-7 w-7 text-primary" })}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
            
            <motion.div 
              className="mt-12 md:mt-16 p-6 md:p-10 border border-border rounded-2xl bg-background/95 dark:bg-background/80 backdrop-blur-xl shadow-md"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
                <div>
                  <h3 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 text-foreground group-hover:text-primary transition-colors">
                    Interactive 3D Visualizations
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
                    Explore both mathematical and scientific concepts through stunning 3D visualizations. 
                    Rotate, zoom, and interact with complex models to gain deeper understanding and intuition.
                  </p>
                  <ul className="space-y-2 md:space-y-3">
                    {[
                      "Function graphing", 
                      "Molecular structures", 
                      "Physics simulations", 
                      "Anatomical models",
                      "Vector fields", 
                      "Surface plots"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl overflow-hidden border border-border shadow-md h-[250px] md:h-[300px] lg:h-[350px] bg-gradient-to-br from-background to-background/50 flex items-center justify-center">
                  <CubeWireframeCanvas />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQs Section */}
        <section id="faqs" className="py-16 md:py-24 relative">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-16">
              <motion.h2
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 gradient-text inline-block"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Frequently Asked Questions
              </motion.h2>
              <motion.p
                className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Everything you need to know about the SolvYaar platform
              </motion.p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="rounded-2xl md:rounded-3xl shadow-xl bg-background/95 dark:bg-background/80 backdrop-blur-xl border border-border overflow-hidden relative">
              {/* Decorative background elements */}
              <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute top-0 right-0 h-64 w-64 bg-primary blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 h-64 w-64 bg-indigo-600 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2"></div>
                {/* Math symbols */}
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="absolute text-primary/10 font-bold text-4xl"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      transform: `rotate(${Math.random() * 360}deg)`
                    }}
                  >
                    {["π", "∑", "∞", "√", "∫"][i % 5]}
                  </div>
                ))}
              </div>
              
              <CardContent className="p-6 md:p-10 relative z-10">
                <div className="text-center max-w-3xl mx-auto">
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 gradient-text inline-block">
                    Ready to Unlock Your Math Potential?
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground mb-8 md:mb-10">
                    Join thousands of students and educators who are already experiencing the magic of SolvYaar. 
                    Start your journey today with our free tier.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link 
                      to="/solver" 
                      className="btn-primary py-3 px-6 text-base md:text-lg font-medium hover:translate-y-[-2px] transition-transform touch-target"
                    >
                      Get Started Free
                    </Link>
                    <Link 
                      to="/examples"
                      className="btn-secondary py-3 px-6 text-base md:text-lg font-medium touch-target"
                    >
                      See Examples
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage; 