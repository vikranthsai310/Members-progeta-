import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/Spinner";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleAuthAvailable, setIsGoogleAuthAvailable] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [error, setError] = useState("");
  
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
  
  // Check password strength
  const checkPasswordStrength = (password: string) => {
    if (password.length === 0) {
      setPasswordStrength(null);
      return;
    }
    
    if (password.length < 6) {
      setPasswordStrength('weak');
      return;
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    const count = [hasUpperCase, hasLowerCase, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (password.length >= 8 && count >= 3) {
      setPasswordStrength('strong');
    } else if (password.length >= 6 && count >= 2) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('weak');
    }
  };

  // Handle password field change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    checkPasswordStrength(value);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset any previous errors
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 6) {
      setError("Password too short");
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
    } catch (error: any) {
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (error: any) {
      setError(error.message || "Google sign in failed. Please try again.");
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
            <CardDescription className="text-center text-muted-foreground">
              Enter your email and create a password to sign up
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
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
                  className="transition-all duration-200 focus:scale-[1.01] focus:shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="transition-all duration-200 focus:scale-[1.01] focus:shadow-sm"
                />
                
                {passwordStrength && (
                  <div className="mt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary/30 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            passwordStrength === 'weak' 
                              ? 'w-1/3 bg-red-500' 
                              : passwordStrength === 'medium' 
                                ? 'w-2/3 bg-amber-500' 
                                : 'w-full bg-green-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs ${
                        passwordStrength === 'weak' 
                          ? 'text-red-500' 
                          : passwordStrength === 'medium' 
                            ? 'text-amber-500' 
                            : 'text-green-500'
                      }`}>
                        {passwordStrength === 'weak' 
                          ? 'Weak' 
                          : passwordStrength === 'medium' 
                            ? 'Medium' 
                            : 'Strong'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="transition-all duration-200 focus:scale-[1.01] focus:shadow-sm"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full transition-all duration-200 hover:scale-[1.01] hover:shadow-md" 
                disabled={isLoading}
              >
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
                  className="w-full transition-all duration-200 hover:scale-[1.01] hover:border-memberBlue"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading || !isGoogleAuthAvailable}
                >
                  {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  Google
                </Button>
              </>
            )}
            
            <Alert variant="outline" className="bg-card/50 border-blue-500/20">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-xs">
                By registering, you agree to our Terms of Service and Privacy Policy.
              </AlertDescription>
            </Alert>
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
