import { 
  createUserWithEmailAndPassword, 
  getAuth, 
  deleteUser as authDeleteUser,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  deleteDoc,
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Admin service for creating a new user
 */
export const createUser = async (email: string, password: string, role: "admin" | "user" = "user") => {
  try {
    const auth = getAuth();
    
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      displayName: null,
      role,
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
    
    // Send password reset email to force user to change password on first login
    await sendPasswordResetEmail(auth, email);
    
    return {
      success: true,
      userId: user.uid,
      message: "User created successfully"
    };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return {
      success: false,
      message: error.message || "Failed to create user"
    };
  }
};

/**
 * Admin service for deleting a user
 * Note: In a production app, this should be done using Firebase Admin SDK
 * via a secure Cloud Function, as client-side deletion requires re-authentication
 */
export const deleteUser = async (userId: string) => {
  try {
    // Delete user document from Firestore
    await deleteDoc(doc(db, "users", userId));
    
    // Note: Deleting from Firebase Auth requires re-authentication
    // which is not ideal for admin operations
    // In a real app, you'd use Firebase Admin SDK in a Cloud Function
    
    return {
      success: true,
      message: "User deleted from database"
    };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return {
      success: false,
      message: error.message || "Failed to delete user"
    };
  }
};

/**
 * Admin service for updating user role
 */
export const updateUserRole = async (userId: string, role: "admin" | "user") => {
  try {
    await updateDoc(doc(db, "users", userId), {
      role
    });
    
    return {
      success: true,
      message: `User role updated to ${role}`
    };
  } catch (error: any) {
    console.error("Error updating user role:", error);
    return {
      success: false,
      message: error.message || "Failed to update user role"
    };
  }
}; 