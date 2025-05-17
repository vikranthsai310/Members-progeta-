
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/Spinner";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleAuthAvailable, setIsGoogleAuthAvailable] = useState(true);
  const { createUser, signInWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  // Check if domain is authorized for Google auth
  useEffect(() => {
    // Check if current domain is in the list of authorized domains
    const checkDomain = async () => {
      try {
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/projects?key=${import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCSFXPiU3bbsgWSQppp2bfOXKXktrq7vlo"}`);
        const data = await response.json();
        
        if (data && data.authorizedDomains) {
          const currentDomain = window.location.hostname;
          const isAuthorized = data.authorizedDomains.includes(currentDomain);
          
          setIsGoogleAuthAvailable(isAuthorized);
          if (!isAuthorized) {
            console.log("Current domain is not authorized for Firebase authentication:", currentDomain);
          }
        }
      } catch (error) {
        console.error("Failed to check domain authorization:", error);
        // Default to showing the button but with a warning
        setIsGoogleAuthAvailable(true);
      }
    };
    
    checkDomain();
  }, []);

  // If user is already logged in, redirect to dashboard
  if (currentUser) {
    navigate("/dashboard", { replace: true });
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await createUser(email, password, "user");
      navigate("/dashboard");
    } catch (error) {
      // Error is handled in the AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      // Error is handled in the AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 flex justify-center items-center">
        <Card className="w-full max-w-md bg-card shadow-sm slide-in">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Sign Up
              </Button>
            </form>
            
            {!isGoogleAuthAvailable ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs text-center">
                  Google authentication is not available on this domain. Please use email signup instead.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading || !isGoogleAuthAvailable}
                >
                  {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  Google
                </Button>
              </>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-memberBlue hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Register;
