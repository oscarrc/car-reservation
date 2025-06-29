import { useAuth } from "@/contexts/AuthContext";

export default function AdminPage() {
  const { userProfile } = useAuth();

  return (
    <>
      <div className="mb-4 px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        {userProfile && (
          <p className="text-sm text-muted-foreground">
            Welcome, {userProfile.name} ({userProfile.role})
          </p>
        )}
      </div>
      
      <div className="grid auto-rows-min gap-4 md:grid-cols-3 px-4 lg:px-6">
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Total Users</h3>
            <p className="text-sm text-muted-foreground">Manage system users</p>
          </div>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Active Reservations</h3>
            <p className="text-sm text-muted-foreground">Monitor bookings</p>
          </div>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Fleet Status</h3>
            <p className="text-sm text-muted-foreground">Car availability</p>
          </div>
        </div>
      </div>
      
      <div className="bg-muted/50 min-h-[400px] flex-1 rounded-xl mx-4 lg:mx-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">Admin Panel</h2>
          <p className="text-muted-foreground">
            Administrative functions and system management
          </p>
        </div>
      </div>
    </>
  );
}
