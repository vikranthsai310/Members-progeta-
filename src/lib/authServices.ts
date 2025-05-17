import { 
  createUserWithEmailAndPassword, 
  getAuth, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  UserCredential
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Register a new user account
 */
export const registerUser = async (email: string, password: string): Promise<{
  success: boolean;
  user?: UserCredential['user'];
  message?: string;
}> => {
  try {
    const auth = getAuth();
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      displayName: email.split('@')[0], // Default display name from email
      role: "user", // Default role
      hobbies: [],
      lastLogin: serverTimestamp(),
      createdAt: serverTimestamp(),
      isNewUser: true,
      isPasswordChanged: false,
      streak: {
        current: 0,
        best: 0,
        lastCheckIn: null,
      }
    });
    
    // Set display name
    await updateProfile(user, {
      displayName: email.split('@')[0]
    });
    
    return {
      success: true,
      user,
      message: "Registration successful"
    };
  } catch (error: any) {
    console.error("Error registering user:", error);
    
    // Provide more user-friendly error messages
    let errorMessage = "Failed to register user";
    
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "This email is already registered. Please try logging in instead.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Please enter a valid email address.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password should be at least 6 characters.";
    } else if (error.code === "auth/network-request-failed") {
      errorMessage = "Network error. Please check your internet connection.";
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Login user
 */
export const loginUser = async (email: string, password: string) => {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user
    };
  } catch (error: any) {
    console.error("Error logging in:", error);
    
    let errorMessage = "Failed to login";
    
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      errorMessage = "Invalid email or password.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed login attempts. Please try again later.";
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  try {
    const auth = getAuth();
    await signOut(auth);
    return {
      success: true,
      message: "Logout successful"
    };
  } catch (error: any) {
    console.error("Error logging out:", error);
    return {
      success: false,
      message: error.message || "Failed to logout"
    };
  }
};

/**
 * Reset user password
 */
export const resetPassword = async (email: string) => {
  try {
    const auth = getAuth();
    await sendPasswordResetEmail(auth, email);
    return {
      success: true,
      message: "Password reset email sent"
    };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    
    let errorMessage = "Failed to send reset email";
    
    if (error.code === "auth/user-not-found") {
      errorMessage = "No user found with this email address.";
    }
    
    return {
      success: false,
      message: errorMessage
    };
  }
}; 