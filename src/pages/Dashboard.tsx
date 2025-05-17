import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { AnimatedLayout } from "@/components/AnimatedLayout";
import { AnimatedComponent } from "@/components/AnimatedComponent";
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
import { cn } from "@/lib/utils";

const hobbies = [
  "Reading", "Fitness", "Cooking", "Gaming", "Art", 
  "Music", "Gardening", "Travel", "Photography", "Technology"
];

const Dashboard = () => {
  const { currentUser, userData, isLoading } = useAuth();
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
    
    // Reset saved state when changes are made
    if (savedSuccess) {
      setSavedSuccess(false);
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
      
      setSavedSuccess(true);
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
          <Spinner size="lg" className="animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <AnimatedLayout>
      <div className="container mx-auto px-4 py-8">
        <AnimatedComponent animation="slide-in-down">
          <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>
        </AnimatedComponent>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <AnimatedComponent animation="slide-in-left" delay={100}>
              <Card className="mb-8 bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle>Welcome back, {userData?.displayName || currentUser?.email?.split('@')[0]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-muted-foreground">Your selected hobbies:</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedHobbies.length > 0 ? (
                          selectedHobbies.map((hobby, index) => (
                            <AnimatedComponent 
                              key={hobby} 
                              animation="scale-in" 
                              delay={100 + (index * 50)}
                              className="inline-block"
                            >
                              <Badge variant="secondary" className="transition-all duration-200 hover:scale-105">
                                {hobby}
                              </Badge>
                            </AnimatedComponent>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No hobbies selected yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedComponent>
            
            <AnimatedComponent animation="slide-in-left" delay={200}>
              <Card className="bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle>Update Your Hobbies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hobbies.map((hobby, index) => (
                      <AnimatedComponent 
                        key={hobby} 
                        animation="fade-in" 
                        delay={300 + (index * 30)}
                      >
                        <div className="flex items-center space-x-2 transition-all duration-200 hover:bg-secondary/20 p-2 rounded-md">
                          <Checkbox
                            id={`hobby-${hobby}`}
                            checked={selectedHobbies.includes(hobby)}
                            onCheckedChange={() => toggleHobby(hobby)}
                            className="transition-transform duration-200 data-[state=checked]:scale-110"
                          />
                          <Label htmlFor={`hobby-${hobby}`} className="cursor-pointer">
                            {hobby}
                          </Label>
                        </div>
                      </AnimatedComponent>
                    ))}
                  </div>
                  <AnimatedComponent animation="slide-in-up" delay={500}>
                    <Button 
                      className={cn(
                        "mt-6 transition-all duration-300",
                        !isSaving && "hover:scale-[1.02] hover:shadow-md",
                        savedSuccess && "bg-memberGreen hover:bg-memberGreen/90"
                      )} 
                      onClick={saveHobbies} 
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Spinner size="sm" className="mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : savedSuccess ? (
                        "Saved Successfully!"
                      ) : (
                        "Save Hobbies"
                      )}
                    </Button>
                  </AnimatedComponent>
                </CardContent>
              </Card>
            </AnimatedComponent>
          </div>
          
          <div className="space-y-8">
            <StreakCard />
            
            <AnimatedComponent animation="slide-in-right" delay={300}>
              <Card className="bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-2 hover:bg-secondary/10 rounded-md transition-colors duration-200">
                      <span className="text-muted-foreground">Member since:</span>
                      <span className="font-medium">
                        {userData?.createdAt
                          ? new Date(userData.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 hover:bg-secondary/10 rounded-md transition-colors duration-200">
                      <span className="text-muted-foreground">Account type:</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "capitalize transition-all duration-300 hover:scale-105",
                          userData?.role === "admin" && "bg-memberPurple/10 hover:bg-memberPurple/20"
                        )}
                      >
                        {userData?.role || "user"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimatedComponent>
          </div>
        </div>
      </div>
    </AnimatedLayout>
  );
};

export default Dashboard;
