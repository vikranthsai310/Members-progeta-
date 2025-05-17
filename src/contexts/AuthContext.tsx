import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

type UserRole = "admin" | "user";

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  hobbies: string[];
  lastLogin: Date;
  createdAt: Date;
  isNewUser?: boolean;
  isPasswordChanged?: boolean;
  streak: {
    current: number;
    best: number;
    lastCheckIn: Date | null;
  }
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createUser: (email: string, password: string, role: UserRole, hobbies?: string[]) => Promise<void>;
  checkInToday: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data() as Omit<UserData, 'uid'>;
            
            // Update last login time
            await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
            
            setUserData({
              uid: user.uid,
              ...data,
              lastLogin: new Date(),
            } as UserData);
          } else {
            // New user from Google Auth
            const newUserData: Omit<UserData, 'uid'> = {
              email: user.email,
              displayName: user.displayName,
              role: "user",
              hobbies: [],
              lastLogin: new Date(),
              createdAt: new Date(),
              isNewUser: true,
              isPasswordChanged: true, // Google Auth users don't need to change password
              streak: {
                current: 0,
                best: 0,
                lastCheckIn: null
              }
            };
            
            await setDoc(userDocRef, {
              ...newUserData,
              lastLogin: serverTimestamp(),
              createdAt: serverTimestamp(),
            });
            
            setUserData({
              uid: user.uid,
              ...newUserData
            } as UserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to load user data. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        setUserData(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Add additional scopes if needed
      googleProvider.addScope('email');
      googleProvider.addScope('profile');
      
      // You can also get the Google Access Token to access the Google API
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      toast({
        title: "Success",
        description: "Signed in with Google successfully.",
      });
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      let errorMessage = "Could not sign in with Google. Please try again.";
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup was blocked. Please allow popups and try again.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign in was canceled. Please try again.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with the same email address but different sign-in credentials.";
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = "The authentication credential is invalid. Please try again.";
      } else if (error.code.includes('api-key')) {
        errorMessage = "Authentication configuration issue. Please contact support.";
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        title: "Sign In Failed",
        description: "Incorrect email or password. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign Out Failed",
        description: "Could not sign out. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createUser = async (email: string, password: string, role: UserRole, hobbies: string[] = []) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const newUserData: Omit<UserData, 'uid'> = {
        email: user.email,
        displayName: user.displayName,
        role,
        hobbies,
        lastLogin: new Date(),
        createdAt: new Date(),
        isNewUser: true,
        isPasswordChanged: false, // Manual users need to change password
        streak: {
          current: 0,
          best: 0,
          lastCheckIn: null
        }
      };
      
      await setDoc(doc(db, "users", user.uid), {
        ...newUserData,
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: "Success",
        description: "User created successfully.",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast({
        title: "User Creation Failed",
        description: "Could not create user. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const checkInToday = async () => {
    if (!currentUser || !userData) return;
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        const lastCheckIn = data.streak?.lastCheckIn?.toDate() || null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Check if already checked in today
        if (lastCheckIn && lastCheckIn.getTime() === today.getTime()) {
          toast({
            title: "Already Checked In",
            description: "You've already checked in today. Come back tomorrow!",
          });
          return;
        }
        
        // Check if streak continues or resets
        let newCurrentStreak = 1;
        
        if (lastCheckIn) {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastCheckIn.getTime() === yesterday.getTime()) {
            // Continuing streak
            newCurrentStreak = (data.streak?.current || 0) + 1;
          }
        }
        
        const newBestStreak = Math.max(newCurrentStreak, data.streak?.best || 0);
        
        // Update streak
        await setDoc(userDocRef, {
          streak: {
            current: newCurrentStreak,
            best: newBestStreak,
            lastCheckIn: today
          }
        }, { merge: true });
        
        setUserData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            streak: {
              current: newCurrentStreak,
              best: newBestStreak,
              lastCheckIn: today
            }
          };
        });
        
        toast({
          title: "Check-in Successful",
          description: `You've checked in today! Current streak: ${newCurrentStreak} days.`,
        });
      }
    } catch (error) {
      console.error("Error checking in:", error);
      toast({
        title: "Check-in Failed",
        description: "Could not update your streak. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = {
    currentUser,
    userData,
    isLoading,
    signInWithGoogle,
    login,
    logout,
    createUser,
    checkInToday,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
