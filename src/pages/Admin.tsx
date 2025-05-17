import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { AnimatedLayout } from "@/components/AnimatedLayout";
import { AnimatedComponent } from "@/components/AnimatedComponent";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc,
  setDoc,
  query, 
  where, 
  updateDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, 
  getAuth, 
  sendPasswordResetEmail, 
  deleteUser, 
  signInWithEmailAndPassword 
} from "firebase/auth";
import { db } from "@/lib/firebase";
import { checkInactiveUsers } from "@/lib/inactivityChecker";
import { createUser, deleteUser as adminDeleteUser, updateUserRole } from "@/lib/adminServices";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCheck, UserX, Mail, RefreshCcw, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  role: "admin" | "user";
  hobbies: string[];
  lastLogin: Timestamp;
  createdAt: Timestamp;
  isNewUser?: boolean;
  isPasswordChanged?: boolean;
  streak?: {
    current: number;
    best: number;
    lastCheckIn: Timestamp | null;
  };
}

const Admin = () => {
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role: "user" as "admin" | "user",
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [activeTab, setActiveTab] = useState("all-users");
  const [isNotifying, setIsNotifying] = useState(false);
  const [notifyingUserId, setNotifyingUserId] = useState<string | null>(null);
  const [isRunningInactivityCheck, setIsRunningInactivityCheck] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteUserCredentials, setDeleteUserCredentials] = useState({
    email: "",
    password: ""
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const usersCollection = await getDocs(collection(db, "users"));
      const usersData = usersCollection.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data()
      })) as User[];
      
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast({
        title: "Missing Information",
        description: "Please provide both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const result = await createUser(newUser.email, newUser.password, newUser.role);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      toast({
        title: "User Created Successfully",
        description: "A password reset email has been sent to the user.",
      });
      
      setIsAddUserDialogOpen(false);
      setNewUser({
        email: "",
        password: "",
        role: "user",
      });
      
      // Refresh user list
      fetchUsers();
    } catch (error: any) {
      console.error("Error adding user:", error);
      toast({
        title: "User Creation Failed",
        description: error.message || "Could not create user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    
    try {
      const result = await adminDeleteUser(userId);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      toast({
        title: "User Deleted",
        description: result.message,
      });
      
      // Update UI by removing the deleted user
      setUsers(users.filter((user) => user.uid !== userId));
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    setSelectedUserId(userId);
    setIsChangingRole(true);
    
    try {
      const result = await updateUserRole(userId, newRole);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      toast({
        title: "Role Updated",
        description: `User role has been updated to ${newRole}.`,
      });
      
      // Update users list
      setUsers(users.map(user => 
        user.uid === userId ? { ...user, role: newRole } : user
      ));
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingRole(false);
      setSelectedUserId(null);
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  // Check if a user is inactive (hasn't logged in for 60+ days)
  const isUserInactive = (user: User) => {
    if (!user.lastLogin) return false;
    
    const lastLoginDate = new Date(user.lastLogin.seconds * 1000);
    const currentDate = new Date();
    
    // Calculate the difference in milliseconds
    const diffTime = currentDate.getTime() - lastLoginDate.getTime();
    
    // Convert milliseconds to days
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 60;
  };

  // Get days since last login
  const getDaysSinceLastLogin = (user: User) => {
    if (!user.lastLogin) return "N/A";
    
    const lastLoginDate = new Date(user.lastLogin.seconds * 1000);
    const currentDate = new Date();
    
    const diffTime = currentDate.getTime() - lastLoginDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Send notification to inactive user
  const handleNotifyInactiveUser = async (userId: string) => {
    setNotifyingUserId(userId);
    setIsNotifying(true);
    
    try {
      // In a real app, this would send an email notification
      // For demo purposes, we'll just show a toast after a delay
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      toast({
        title: "Notification Sent",
        description: "An email has been sent to the inactive user.",
      });
    } catch (error) {
      console.error("Error notifying user:", error);
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsNotifying(false);
      setNotifyingUserId(null);
    }
  };

  // Filter users based on active tab
  const filteredUsers = users.filter(user => {
    if (activeTab === "all-users") return true;
    if (activeTab === "active-users") return !isUserInactive(user);
    if (activeTab === "inactive-users") return isUserInactive(user);
    return true;
  });

  // Run inactivity checker manually
  const runInactivityCheck = async () => {
    setIsRunningInactivityCheck(true);
    
    try {
      // Simulate a more involved process
      await new Promise(resolve => setTimeout(resolve, 1500));
      const result = await checkInactiveUsers();
      
      // Refresh the user list to reflect any changes
      await fetchUsers();
      
      // Optionally switch to the inactive users tab to see results
      setActiveTab("inactive-users");
      
      toast({
        title: "Inactivity Check Completed",
        description: `Found ${result.totalInactiveUsers} inactive users.`,
      });
    } catch (error) {
      console.error("Error running inactivity check:", error);
      toast({
        title: "Error",
        description: "Failed to check for inactive users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRunningInactivityCheck(false);
    }
  };

  const initiateUserDelete = (userId: string) => {
    setSelectedUserId(userId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmUserDelete = async () => {
    if (!selectedUserId) return;
    
    setDeletingUserId(selectedUserId);
    
    try {
      const result = await adminDeleteUser(selectedUserId);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      toast({
        title: "User Deleted",
        description: result.message,
      });
      
      // Update UI by removing the deleted user
      setUsers(users.filter((user) => user.uid !== selectedUserId));
      setIsDeleteDialogOpen(false);
      setDeleteUserCredentials({
        email: "",
        password: ""
      });
    } catch (error: any) {
      console.error("Error in user deletion flow:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "An error occurred during user deletion.",
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  // Check if user is admin
  if (userData?.role !== "admin") {
    return (
      <AnimatedLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <AnimatedComponent animation="scale-in">
            <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground">
              You do not have permission to access this page.
            </p>
          </AnimatedComponent>
        </div>
      </AnimatedLayout>
    );
  }

  return (
    <AnimatedLayout>
      <div className="container mx-auto px-4 py-8">
        <AnimatedComponent animation="slide-in-down" delay={100}>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={runInactivityCheck} 
                disabled={isRunningInactivityCheck}
                className={cn(
                  "flex items-center gap-1 transition-all duration-300",
                  !isRunningInactivityCheck && "hover:bg-memberAmber/20 hover:border-memberAmber hover:scale-105"
                )}
              >
                {isRunningInactivityCheck ? (
                  <>
                    <Spinner size="sm" className="mr-1 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCcw className={cn(
                      "h-4 w-4 mr-1 transition-transform duration-300",
                      !isRunningInactivityCheck && "group-hover:animate-spin"
                    )} />
                    Check Inactivity
                  </>
                )}
              </Button>
              <Button 
                onClick={() => setIsAddUserDialogOpen(true)}
                className="transition-all duration-300 hover:bg-memberBlue/90 hover:scale-105"
              >
                <UserCog className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </AnimatedComponent>
        
        <AnimatedComponent animation="fade-in" delay={200}>
          <Card className="bg-card shadow-sm mb-8 transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>Inactivity Summary</CardTitle>
              <CardDescription>
                Monitor user activity and inactivity patterns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <AnimatedComponent animation="slide-in-up" delay={300}>
                  <div className="bg-secondary/20 p-4 rounded-lg text-center transition-all duration-300 hover:bg-secondary/30 hover:scale-[1.02]">
                    <p className="text-lg font-medium">Total Users</p>
                    <p className="text-3xl font-bold">{users.length}</p>
                  </div>
                </AnimatedComponent>
                
                <AnimatedComponent animation="slide-in-up" delay={400}>
                  <div className="bg-green-500/20 p-4 rounded-lg text-center transition-all duration-300 hover:bg-green-500/30 hover:scale-[1.02]">
                    <p className="text-lg font-medium">Active Users</p>
                    <p className="text-3xl font-bold">{users.filter(user => !isUserInactive(user)).length}</p>
                  </div>
                </AnimatedComponent>
                
                <AnimatedComponent animation="slide-in-up" delay={500}>
                  <div className="bg-red-500/20 p-4 rounded-lg text-center transition-all duration-300 hover:bg-red-500/30 hover:scale-[1.02]">
                    <p className="text-lg font-medium">Inactive Users (60+ days)</p>
                    <p className="text-3xl font-bold">{users.filter(user => isUserInactive(user)).length}</p>
                  </div>
                </AnimatedComponent>
              </div>
            </CardContent>
          </Card>
        </AnimatedComponent>
        
        <AnimatedComponent animation="fade-in" delay={600}>
          <Card className="bg-card shadow-sm transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>
                Manage all users in the Members#Progeta community.
              </CardDescription>
              
              <Tabs 
                defaultValue="all-users" 
                className="mt-4" 
                onValueChange={setActiveTab}
              >
                <TabsList className="grid grid-cols-3 max-w-md">
                  <TabsTrigger 
                    value="all-users"
                    className="transition-all duration-200 data-[state=active]:animate-pulse data-[state=active]:animate-once"
                  >
                    All Users
                  </TabsTrigger>
                  <TabsTrigger 
                    value="active-users"
                    className="transition-all duration-200 data-[state=active]:animate-pulse data-[state=active]:animate-once"
                  >
                    Active Users
                  </TabsTrigger>
                  <TabsTrigger 
                    value="inactive-users"
                    className="transition-all duration-200 data-[state=active]:animate-pulse data-[state=active]:animate-once"
                  >
                    Inactive (60+ days)
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size="lg" className="animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableCaption className="animate-fade-in">
                    {activeTab === "all-users" && "List of all registered users."}
                    {activeTab === "active-users" && "List of active users who logged in within the last 60 days."}
                    {activeTab === "inactive-users" && "List of inactive users who haven't logged in for 60+ days."}
                  </TableCaption>
                  <TableHeader>
                    <TableRow className="animate-slide-in-down">
                      <TableHead>Email</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground animate-fade-in">
                          No users found in this category.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <TableRow 
                          key={user.uid} 
                          className={cn(
                            "transition-all duration-300 animate-fade-in",
                            isUserInactive(user) ? "bg-red-50 dark:bg-red-950/10 hover:bg-red-100 dark:hover:bg-red-950/20" 
                                               : "hover:bg-secondary/10",
                            {"animate-fade-out": deletingUserId === user.uid}
                          )}
                          style={{ 
                            animationDelay: `${100 + index * 50}ms`,
                            animationFillMode: "both" 
                          }}
                        >
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.displayName || "N/A"}</TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value: "admin" | "user") => 
                                handleRoleChange(user.uid, value)
                              }
                              disabled={isChangingRole && selectedUserId === user.uid}
                            >
                              <SelectTrigger className="w-24 transition-all duration-200 hover:border-memberBlue">
                                {isChangingRole && selectedUserId === user.uid ? (
                                  <Spinner size="sm" className="animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            {formatDate(user.lastLogin)}
                            {isUserInactive(user) && (
                              <p className="text-xs text-red-500 font-medium mt-1 animate-pulse">
                                {getDaysSinceLastLogin(user)} days ago
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {isUserInactive(user) ? (
                              <Badge variant="destructive" className="flex items-center gap-1 animate-pulse">
                                <UserX className="h-3 w-3" />
                                Inactive
                              </Badge>
                            ) : (
                              <Badge className="bg-green-500 text-white flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {isUserInactive(user) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleNotifyInactiveUser(user.uid)}
                                  disabled={isNotifying && notifyingUserId === user.uid}
                                  className="flex items-center gap-1 transition-all duration-200 hover:border-memberBlue hover:bg-blue-50 dark:hover:bg-blue-950/20"
                                >
                                  {isNotifying && notifyingUserId === user.uid ? (
                                    <Spinner size="sm" className="animate-spin" />
                                  ) : (
                                    <>
                                      <Mail className="h-3 w-3" />
                                      Notify
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => initiateUserDelete(user.uid)}
                                disabled={deletingUserId === user.uid}
                                className="transition-all duration-200 hover:scale-105"
                              >
                                {deletingUserId === user.uid ? (
                                  <Spinner size="sm" className="animate-spin" />
                                ) : (
                                  "Delete"
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </AnimatedComponent>
      </div>
      
      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. The user will receive an email to set their password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="transition-all duration-200 focus:scale-[1.01] focus:shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Initial Password</Label>
              <Input
                id="password"
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="transition-all duration-200 focus:scale-[1.01] focus:shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: "admin" | "user") => 
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger id="role" className="transition-all duration-200 hover:border-memberBlue">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddUserDialogOpen(false)}
              className="transition-all duration-200 hover:bg-secondary/20"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser}
              className="transition-all duration-200 hover:bg-memberBlue/90 hover:scale-105"
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="animate-scale-in">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-destructive font-medium">
              Warning: This will only remove the user's data from the database. Due to security restrictions,
              removing the user's authentication record requires a server-side operation.
            </p>
            <p className="text-sm text-muted-foreground">
              In a production environment, this would be handled by a secure Cloud Function that uses
              the Firebase Admin SDK to completely delete the user.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="transition-all duration-200 hover:bg-secondary/20"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmUserDelete}
              disabled={deletingUserId === selectedUserId}
              className="transition-all duration-200 hover:bg-destructive/90 hover:scale-105"
            >
              {deletingUserId === selectedUserId ? (
                <>
                  <Spinner size="sm" className="mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedLayout>
  );
};

export default Admin;
