import { Link } from "react-router-dom";
import { Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const { currentUser, userProfile } = useAuth();

  // Determine redirect path based on user role
  const getRedirectPath = () => {
    if (!currentUser || !userProfile) {
      return "/login";
    }
    
    if (userProfile.role === "admin") {
      return "/admin";
    }
    
    return "/app";
  };

  return (
    <main className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        {/* Logo */}
        <Link
          to={getRedirectPath()}
          className="flex items-center gap-2 font-medium mb-4"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Car className="size-4" />
          </div>
          Car Reservation System
        </Link>

        {/* 404 Header */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            404 Page Not Found
          </h1>
          <p className="text-lg text-muted-foreground">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>

        {/* Return Button */}
        <Button 
          asChild 
          className="mt-6 cursor-pointer"
          size="lg"
        >
          <Link to={getRedirectPath()}>
            Return to website
          </Link>
        </Button>
      </div>
    </main>
  );
};

export default NotFound; 