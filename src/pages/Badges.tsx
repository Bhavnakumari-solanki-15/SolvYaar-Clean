import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge as UserBadge, BADGE_CONFIGS, BadgeCategory } from "@/types/badge.types";
import { badgeService } from "@/services/badgeService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Lock, Medal, Trophy } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";

const BadgeCategoryLabels: Record<BadgeCategory, string> = {
  algebra: "Algebra",
  geometry: "Geometry",
  trigonometry: "Trigonometry",
  calculus: "Calculus",
  statistics: "Statistics",
  arithmetic: "Arithmetic",
  linear_algebra: "Linear Algebra",
  number_theory: "Number Theory",
  discrete_math: "Discrete Math",
  set_theory: "Set Theory",
  transformations: "Transformations"
};

const Badges = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    if (user?.id) {
      fetchUserBadges();
    }
  }, [user]);

  const fetchUserBadges = async () => {
    try {
      setLoadingBadges(true);
      const userBadges = await badgeService.getUserBadges(user!.id);
      setBadges(userBadges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      toast.error("Failed to load badges");
    } finally {
      setLoadingBadges(false);
    }
  };

  // Get all badge categories from our badge configs
  const allCategories = Object.keys(BADGE_CONFIGS);
  
  // Filter badges by selected category
  const filteredBadges = selectedCategory === "all" 
    ? badges 
    : badges.filter(badge => badge.category === selectedCategory);

  // Count badges by category
  const badgeCounts = badges.reduce((acc, badge) => {
    acc[badge.category] = (acc[badge.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse max-w-5xl mx-auto space-y-8">
          <div className="h-20 bg-muted rounded-lg"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Badges Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view your achievement badges.
          </p>
          <Link to="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Achievement Badges</h1>
            <p className="text-muted-foreground">
              Showcase your math prowess and accomplishments
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="font-medium">{badges.length} Badges Earned</span>
          </div>
        </div>

        {badges.length === 0 && !loadingBadges && (
          <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-800 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-400">No badges yet</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-500">
              Complete practice exercises and games to earn your first achievement badge!
            </AlertDescription>
            <Button 
              className="mt-3 bg-amber-600 hover:bg-amber-700 text-white" 
              size="sm"
              onClick={() => window.location.href = "/practice"}
            >
              Start Practicing
            </Button>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Medal className="h-5 w-5 text-primary mr-2" />
              Badge Collection
            </CardTitle>
            <CardDescription>
              Badges represent your mastery across different mathematics topics
            </CardDescription>
            
            
          </CardHeader>
          
          <CardContent>
            {loadingBadges ? (
              <div className="flex justify-center py-8">
                <div className="animate-pulse grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-40 bg-muted rounded-lg"></div>
                  ))}
                </div>
              </div>
            ) : filteredBadges.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredBadges.map((badge) => {
                  const badgeConfig = BADGE_CONFIGS[badge.category];
                  const style = badgeConfig?.style || {
                    light: { background: 'bg-primary/10 p-3 rounded-full' },
                    dark: { background: 'bg-primary/20 p-3 rounded-full' }
                  };
                  
                  return (
                    <div 
                      key={badge.id} 
                      className="group relative overflow-hidden rounded-lg border border-border transition-all hover:shadow-md"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="p-6 flex flex-col items-center text-center">
                        <div className={`${style.light.background} mb-4`}>
                          <span className="text-4xl">{badge.icon}</span>
                        </div>
                        <h3 className="font-medium text-lg mb-1">{badge.name}</h3>
                        <p className="text-sm text-muted-foreground">{badge.description}</p>
                        
                        <Badge variant="outline" className="mt-3 bg-primary/5">
                          {BadgeCategoryLabels[badge.category as BadgeCategory] || badge.category}
                        </Badge>
                        
                        <div className="text-xs text-muted-foreground mt-3">
                          Earned {new Date(badge.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-dashed mb-4">
                  <Medal className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No badges in this category</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Complete more exercises in this topic to earn your first badge!
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setSelectedCategory("all")}>
                  View all categories
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {badges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Badge Progress</CardTitle>
              <CardDescription>Track your badge collection progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You've collected {badges.length} out of {Object.keys(BADGE_CONFIGS).length} possible badges.
                </p>
                
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full" 
                    style={{ width: `${(badges.length / Object.keys(BADGE_CONFIGS).length) * 100}%` }}
                  ></div>
                </div>
                
                <div className="pt-4">
                  <h4 className="text-sm font-medium mb-3">Missing Badges</h4>
                  <div className="flex flex-wrap gap-2">
                    {allCategories
                      .filter(category => !badges.some(badge => badge.category === category))
                      .map(category => (
                        <Badge 
                          key={category} 
                          variant="outline" 
                          className="bg-muted/50"
                        >
                          {BadgeCategoryLabels[category as BadgeCategory] || category}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Badges; 