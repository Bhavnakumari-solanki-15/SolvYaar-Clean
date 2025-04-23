import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { toast } from "../components/ui/sonner";
import { disconnectWallet as disconnectWalletUtil } from '../lib/monad';

// Define window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum: any;
  }
}

interface UserWithMeta extends User {
  name: string | null;
  photoURL: string | null;
  isPremium: boolean;
  role: 'admin' | 'developer' | 'user';
}

interface AuthContextType {
  user: UserWithMeta | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  unlinkGoogle: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; photoURL?: string }) => Promise<void>;
  isAdmin: () => boolean;
  isDeveloper: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserWithMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  const enhanceUser = useCallback(async (baseUser: User): Promise<UserWithMeta | null> => {
    try {
      // Add caching for profile data
      const cacheKey = `profile_${baseUser.id}`;
      const cachedProfile = sessionStorage.getItem(cacheKey);
      
      if (cachedProfile) {
        const profileData = JSON.parse(cachedProfile);
        return {
          ...baseUser,
          name: profileData.name || baseUser.email?.split('@')[0] || null,
          photoURL: profileData.avatar_url || null,
          isPremium: false,
          role: profileData.role || 'user'
        };
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', baseUser.id)
        .maybeSingle();
      
      // Cache the profile data
      if (profileData) {
        sessionStorage.setItem(cacheKey, JSON.stringify(profileData));
      }

      return {
        ...baseUser,
        name: profileData?.name || baseUser.email?.split('@')[0] || null,
        photoURL: profileData?.avatar_url || null,
        isPremium: false,
        role: profileData?.role || 'user'
      };
    } catch (error) {
      console.error("Error enhancing user:", error);
      // Fallback to basic user info if profile fetch fails
      return {
        ...baseUser,
        name: baseUser.email?.split('@')[0] || null,
        photoURL: null,
        isPremium: false,
        role: 'user'
      };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mounted) {
          const enhancedUser = await enhanceUser(session.user);
          if (mounted && enhancedUser) {
            setUser(enhancedUser);
          }
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted) return;

          if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            const enhancedUser = await enhanceUser(session.user);
            if (mounted && enhancedUser) {
              setUser(enhancedUser);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
          }
        });

        // Clean up function will use this subscription
        return subscription;
      } catch (error) {
        console.error("Error in auth initialization:", error);
        return null;
      } finally {
        if (mounted) {
          setLoading(false);
          setInitialCheckDone(true);
        }
      }
    };

    // Initialize auth and store the subscription
    let subscription: { unsubscribe: () => void } | null = null;
    initializeAuth().then(sub => {
      subscription = sub;
    });

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [enhanceUser]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Pre-fetch profile data while auth state is updating
      if (data.user) {
        enhanceUser(data.user).catch(console.error);
      }
      
      toast.success("Signed in successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message === "Invalid login credentials"
        ? "Invalid email or password"
        : `Failed to sign in: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const origin = window.location.origin;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        console.error("Google OAuth error:", error);
        toast.error("Failed to sign in with Google. Please try again.");
        throw error;
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to sign in with Google. Please try again.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) throw error;
      
      toast.success("Account created successfully! Please check your email for verification.");
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to create account: ${error.message}`);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Disconnect wallet when user signs out
      try {
        await disconnectWalletUtil();
      } catch (walletError) {
        console.error('Error disconnecting wallet during sign out:', walletError);
        // Continue with sign out even if wallet disconnect fails
      }
      
      // Don't set user to null here - let the auth listener handle it
      toast.success("Signed out successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to sign out: ${error.message}`);
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      // First verify the current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      if (!user) throw new Error('No user logged in');

      // Delete user data from profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Delete user authentication
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id
      );

      if (authError) throw authError;
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw error;
    }
  };

  const unlinkGoogle = async () => {
    try {
      if (!user) throw new Error('No user logged in');

      // Remove Google OAuth connection
      const { error } = await supabase.auth.updateUser({
        data: {
          provider: null
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error unlinking Google account:', error);
      throw error;
    }
  };

  const updateProfile = async (data: { name?: string; email?: string; photoURL?: string }) => {
    try {
      if (!user) throw new Error('No user logged in');

      const updates: { [key: string]: any } = {};
      let authUpdate = false;

      // Handle email update through auth
      if (data.email && data.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email
        });
        if (emailError) throw emailError;
        authUpdate = true;
      }

      // Update profile data
      if (data.name || data.photoURL) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: data.name || user.name,
            avatar_url: data.photoURL || user.photoURL
          })
          .eq('id', user.id);

        if (profileError) throw profileError;
      }

      // Update local user state
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          email: data.email || prev.email,
          name: data.name || prev.name,
          photoURL: data.photoURL || prev.photoURL
        };
      });

      toast.success(
        authUpdate 
          ? "Profile updated! Please check your email to confirm changes." 
          : "Profile updated successfully!"
      );
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(`Failed to update profile: ${error.message}`);
      throw error;
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isDeveloper = () => {
    return user?.role === 'developer';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: loading && !initialCheckDone,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        isAuthenticated: !!user,
        updatePassword,
        deleteAccount,
        unlinkGoogle,
        updateProfile,
        isAdmin,
        isDeveloper,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
