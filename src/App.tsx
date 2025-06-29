import { LoginForm } from "./components/login-form";

const App = () => {
  return (
    <main className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <section className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            {/* Icon placeholder, replace with actual icon component */}
          </div>
          Acme Inc.
        </a>
        <LoginForm />
      </section>
    </main>
  );
};

export default App;
