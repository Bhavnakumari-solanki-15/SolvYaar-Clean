import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './MathChaos.css';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import section components
import Personas from './sections/Personas';
import MemeLab from './sections/MemeLab';
import UnfilteredMathGPT from './sections/UnfilteredMathGPT';

const MathChaos: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('personas');

  const sections = [
    { id: 'personas', label: 'Personas', component: <Personas /> },
    { id: 'meme-lab', label: 'Meme Lab', component: <MemeLab /> },
    { id: 'unfiltered-math', label: 'Unfiltered MathGPT', component: <UnfilteredMathGPT /> }
  ];

  return (
    <div className="math-chaos-container">
      <div className="section-overlay"></div>
      <div className="section-content">
        <div className="math-chaos-header">
          <h1 className="professional-title">MATH CHAOS</h1>
          <p>Where Math Meets Mayhem</p>
        </div>
        
        <div className="sections-nav">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              className={cn(
                "px-6 py-3 rounded-xl font-semibold transition-all duration-200 text-lg",
                activeSection === section.id 
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-[0_0_24px_#a855f7] border border-purple-400 hover:brightness-110" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </Button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="section-content"
          >
            {sections.find(s => s.id === activeSection)?.component}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MathChaos; 