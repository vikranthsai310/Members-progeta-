import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/Spinner";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loginUser } from "@/lib/authServices";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGoogleAuthAvailable, setIsGoogleAuthAvailable] = useState(true);
  const { login, signInWithGoogle, currentUser } = useAuth();
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      // Try using our enhanced loginUser service instead of the context's login
      const result = await loginUser(email, password);
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      // If login is successful, navigate to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      setError(error.message || "Failed to sign in with email and password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    
    try {
      await signInWithGoogle();
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      // More specific error handling based on the screenshot
      if (error.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for authentication. Please use email login instead.");
      } else {
        setError(error.message || "Google sign-in failed. Please try email login instead.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 flex justify-center items-center">
        <Card className="w-full max-w-md bg-card shadow-sm slide-in">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-memberBlue hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                Sign In
              </Button>
            </form>
            
            {!isGoogleAuthAvailable ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs text-center">
                  Google authentication is not available on this domain. Please use email login instead.
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
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || !isGoogleAuthAvailable}
                >
                  {googleLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  Google
                </Button>
              </>
            )}
            
            <Alert>
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-xs">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/register" className="text-memberBlue hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;
