
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { currentUser } = useAuth();

  return (
    <Layout>
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center slide-in">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl mb-6">
            Welcome to <span className="text-memberBlue">Members#Progeta</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10">
            Join our community, track your progress, and connect with like-minded individuals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {currentUser ? (
              <Link to="/dashboard">
                <Button size="lg" className="w-full sm:w-auto">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
      
      <section className="container mx-auto px-4 py-16 md:py-24 bg-muted/40">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
          <div className="bg-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-bold mb-4">Track Your Progress</h2>
            <p className="text-muted-foreground">
              Maintain your activity streak and see how consistent you've been over time.
            </p>
          </div>
          <div className="bg-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-bold mb-4">Find Your Hobbies</h2>
            <p className="text-muted-foreground">
              Connect based on shared interests and discover new activities.
            </p>
          </div>
          <div className="bg-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <h2 className="text-2xl font-bold mb-4">Join the Community</h2>
            <p className="text-muted-foreground">
              Be part of an active community that helps each other grow.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
