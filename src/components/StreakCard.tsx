
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

export function StreakCard() {
  const { userData, checkInToday } = useAuth();
  const { current, best, lastCheckIn } = userData?.streak || { current: 0, best: 0, lastCheckIn: null };

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

  return (
    <Card className="w-full max-w-md bg-card shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-semibold">Activity Streak</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-4xl font-bold text-memberBlue">{current}</p>
            <p className="text-sm">days</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Best Streak</p>
            <p className="text-4xl font-bold text-memberPurple">{best}</p>
            <p className="text-sm">days</p>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground text-center">
          {getLastCheckInText()}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={checkInToday}
          disabled={!canCheckInToday()}
        >
          {canCheckInToday() ? "Check In Today" : "Already Checked In Today"}
        </Button>
      </CardFooter>
    </Card>
  );
}
