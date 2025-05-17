
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { StreakCard } from "@/components/StreakCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/Spinner";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";

const hobbies = [
  "Reading", "Fitness", "Cooking", "Gaming", "Art", 
  "Music", "Gardening", "Travel", "Photography", "Technology"
];

const Dashboard = () => {
  const { currentUser, userData, isLoading } = useAuth();
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userData) {
      setSelectedHobbies(userData.hobbies || []);
    }
  }, [userData]);

  const toggleHobby = (hobby: string) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter((h) => h !== hobby));
    } else {
      setSelectedHobbies([...selectedHobbies, hobby]);
    }
  };

  const saveHobbies = async () => {
    if (!currentUser) return;
    
    setIsSaving(true);
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        hobbies: selectedHobbies
      });
      
      toast({
        title: "Hobbies Updated",
        description: "Your hobbies have been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating hobbies:", error);
      toast({
        title: "Update Failed",
        description: "Could not update hobbies. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card className="mb-8 bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Welcome back, {userData?.displayName || currentUser?.email?.split('@')[0]}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground">Your selected hobbies:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedHobbies.length > 0 ? (
                        selectedHobbies.map((hobby) => (
                          <Badge key={hobby} variant="secondary">
                            {hobby}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No hobbies selected yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Update Your Hobbies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {hobbies.map((hobby) => (
                    <div key={hobby} className="flex items-center space-x-2">
                      <Checkbox
                        id={`hobby-${hobby}`}
                        checked={selectedHobbies.includes(hobby)}
                        onCheckedChange={() => toggleHobby(hobby)}
                      />
                      <Label htmlFor={`hobby-${hobby}`} className="cursor-pointer">
                        {hobby}
                      </Label>
                    </div>
                  ))}
                </div>
                <Button className="mt-6" onClick={saveHobbies} disabled={isSaving}>
                  {isSaving ? <Spinner size="sm" className="mr-2" /> : null}
                  Save Hobbies
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-8">
            <StreakCard />
            
            <Card className="bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since:</span>
                    <span>
                      {userData?.createdAt
                        ? new Date(userData.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account type:</span>
                    <Badge variant="outline" className="capitalize">
                      {userData?.role || "user"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
