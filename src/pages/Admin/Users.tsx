import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UsersTable } from "@/components/users/users-table";

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <>
      <div className="mb-6 px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
            <p className="text-muted-foreground">
              Manage system users and their permissions
            </p>
          </div>
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      <div className="px-4 lg:px-6">
        <UsersTable 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>
    </>
  );
}
