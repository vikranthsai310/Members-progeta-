# Firebase Cloud Functions for User Management

This directory contains serverless Cloud Functions for user management in the Progeta Community Hub application. These functions provide a secure backend for administrative operations like creating users, updating roles, and deleting users.

## Setup Instructions

### Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project already set up
3. Admin permissions on the Firebase project

### Initial Setup

1. Login to Firebase:
```bash
firebase login
```

2. Initialize Firebase Functions in your project (if not already initialized):
```bash
firebase init functions
```

3. Install dependencies:
```bash
cd functions
npm install
```

### Configuration

1. Make sure your Firebase project has Authentication and Firestore enabled
2. Configure Firebase Admin SDK credentials:

```bash
# Generate a service account key and save it securely
firebase functions:config:set admin.key="YOUR_SERVICE_ACCOUNT_JSON"
```

## Deployment

Deploy all functions to Firebase:

```bash
firebase deploy --only functions
```

Or deploy specific functions:

```bash
firebase deploy --only functions:createUser,functions:deleteUser,functions:updateUserRole
```

## Functions Overview

### `createUser`

Creates a new user with specified role in both Firebase Authentication and Firestore.

**Parameters:**
- `email` - User's email address
- `password` - Initial password
- `role` - User role ("admin" or "user")

**Example client usage:**
```javascript
const createUserFunction = firebase.functions().httpsCallable('createUser');
const result = await createUserFunction({ 
  email: 'user@example.com', 
  password: 'initialPassword', 
  role: 'user' 
});
```

### `deleteUser`

Completely removes a user from both Firebase Authentication and Firestore.

**Parameters:**
- `userId` - The Firebase user ID to delete

**Example client usage:**
```javascript
const deleteUserFunction = firebase.functions().httpsCallable('deleteUser');
const result = await deleteUserFunction({ userId: 'abc123' });
```

### `updateUserRole`

Updates a user's role in Firestore and corresponding authentication claims.

**Parameters:**
- `userId` - The Firebase user ID to update
- `role` - New role ("admin" or "user")

**Example client usage:**
```javascript
const updateRoleFunction = firebase.functions().httpsCallable('updateUserRole');
const result = await updateRoleFunction({ userId: 'abc123', role: 'admin' });
```

### `checkInactiveUsers` (Automated)

Scheduled function that runs daily to check for and mark inactive users (no login for 60+ days).

## Security

These functions enforce security through Firebase Authentication:
- Only authenticated admins can call these functions
- Role-based access control is enforced on the server
- All operations are audited in Firebase logs

## Local Testing

To test functions locally:

```bash
firebase emulators:start
```

This will start the Firebase emulators, including Functions, Firestore, and Authentication. 