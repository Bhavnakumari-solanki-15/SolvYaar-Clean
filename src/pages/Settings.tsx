import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHistory } from "@/contexts/HistoryContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Lock, Download, Camera, Mail, User } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const Settings = () => {
  const { isAuthenticated, user, signOut, updatePassword, deleteAccount, unlinkGoogle, updateProfile } = useAuth();
  const { history } = useHistory();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: true,
    emailUpdates: false,
    darkMode: false,
    autoSave: true,
    showSteps: true,
    visualizations: true,
    latexOutput: true,
  });

  // Password change state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete account state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState("");

  // Profile edit state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [profilePhoto, setProfilePhoto] = useState(user?.photoURL || "");

  const handleToggleSetting = async (key: keyof typeof settings) => {
    try {
      setSettings({
        ...settings,
        [key]: !settings[key],
      });
      
      // If it's the autoSave setting, we might want to persist this to the user's preferences
      if (key === "autoSave") {
        // Here you would typically save this to your backend
        // await updateUserPreferences({ autoSave: !settings.autoSave });
      }
      
      toast.success("Setting updated", {
        description: `${key} has been ${settings[key] ? "disabled" : "enabled"}.`
      });
    } catch (error) {
      toast.error("Failed to update setting");
      // Revert the setting if the update failed
      setSettings(prev => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  const handleChangePassword = async () => {
    try {
      if (newPassword !== confirmPassword) {
        toast.error("New passwords don't match");
        return;
      }

      if (newPassword.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      await updatePassword(currentPassword, newPassword);
      setIsPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    } catch (error) {
      toast.error("Failed to update password");
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await unlinkGoogle();
      toast.success("Google account disconnected");
    } catch (error) {
      toast.error("Failed to disconnect Google account");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (confirmDelete !== "DELETE") {
        toast.error("Please type DELETE to confirm");
        return;
      }

      await deleteAccount();
      await signOut();
      navigate("/");
      toast.success("Account deleted successfully");
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };
  
  const handleDownloadData = () => {
    try {
      // Create a data object with user's information and history
      const userData = {
        user: {
          name: user?.name,
          email: user?.email,
          settings: settings
        },
        history: history
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(userData, null, 2);
      
      // Create blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'math-wizard-data.json';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data downloaded successfully");
    } catch (error) {
      console.error('Error downloading data:', error);
      toast.error("Failed to download data");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        name: profileName !== user?.name ? profileName : undefined,
        email: profileEmail !== user?.email ? profileEmail : undefined,
        photoURL: profilePhoto !== user?.photoURL ? profilePhoto : undefined
      });
      setEditingProfile(false);
    } catch (error) {
      // Error is handled by updateProfile
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="container py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Settings Access Restricted</h1>
          <p className="text-muted-foreground mb-6">
            Please log in to access settings.
          </p>
          <Link to="/">
            <Button>Back to Solver</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {user?.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            alt={user.name || "Profile"} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-medium text-lg">{user?.name}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingProfile(!editingProfile)}
                    >
                      {editingProfile ? "Cancel" : "Edit Profile"}
                    </Button>
                  </div>

                  {editingProfile && (
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <div className="flex gap-2">
                          <User className="w-4 h-4 mt-3 text-muted-foreground" />
                          <Input
                            id="name"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="Your name"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex gap-2">
                          <Mail className="w-4 h-4 mt-3 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            placeholder="Your email"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="photo">Profile Photo URL</Label>
                        <div className="flex gap-2">
                          <Camera className="w-4 h-4 mt-3 text-muted-foreground" />
                          <Input
                            id="photo"
                            value={profilePhoto}
                            onChange={(e) => setProfilePhoto(e.target.value)}
                            placeholder="https://example.com/photo.jpg"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <Button 
                        className="w-full mt-4" 
                        onClick={handleUpdateProfile}
                      >
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="preferences" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>Control how Math Wizard looks and behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark theme
                    </p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={settings.darkMode}
                    onCheckedChange={() => handleToggleSetting("darkMode")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="show-steps">Show Step-by-Step Solutions</Label>
                    <p className="text-sm text-muted-foreground">
                      Always show detailed steps for solutions
                    </p>
                  </div>
                  <Switch
                    id="show-steps"
                    checked={settings.showSteps}
                    onCheckedChange={() => handleToggleSetting("showSteps")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="visualizations">Enable Visualizations</Label>
                    <p className="text-sm text-muted-foreground">
                      Show graphs and visual aids when applicable
                    </p>
                  </div>
                  <Switch
                    id="visualizations"
                    checked={settings.visualizations}
                    onCheckedChange={() => handleToggleSetting("visualizations")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="latex-output">LaTeX Output</Label>
                    <p className="text-sm text-muted-foreground">
                      Include LaTeX representation in solutions
                    </p>
                  </div>
                  <Switch
                    id="latex-output"
                    checked={settings.latexOutput}
                    onCheckedChange={() => handleToggleSetting("latexOutput")}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Auto-Save Solutions</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save solutions to history
                    </p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={settings.autoSave}
                    onCheckedChange={() => handleToggleSetting("autoSave")}
                  />
                </div>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Password</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Last updated 30 days ago
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsPasswordDialogOpen(true)}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Connected Accounts</h3>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      <span className="text-sm">Google</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleDisconnectGoogle}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  Delete Account
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  This will permanently delete your account and all associated data.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="privacy" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Manage your data and privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for new features and updates
                    </p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={() => handleToggleSetting("notifications")}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-updates">Email Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive emails about new features and tips
                    </p>
                  </div>
                  <Switch
                    id="email-updates"
                    checked={settings.emailUpdates}
                    onCheckedChange={() => handleToggleSetting("emailUpdates")}
                  />
                </div>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Data Usage</h3>
                  <div className="flex flex-col gap-2">
                    <div className="bg-muted/30 p-4 rounded-lg flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Your math problems are processed. No data is stored on our servers beyond 
                        your solution history. You can delete your history at any time from your account.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-fit"
                      onClick={handleDownloadData}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download My Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Change Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Please type "DELETE" to confirm:
            </p>
            <Input
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              placeholder="Type DELETE to confirm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
