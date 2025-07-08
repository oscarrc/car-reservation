import { CarFront, Users, Search } from "lucide-react";
import type { CarStatus, CarWithId } from "@/types/car";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorDisplay } from "@/components/ui/error-display";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchCars,
  getCarsCount,
  searchCars,
  type PaginationCursor,
  type CarsFilterParams,
} from "@/lib/cars-service";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useOptimizedSearch } from "@/hooks/useOptimizedSearch";

// Helper function to get status variant
const getStatusVariant = (status: CarStatus) => {
  switch (status) {
    case "available":
      return "success";
    case "maintenance":
      return "warning";
    case "out_of_service":
      return "destructive";
    default:
      return "outline";
  }
};

export default function FleetPage() {
  const { t } = useTranslation();
  const [allCars, setAllCars] = useState<CarWithId[]>([]);
  const [cursors, setCursors] = useState<{ [key: number]: PaginationCursor }>(
    {}
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | CarStatus>("all");
  const [seatsFilter, setSeatsFilter] = useState<"all" | string>("all");

  const pageSize = 25;

  // Use optimized search hook
  const {
    searchTerm: localSearchTerm,
    setSearchTerm: setLocalSearchTerm,
    debouncedSearchTerm,
  } = useOptimizedSearch("");

  // Reset pagination when filters change
  useEffect(() => {
    setPageIndex(0);
    setCursors({});
    setAllCars([]);
  }, [debouncedSearchTerm, statusFilter, seatsFilter]);

  // Filter params for queries
  const filterParams: CarsFilterParams = {
    searchTerm: debouncedSearchTerm.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    seats: seatsFilter === "all" ? undefined : parseInt(seatsFilter),
  };

  // Fetch cars with cursor pagination
  const {
    data: carsResponse,
    isLoading: initialLoading,
    error: initialError,
  } = useQuery({
    queryKey: ["cars", "fleet", pageIndex, pageSize, debouncedSearchTerm, statusFilter, seatsFilter],
    queryFn: async () => {
      const cursor = cursors[pageIndex];
      const queryParams = {
        pageSize,
        pageIndex,
        cursor,
        ...filterParams,
      };

      if (debouncedSearchTerm.trim()) {
        return searchCars(debouncedSearchTerm, queryParams);
      }
      return fetchCars(queryParams);
    },
  });

  // Fetch total count (separate query that only invalidates when filters change)
  const {
    data: totalCount,
    // isLoading: countLoading,
    error: countError,
  } = useQuery({
    queryKey: ["cars", "count", filterParams],
    queryFn: async () => {
      return getCarsCount(filterParams);
    },
  });

  // Handle data updates
  useEffect(() => {
    if (carsResponse) {
      if (pageIndex === 0) {
        // First page - replace all cars
        setAllCars(carsResponse.cars);
      } else {
        // Subsequent pages - append cars
        setAllCars((prev) => [...prev, ...carsResponse.cars]);
      }

      // Calculate hasNextPage based on current data and total count
      if (totalCount !== undefined) {
        const currentTotal = (pageIndex + 1) * pageSize;
        setHasNextPage(currentTotal < totalCount);
      } else {
        // Fallback to checking if we got a full page
        setHasNextPage(carsResponse.cars.length === pageSize);
      }

      // Update cursor cache
      if (carsResponse.pagination.endCursor && pageIndex >= 0) {
        setCursors((prev) => ({
          ...prev,
          [pageIndex + 1]: {
            docSnapshot: carsResponse.pagination.endCursor!,
            direction: "forward",
          },
        }));
      }
    }
  }, [carsResponse, pageIndex, totalCount]);

  const handleLoadMore = () => {
    if (hasNextPage && !initialLoading) {
      setPageIndex((prev) => prev + 1);
    }
  };

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as "all" | CarStatus);
  };

  const handleSeatsFilterChange = (value: string) => {
    setSeatsFilter(value);
  };

  // Filter cars based on current filters (for display)
  const filteredCars = allCars.filter((car) => {
    // Apply status filter
    if (statusFilter !== "all" && car.status !== statusFilter) {
      return false;
    }

    // Apply seats filter
    if (seatsFilter !== "all" && car.seats !== parseInt(seatsFilter)) {
      return false;
    }

    // Apply search filter (model and license plate)
    if (debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      const modelMatch = car.model.toLowerCase().includes(searchLower);
      const licensePlateMatch = car.licensePlate.toLowerCase().includes(searchLower);
      if (!modelMatch && !licensePlateMatch) {
        return false;
      }
    }

    return true;
  });

  const getColorCircle = (color: string) => (
    <div
      className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
      style={{ backgroundColor: color.toLowerCase() }}
    />
  );

  // Show loading state first
  if (initialLoading) {
    return (
      <>
        <SectionHeader
          title={t("browse.title")}
          subtitle={t("browse.subtitle")}
        />
        <div className="px-4 lg:px-6">
          {/* Loading skeleton */}
          <div className="grid gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="w-full">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-4 w-full mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (initialError || countError) {
    return (
      <>
        <SectionHeader
          title={t("browse.title")}
          subtitle={t("browse.subtitle")}
        />
        <div className="px-4 lg:px-6">
          <ErrorDisplay
            error={initialError || countError}
            onRetry={() => window.location.reload()}
            title={t("browse.errorLoadingCars")}
            description={t(
              "browse.errorLoadingCarsDescription",
              "Unable to load cars. Please try again."
            )}
            homePath="/app"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeader
        title={t("browse.title")}
        subtitle={t("browse.subtitle")}
      />

      <div className="px-4 lg:px-6">
        {/* Filters Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto sm:min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("fleet.searchPlaceholder")}
                value={localSearchTerm}
                onChange={(event) => handleSearchChange(event.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder={t("fleet.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("fleet.allStatuses")}</SelectItem>
                <SelectItem value="available">{t("fleet.available")}</SelectItem>
                <SelectItem value="maintenance">
                  {t("fleet.maintenance")}
                </SelectItem>
                <SelectItem value="out_of_service">
                  {t("fleet.out_of_service")}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Seats Filter */}
            <Input
              type="number"
              placeholder={t("browse.filterBySeats")}
              value={seatsFilter === "all" ? "" : seatsFilter}
              onChange={(event) => {
                const value = event.target.value;
                handleSeatsFilterChange(value === "" ? "all" : value);
              }}
              className="w-full sm:w-[140px]"
              min="1"
              max="20"
            />
          </div>
        </div>

        {filteredCars.length === 0 ? (
          <div className="text-center py-12">
            <CarFront className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {t("fleet.noCarsFound")}
            </p>
          </div>
        ) : (
          <>
            {/* Cars Grid */}
            <div className="grid gap-6">
              {filteredCars.map((car) => (
                <Card
                  key={car.id}
                  className="w-full hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <CarFront className="h-5 w-5" />
                      <span className="font-semibold text-lg">{car.model}</span>
                      <Badge variant={getStatusVariant(car.status)}>
                        {t(`fleet.${car.status}`)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* License Plate */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          {t("browse.carCard.licensePlate")}
                        </span>
                        <span className="font-mono font-semibold text-primary">
                          {car.licensePlate}
                        </span>
                      </div>

                      {/* Year */}
                      {car.year && (
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            {t("fleet.year")}
                          </span>
                          <span className="font-mono font-semibold text-primary">
                            {car.year}
                          </span>
                        </div>
                      )}

                      {/* Color */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          {t("fleet.color")}
                        </span>
                        <div className="flex items-center gap-2">
                          {getColorCircle(car.color)}
                          <span className="font-medium">
                            {t(`fleet.colors.${car.color}`, {
                              defaultValue: car.color,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Capacity */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          {t("browse.carCard.capacity")}
                        </span>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {car.seats} {t("browse.carCard.people")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {car.description && (
                      <div className="mt-4 pt-4 border-t">
                        <span className="text-sm font-medium text-muted-foreground block mb-2">
                          {t("browse.carCard.description")}
                        </span>
                        <p className="text-sm text-foreground leading-relaxed">
                          {car.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleLoadMore}
                  disabled={initialLoading}
                  variant="outline"
                  size="lg"
                >
                  {initialLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      {t("common.loading")}
                    </>
                  ) : (
                    t("browse.loadMore")
                  )}
                </Button>
              </div>
            )}

            {/* No more cars message */}
            {!hasNextPage && allCars.length > 0 && (
              <div className="text-center mt-8">
                <p className="text-sm text-muted-foreground">
                  {t("browse.noMoreCars")}
                </p>
              </div>
            )}

            {/* Cars count info */}
            <div className="text-center mt-4 mb-8">
              <p className="text-xs text-muted-foreground">
                {t("browse.viewingCars", {
                  count: filteredCars.length,
                  total:
                    totalCount !== undefined
                      ? totalCount
                      : hasNextPage
                      ? `${allCars.length}+`
                      : allCars.length,
                })}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
