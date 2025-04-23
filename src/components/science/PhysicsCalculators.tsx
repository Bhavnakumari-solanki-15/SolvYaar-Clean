import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpacePhysicsExplorer } from './visualizations/SpacePhysicsExplorer';
import { WavePhenomena } from './visualizations/WavePhenomena';
import { EMFieldSimulator } from './visualizations/EMFieldSimulator';
import { Globe2, Waves, Zap, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import { KineticEnergyCalculator } from './calculators/KineticEnergyCalculator';
import { NewtonsSecondLawCalculator } from './calculators/NewtonsSecondLawCalculator';
import { FreeFallCalculator } from './calculators/FreeFallCalculator';
import { PowerCalculator } from './calculators/PowerCalculator';
import { OhmsLawCalculator } from './calculators/OhmsLawCalculator';

// Physics Calculator Components (to be implemented)
const KinematicsCalculator = () => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>Kinematics Calculator</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Implement kinematics calculator */}
      <p>Calculate velocity, acceleration, displacement, and time.</p>
    </CardContent>
  </Card>
);

const DynamicsCalculator = () => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>Dynamics Calculator</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Implement dynamics calculator */}
      <p>Calculate forces, momentum, and energy.</p>
    </CardContent>
  </Card>
);

const WaveCalculator = () => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>Wave Properties Calculator</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Implement wave calculator */}
      <p>Calculate wavelength, frequency, period, and wave speed.</p>
    </CardContent>
  </Card>
);

export function PhysicsCalculators() {
  const [activeTab, setActiveTab] = useState('visualizations');
  const [activeVisualization, setActiveVisualization] = useState<string | null>(null);
  const [activeCalculator, setActiveCalculator] = useState<string | null>(null);

  const visualizations = [
    {
      id: 'space',
      title: 'Space Physics Explorer',
      description: 'Explore planetary motion and gravitational interactions',
      icon: <Globe2 className="w-8 h-8" />,
      component: <SpacePhysicsExplorer />
    },
    {
      id: 'waves',
      title: 'Wave Phenomena',
      description: 'Visualize different types of waves and their behavior',
      icon: <Waves className="w-8 h-8" />,
      component: <WavePhenomena />
    },
    {
      id: 'em',
      title: 'EM Field Simulator',
      description: 'Simulate electric and magnetic fields',
      icon: <Zap className="w-8 h-8" />,
      component: <EMFieldSimulator />
    }
  ];

  const calculators = [
    {
      id: 'kinetic-energy',
      title: 'Kinetic Energy Calculator',
      description: 'Calculate kinetic energy from mass and velocity',
      component: () => <KineticEnergyCalculator />
    },
    {
      id: 'newtons-law',
      title: 'Newton\'s Second Law',
      description: 'Calculate force using mass and acceleration',
      component: () => <NewtonsSecondLawCalculator />
    },
    {
      id: 'free-fall',
      title: 'Free Fall Calculator',
      description: 'Calculate distance in free fall motion',
      component: () => <FreeFallCalculator />
    },
    {
      id: 'power',
      title: 'Power Calculator',
      description: 'Calculate electrical power from voltage and current',
      component: () => <PowerCalculator />
    },
    {
      id: 'ohms-law',
      title: 'Ohm\'s Law Calculator',
      description: 'Calculate voltage using current and resistance',
      component: () => <OhmsLawCalculator />
    }
  ];

  const handleCalculatorClick = (id: string) => {
    setActiveCalculator(activeCalculator === id ? null : id);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent mb-6">
        Interactive Physics Tools
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          <TabsTrigger value="calculators">Calculators</TabsTrigger>
        </TabsList>

        <TabsContent value="visualizations" className="space-y-4">
          {!activeVisualization ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visualizations.map((viz) => (
                <Card
                  key={viz.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setActiveVisualization(viz.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      {viz.icon}
                      <CardTitle>{viz.title}</CardTitle>
                    </div>
                    <CardDescription>{viz.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setActiveVisualization(null)}
                className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to visualizations
              </button>
              {visualizations.find(v => v.id === activeVisualization)?.component}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculators" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculators.map((calc) => (
              <div key={calc.id} className="space-y-4">
                <Card 
                  className={`cursor-pointer transition-all duration-300 ${
                    activeCalculator === calc.id ? 'ring-2 ring-primary' : 'hover:bg-accent'
                  }`}
                  onClick={() => handleCalculatorClick(calc.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">{calc.title}</CardTitle>
                      </div>
                      {activeCalculator === calc.id ? (
                        <ChevronUp className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                    <CardDescription>{calc.description}</CardDescription>
                  </CardHeader>
                  {activeCalculator === calc.id && (
                    <CardContent className="pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                      {calc.component()}
                    </CardContent>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 