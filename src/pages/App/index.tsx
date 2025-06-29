import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function AppPage() {
  const { userProfile } = useAuth();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Car Reservation Dashboard</h1>
        {userProfile && (
          <p className="text-sm text-muted-foreground">
            Welcome, {userProfile.name}{" "}
            <Badge className="py-0" variant="secondary">
              {userProfile.role}
            </Badge>
          </p>
        )}
      </div>

      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Available Cars</h3>
            <p className="text-sm text-muted-foreground">Browse and reserve</p>
          </div>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">My Bookings</h3>
            <p className="text-sm text-muted-foreground">
              Current reservations
            </p>
          </div>
        </div>
        <div className="bg-muted/50 aspect-video rounded-xl flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">Common tasks</p>
          </div>
        </div>
      </div>
      <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-2">
            Car Reservation System
          </h2>
          <p className="text-muted-foreground">
            Manage your vehicle reservations and bookings
          </p>
        </div>
      </div>
    </div>
  );
}
