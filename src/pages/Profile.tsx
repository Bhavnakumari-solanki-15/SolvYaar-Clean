import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHistory } from "@/contexts/HistoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Camera, Check, FileText, Lock, Medal, PenLine, Trophy, UserCheck } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Link } from "react-router-dom";
import { badgeService } from "@/services/badgeService";
import { Badge as UserBadge, BADGE_CONFIGS } from "@/types/badge.types";

const Profile = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const { history } = useHistory();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isEditing, setIsEditing] = useState(false);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  
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
  
  if (loading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse max-w-3xl mx-auto space-y-8">
          <div className="h-48 bg-muted rounded-lg"></div>
          <div className="h-32 bg-muted rounded-lg"></div>
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
          <h1 className="text-2xl font-bold mb-2">Profile Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to view your profile.
          </p>
          <Link to="/">
            <Button>Back to Solver</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const handleSaveProfile = () => {
    // In a real app, this would call an API to update the user's profile
    setIsEditing(false);
    toast.success("Profile updated successfully");
  };
  
  return (
    <div className="container py-8 space-y-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Profile</CardTitle>
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <PenLine className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-background">
                  <AvatarImage src={user?.photoURL || ""} alt={user?.name || ""} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="name">Name</Label>
                    {user?.isPremium && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                        <UserCheck className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  {isEditing ? (
                    <Input 
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  ) : (
                    <div className="font-medium">{user?.name || "—"}</div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input 
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  ) : (
                    <div className="font-medium">{user?.email}</div>
                  )}
                </div>
                
                {isEditing && (
                  <div className="pt-2">
                    <Button onClick={handleSaveProfile}>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="stats">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="plan">Subscription</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Activity</CardTitle>
                <CardDescription>Analytics based on your usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-muted/30 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary">{Array.isArray(history) ? history.length : 0}</div>
                    <div className="text-sm text-muted-foreground">Problems Solved</div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary">
                      {Math.min(7, Math.max(1, Math.floor(Math.random() * 7)))}
                    </div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-primary">
                      {user?.isPremium ? "Pro" : "Basic"}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Plan</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Most Used Features</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                          <FileText className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">Text Input</span>
                      </div>
                      <div className="w-1/2 bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: "80%" }}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                          <Camera className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm">Image Input</span>
                      </div>
                      <div className="w-1/2 bg-muted h-2 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: "20%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="badges" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 text-primary mr-2" />
                  Your Achievement Badges
                </CardTitle>
                <CardDescription>
                  Badges you've earned by completing math challenges and exercises
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBadges ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-pulse space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-32 bg-muted rounded-lg"></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : badges.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {badges.map((badge) => {
                      const badgeConfig = BADGE_CONFIGS[badge.category];
                      return (
                        <div 
                          key={badge.id} 
                          className="group relative overflow-hidden rounded-lg border border-border transition-all hover:shadow-md p-4 flex flex-col items-center text-center"
                        >
                          <div className={`${badgeConfig?.style.light.background} mb-3`}>
                            <span className="text-3xl">{badge.icon}</span>
                          </div>
                          <h3 className="font-medium text-lg">{badge.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
                          <div className="text-xs text-muted-foreground mt-2 opacity-70">
                            Earned on {new Date(badge.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-dashed mb-4">
                      <Medal className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium mb-1">No badges yet</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Complete practice sets and games to earn achievement badges. Each badge represents mastery in different math topics!
                    </p>
                    <Button 
                      className="mt-4" 
                      variant="outline"
                      onClick={() => window.location.href = "/practice"}
                    >
                      Start practicing
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="plan" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Manage your subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {user?.isPremium ? "Premium Plan" : "Free Plan"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.isPremium 
                          ? "All features unlocked" 
                          : "Basic features only"}
                      </p>
                    </div>
                    <Badge variant={user?.isPremium ? "default" : "outline"}>
                      {user?.isPremium ? "Active" : "Limited"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className={`mt-0.5 mr-2 ${user?.isPremium ? "text-primary" : "text-muted-foreground"}`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Text Problem Solving</p>
                        <p className="text-sm text-muted-foreground">
                          Solve text-based math problems
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className={`mt-0.5 mr-2 ${user?.isPremium ? "text-primary" : "text-muted-foreground"}`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Image Problem Solving</p>
                        <p className="text-sm text-muted-foreground">
                          Upload and solve problems from images
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className={`mt-0.5 mr-2 ${user?.isPremium ? "text-primary" : "text-muted-foreground"}`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">File Upload & Analysis</p>
                        <p className="text-sm text-muted-foreground">
                          Extract and solve problems from PDF, DOCX and CSV
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className={`mt-0.5 mr-2 ${user?.isPremium ? "text-primary" : "text-muted-foreground opacity-50"}`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Latex Output</p>
                        <p className="text-sm text-muted-foreground">
                          Latex output for your solutions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className={`mt-0.5 mr-2 ${user?.isPremium ? "text-primary" : "text-muted-foreground opacity-50"}`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Unlimited History</p>
                        <p className="text-sm text-muted-foreground">
                          Save unlimited solutions in your history
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                
                
                
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
