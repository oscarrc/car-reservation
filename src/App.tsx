import { LoginForm } from "./components/login-form";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <main className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
              <section className="flex w-full max-w-sm flex-col gap-6">
                <Link to="/login" className="flex items-center gap-2 self-center font-medium">
                  <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                    {/* Icon placeholder, replace with actual icon component */}
                  </div>
                  Acme Inc.
                </Link>
                <LoginForm />
              </section>
            </main>
          }
        />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/reservation" element={<ReservationPage />} />
        {/* Optionally, add a default route or redirect */}
        {/* <Route path="/" element={<Navigate to="/login" />} /> */}
      </Routes>
    </Router>
  );
};

const AdminPage = () => <div>Admin Page</div>;

const ReservationPage = () => <div>Reservation Page</div>;

export default App;
