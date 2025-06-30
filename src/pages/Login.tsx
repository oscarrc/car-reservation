import { Link, Navigate } from "react-router-dom";

import { Car } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const { currentUser, userProfile } = useAuth();

  // If user is already logged in, redirect to app
  if (currentUser) {
    if (userProfile?.role === "admin") {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/app" />;
  }

  return (
    <main className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <section className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/login"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Car className="size-4" />
          </div>
          Car Reservation System
        </Link>
        <LoginForm />
      </section>
    </main>
  );
};

export default Login;
