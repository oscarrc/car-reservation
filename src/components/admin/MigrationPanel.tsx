"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { 
  runAllMigrations, 
  checkMigrationStatus, 
  migrateCarsSearchKeywords, 
  migrateUsersSearchKeywords,
  replaceSearchKeywords
} from "@/lib/migration-scripts";

interface MigrationStatus {
  cars: { total: number; migrated: number; needsMigration: number };
  users: { total: number; migrated: number; needsMigration: number };
}

export function MigrationPanel() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [migrationStatus, setMigrationStatus] = React.useState<MigrationStatus | null>(null);
  const [message, setMessage] = React.useState<string>("");
  const [isError, setIsError] = React.useState(false);

  const handleCheckStatus = async () => {
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const status = await checkMigrationStatus();
      setMigrationStatus(status);
      setMessage("Migration status checked successfully!");
    } catch (error) {
      setIsError(true);
      setMessage(`Error checking migration status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAllMigrations = async () => {
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      await runAllMigrations();
      setMessage("All migrations completed successfully!");
      // Refresh status
      await handleCheckStatus();
    } catch (error) {
      setIsError(true);
      setMessage(`Error running migrations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceSearchKeywords = async () => {
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      await replaceSearchKeywords();
      setMessage("Search keywords replaced successfully with new logic!");
      // Refresh status
      await handleCheckStatus();
    } catch (error) {
      setIsError(true);
      setMessage(`Error replacing search keywords: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateCars = async () => {
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      await migrateCarsSearchKeywords();
      setMessage("Cars migration completed successfully!");
      // Refresh status
      await handleCheckStatus();
    } catch (error) {
      setIsError(true);
      setMessage(`Error migrating cars: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrateUsers = async () => {
    setIsLoading(true);
    setMessage("");
    setIsError(false);

    try {
      await migrateUsersSearchKeywords();
      setMessage("Users migration completed successfully!");
      // Refresh status
      await handleCheckStatus();
    } catch (error) {
      setIsError(true);
      setMessage(`Error migrating users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    // Check status on component mount
    handleCheckStatus();
  }, []);

  const allMigrated = migrationStatus ? 
    migrationStatus.cars.needsMigration === 0 && 
    migrationStatus.users.needsMigration === 0 : false;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Search Migration Panel
          {allMigrated && <CheckCircle className="h-5 w-5 text-green-500" />}
        </CardTitle>
        <CardDescription>
          Migrate existing documents to support the new search functionality using array-contains-any queries.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Migration Status */}
        {migrationStatus && (
          <div className="space-y-4">
            <h3 className="font-semibold">Migration Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Cars</h4>
                <p className="text-sm text-gray-600">
                  Total: {migrationStatus.cars.total} | 
                  Migrated: {migrationStatus.cars.migrated} | 
                  Need Migration: {migrationStatus.cars.needsMigration}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium">Users</h4>
                <p className="text-sm text-gray-600">
                  Total: {migrationStatus.users.total} | 
                  Migrated: {migrationStatus.users.migrated} | 
                  Need Migration: {migrationStatus.users.needsMigration}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <h3 className="font-semibold">Migration Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCheckStatus}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Check Status
            </Button>
            
            <Button
              onClick={handleRunAllMigrations}
              disabled={isLoading || allMigrated}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Run All Migrations
            </Button>
            
            <Button
              onClick={handleReplaceSearchKeywords}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Replace Search Keywords
            </Button>
            
            <Button
              onClick={handleMigrateCars}
              disabled={isLoading || (migrationStatus?.cars.needsMigration === 0)}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Migrate Cars Only
            </Button>
            
            <Button
              onClick={handleMigrateUsers}
              disabled={isLoading || (migrationStatus?.users.needsMigration === 0)}
              variant="outline"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Migrate Users Only
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`p-4 rounded-lg border ${isError ? "border-red-500 bg-red-50" : "border-green-500 bg-green-50"}`}>
            <div className="flex items-center gap-2">
              {isError ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              <span className={isError ? "text-red-700" : "text-green-700"}>{message}</span>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Important:</strong> This migration adds searchKeywords arrays to existing documents to enable full-text search.</p>
          <p><strong>What it does:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Cars: Indexes model, licensePlate, and color fields</li>
            <li>Users: Indexes name and email fields</li>
            <li>Uses array-contains-any queries (single query, cost-effective)</li>
            <li><strong>New Logic:</strong> Keeps original text + splits by symbols (email+test@gmail.com → ["email+test@gmail.com", "email", "test", "gmail", "com"])</li>
            <li><strong>Names:</strong> Keeps full name + individual words ("Name Test" → ["name test", "name", "test"])</li>
            <li><strong>Progressive Prefixes:</strong> Generates separator-based combinations (Tesla Model S → ["tesla", "tesla model", "tesla model s"], Model-X → ["model", "model-x"], osk.r.pnk@gmail.com → ["osk", "osk.r", "osk.r.pnk", "osk.r.pnk@gmail", "osk.r.pnk@gmail.com"])</li>
          </ul>
          <p><strong>Replace Search Keywords:</strong> Use this button to update existing documents with the new improved search logic.</p>
          <p><strong>Safe to run:</strong> All operations are safe and can be run multiple times.</p>
        </div>
      </CardContent>
    </Card>
  );
} 