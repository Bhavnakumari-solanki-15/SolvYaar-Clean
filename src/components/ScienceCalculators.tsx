import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChemistryCalculators } from './science/ChemistryCalculators';
import { PhysicsCalculators } from './science/PhysicsCalculators';
import { BiologyCalculators } from './science/BiologyCalculators';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Beaker } from "lucide-react";

export function ScienceCalculators() {
  const { isAuthenticated } = useAuth();

  const handlePremiumFeatureClick = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to use this feature", {
        description: "Create an account to unlock all premium features.",
        action: {
          label: "Log in",
          onClick: () => {
            toast.info("Click the Login button in the header to get started");
          },
        },
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
        Science Calculators
      </h1>
      
      {!isAuthenticated ? (
        <div className="text-center py-12">
          <Beaker className="mx-auto h-16 w-16 text-purple-400 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Premium Science Tools</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Log in to access our advanced science calculators and tools
          </p>
          <Button 
            onClick={handlePremiumFeatureClick}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
          >
            Log in to Access
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="chemistry" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl gap-4 p-1 rounded-xl border border-purple-200/20 dark:border-purple-900/20">
            <TabsTrigger 
              value="chemistry" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_24px_#a855f7] data-[state=active]:border data-[state=active]:border-purple-400/50 data-[state=active]:hover:brightness-110
                       text-gray-900 dark:text-gray-100 hover:bg-white/40 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-gray-100 border border-transparent hover:border-purple-400/20 dark:hover:border-purple-900/20
                       px-4 py-2 rounded-xl font-semibold transition-all duration-200"
            >
              Chemistry
            </TabsTrigger>
            <TabsTrigger 
              value="physics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_24px_#a855f7] data-[state=active]:border data-[state=active]:border-purple-400/50 data-[state=active]:hover:brightness-110
                       text-gray-900 dark:text-gray-100 hover:bg-white/40 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-gray-100 border border-transparent hover:border-purple-400/20 dark:hover:border-purple-900/20
                       px-4 py-2 rounded-xl font-semibold transition-all duration-200"
            >
              Physics
            </TabsTrigger>
            <TabsTrigger 
              value="biology"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_24px_#a855f7] data-[state=active]:border data-[state=active]:border-purple-400/50 data-[state=active]:hover:brightness-110
                       text-gray-900 dark:text-gray-100 hover:bg-white/40 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-gray-100 border border-transparent hover:border-purple-400/20 dark:hover:border-purple-900/20
                       px-4 py-2 rounded-xl font-semibold transition-all duration-200"
            >
              Biology
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chemistry">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-purple-200/20 dark:border-purple-900/20">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Chemistry Calculators</CardTitle>
              </CardHeader>
              <CardContent>
                <ChemistryCalculators />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="physics">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-purple-200/20 dark:border-purple-900/20">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Physics Calculators</CardTitle>
              </CardHeader>
              <CardContent>
                <PhysicsCalculators />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="biology">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-purple-200/20 dark:border-purple-900/20">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">Biology Calculators</CardTitle>
              </CardHeader>
              <CardContent>
                <BiologyCalculators />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 