import { Link } from "react-router-dom";
import { LoginForm } from "@/components/login-form";

const Login = () => {
  return (
    <main className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <section className="flex w-full max-w-sm flex-col gap-6">
        <Link
          to="/login"
          className="flex items-center gap-2 self-center font-medium"
        >
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            {/* Icon placeholder, replace with actual icon component */}
          </div>
          Acme Inc.
        </Link>
        <LoginForm />
      </section>
    </main>
  );
};

export default Login;
