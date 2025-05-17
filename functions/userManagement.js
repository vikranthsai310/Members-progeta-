/**
 * Firebase Cloud Functions for User Management
 * 
 * Note: This file is for demonstration purposes only.
 * In a real application, these functions would be deployed to Firebase Cloud Functions.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: In a deployed function, this would use service account credentials
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Create a new user with Firebase Admin SDK
 */
exports.createUser = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only admins can create new users.'
    );
  }

  try {
    const { email, password, role } = data;
    
    if (!email || !password) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'Email and password are required.'
      );
    }

    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
    });

    // Set custom claims for role-based access control
    await admin.auth().setCustomUserClaims(userRecord.uid, { 
      admin: role === 'admin'
    });

    // Create user document in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName: null,
      role: role || 'user',
      hobbies: [],
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isNewUser: true,
      isPasswordChanged: false,
      streak: {
        current: 0,
        best: 0,
        lastCheckIn: null,
      }
    });
    
    // Send password reset email
    await admin.auth().generatePasswordResetLink(email);

    return { success: true, userId: userRecord.uid };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new functions.https.HttpsError(
      'internal', 
      `Failed to create user: ${error.message}`
    );
  }
});

/**
 * Delete a user with Firebase Admin SDK
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only admins can delete users.'
    );
  }

  try {
    const { userId } = data;
    
    if (!userId) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'User ID is required.'
      );
    }

    // Delete the user from Firestore
    await admin.firestore().collection('users').doc(userId).delete();
    
    // Delete the user from Firebase Auth
    await admin.auth().deleteUser(userId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new functions.https.HttpsError(
      'internal', 
      `Failed to delete user: ${error.message}`
    );
  }
});

/**
 * Update user role with Firebase Admin SDK
 */
exports.updateUserRole = functions.https.onCall(async (data, context) => {
  // Check if the request is made by an admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied', 
      'Only admins can update user roles.'
    );
  }

  try {
    const { userId, role } = data;
    
    if (!userId || !role) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'User ID and role are required.'
      );
    }

    // Update role in Firestore
    await admin.firestore().collection('users').doc(userId).update({ role });
    
    // Update custom claims for role-based access
    await admin.auth().setCustomUserClaims(userId, { 
      admin: role === 'admin'
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new functions.https.HttpsError(
      'internal', 
      `Failed to update user role: ${error.message}`
    );
  }
});

/**
 * Check for inactive users and update their status
 */
exports.checkInactiveUsers = functions.pubsub
  .schedule('0 0 * * *') // Run once per day at midnight
  .onRun(async (context) => {
    try {
      const inactiveThresholdDays = 60;
      const now = admin.firestore.Timestamp.now();
      const inactiveThreshold = new Date(
        now.seconds * 1000 - (inactiveThresholdDays * 24 * 60 * 60 * 1000)
      );

      // Convert to Firestore Timestamp
      const thresholdTimestamp = admin.firestore.Timestamp.fromDate(inactiveThreshold);

      // Query for inactive users
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('lastLogin', '<', thresholdTimestamp)
        .get();

      let inactiveCount = 0;

      // Process each inactive user
      const updatePromises = usersSnapshot.docs.map(doc => {
        inactiveCount++;
        return doc.ref.update({ isInactive: true });
      });

      await Promise.all(updatePromises);

      console.log(`Found and marked ${inactiveCount} inactive users.`);
      return { inactiveCount };
    } catch (error) {
      console.error('Error checking for inactive users:', error);
      throw new functions.https.HttpsError(
        'internal', 
        `Failed to check inactive users: ${error.message}`
      );
    }
  }); 