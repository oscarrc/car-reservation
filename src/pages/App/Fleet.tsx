import { Car, Users } from "lucide-react";
import type { CarStatus, CarWithId } from "@/types/car";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchCars } from "@/lib/cars-service";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

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
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 25;

  // Initial load
  const {
    data: initialData,
    isLoading: initialLoading,
    error: initialError,
  } = useQuery({
    queryKey: ["cars", "initial", pageSize],
    queryFn: () => fetchCars({ pageSize }),
  });

  // Load more cars
  const {
    data: moreData,
    isLoading: loadingMore,
    refetch: loadMore,
  } = useQuery({
    queryKey: ["cars", "more", pageSize, lastDoc],
    queryFn: () => fetchCars({ pageSize, lastDoc }),
    enabled: false,
  });

  // Handle initial data
  useEffect(() => {
    if (initialData) {
      setAllCars(initialData.cars);
      setLastDoc(initialData.lastDoc);
      setHasMore(initialData.hasMore);
    }
  }, [initialData]);

  // Handle more data
  useEffect(() => {
    if (moreData) {
      setAllCars((prev) => [...prev, ...moreData.cars]);
      setLastDoc(moreData.lastDoc);
      setHasMore(moreData.hasMore);
    }
  }, [moreData]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadMore();
    }
  };

  const getColorCircle = (color: string) => (
    <div
      className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
      style={{ backgroundColor: color.toLowerCase() }}
    />
  );

  if (initialError) {
    return (
      <>
        <SectionHeader
          title={t("browse.title")}
          subtitle={t("browse.subtitle")}
        />
        <div className="px-4 lg:px-6">
          <div className="text-center">
            <p className="text-destructive">{t("browse.errorLoadingCars")}</p>
          </div>
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
        {initialLoading ? (
          // Loading skeleton
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
        ) : allCars.length === 0 ? (
          <div className="text-center py-12">
            <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {t("fleet.noCarsFound")}
            </p>
          </div>
        ) : (
          <>
            {/* Cars Grid */}
            <div className="grid gap-6">
              {allCars.map((car) => (
                <Card
                  key={car.id}
                  className="w-full hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Car className="h-5 w-5" />
                      <span className="font-semibold text-lg">{car.model}</span>
                      {car.year && (
                        <span className="ml-2 text-base text-muted-foreground">{car.year}</span>
                      )}
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
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                >
                  {loadingMore ? (
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
            {!hasMore && allCars.length > 0 && (
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
                  count: allCars.length,
                  total: hasMore ? `${allCars.length}+` : allCars.length,
                })}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
