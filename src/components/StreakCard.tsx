import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { AnimatedComponent } from "@/components/AnimatedComponent";
import { cn } from "@/lib/utils";

export function StreakCard() {
  const { userData, checkInToday } = useAuth();
  const { current, best, lastCheckIn, description } = userData?.streak || { 
    current: 0, 
    best: 0, 
    lastCheckIn: null,
    description: null
  };
  const [activityDescription, setActivityDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCheckInToday = () => {
    if (!lastCheckIn) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(lastCheckIn);
    
    return checkInDate.getTime() !== today.getTime();
  };

  const getLastCheckInText = () => {
    if (!lastCheckIn) return "Never checked in";
    return `Last check-in: ${formatDistanceToNow(new Date(lastCheckIn))} ago`;
  };

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    await checkInToday(activityDescription || undefined);
    setActivityDescription("");
    setIsSubmitting(false);
  };

  return (
    <AnimatedComponent animation="scale-in">
      <Card className={cn(
        "w-full max-w-md bg-card shadow-sm hover:shadow-md transition-all duration-300",
        isSubmitting && "animate-pulse"
      )}>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-semibold">Activity Streak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between">
            <AnimatedComponent animation="slide-in-left" delay={100}>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className={cn(
                  "text-4xl font-bold text-memberBlue transition-all duration-300",
                  current > 0 && "hover:scale-110 hover:text-memberBlue/90"
                )}>
                  {current}
                </p>
                <p className="text-sm">days</p>
              </div>
            </AnimatedComponent>
            
            <AnimatedComponent animation="slide-in-right" delay={200}>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Best Streak</p>
                <p className={cn(
                  "text-4xl font-bold text-memberPurple transition-all duration-300",
                  best > 0 && "hover:scale-110 hover:text-memberPurple/90"
                )}>
                  {best}
                </p>
                <p className="text-sm">days</p>
              </div>
            </AnimatedComponent>
          </div>
          
          <AnimatedComponent animation="fade-in" delay={300}>
            <div className="text-sm text-muted-foreground text-center">
              {getLastCheckInText()}
              {description && (
                <p className="mt-2 text-sm font-medium animate-slide-in-up">
                  Last activity: {description}
                </p>
              )}
            </div>
          </AnimatedComponent>

          {canCheckInToday() && (
            <AnimatedComponent animation="slide-in-up" delay={400}>
              <div className="space-y-2">
                <Label htmlFor="activity-description">What did you work on today?</Label>
                <Input
                  id="activity-description"
                  placeholder="Describe your activity..."
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                  className="transition-all duration-300 focus:scale-[1.01] focus:shadow-md"
                />
              </div>
            </AnimatedComponent>
          )}
        </CardContent>
        <CardFooter>
          <AnimatedComponent animation="slide-in-up" delay={500}>
            <Button 
              className={cn(
                "w-full transition-all duration-300",
                !isSubmitting && "hover:scale-[1.02] hover:shadow-md"
              )}
              onClick={handleCheckIn}
              disabled={!canCheckInToday() || isSubmitting}
            >
              {isSubmitting ? "Checking in..." : 
                canCheckInToday() ? "Check In Today" : "Already Checked In Today"}
            </Button>
          </AnimatedComponent>
        </CardFooter>
      </Card>
    </AnimatedComponent>
  );
}
