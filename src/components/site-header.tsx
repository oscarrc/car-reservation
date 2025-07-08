import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, useLocation } from "react-router-dom";

import { EmailVerificationBadge } from "@/components/ui/email-verification-badge";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTranslation } from "react-i18next";

interface SiteHeaderProps {
  companyName?: string;
  homePageUrl?: string;
}

export function SiteHeader({ companyName, homePageUrl }: SiteHeaderProps) {
  const location = useLocation();
  const { t } = useTranslation();

  // Generate breadcrumbs based on current path
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    const breadcrumbs = [];

    // Always start with company name
    if (companyName) {
      breadcrumbs.push({
        label: companyName,
        path: homePageUrl || "/",
        isCurrentPage: false,
      });
    }

    // Build breadcrumbs from path segments (skip base routes like admin/app)
    let currentPath = "";

    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      const isLastSegment = i === pathSegments.length - 1;

      let label = "";
      let shouldShow = true;

      // Map segments to readable labels
      switch (segment) {
        case "admin":
        case "app":
          // Skip base dashboard routes - they are the home/initial crumb
          shouldShow = false;
          break;
        case "fleet":
          label = t("navigation.fleet");
          break;
        case "users":
          label = t("navigation.users");
          break;
        case "reservations":
          label = t("navigation.reservations");
          break;
        case "settings":
          label = t("navigation.settings");
          break;
        case "profile":
          label = t("navigation.profile");
          break;
        default:
          // For ID-based routes, show descriptive name
          if (pathSegments[i - 1] === "fleet") {
            label = t("fleet.carDetails");
          } else if (pathSegments[i - 1] === "users") {
            label = t("users.userDetails");
          } else {
            // Skip unknown segments
            shouldShow = false;
          }
          break;
      }

      if (shouldShow && label) {
        breadcrumbs.push({
          label,
          path: currentPath,
          isCurrentPage: isLastSegment,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4 justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        {breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.path} className="flex items-center">
                  {index > 0 && (
                    <BreadcrumbSeparator className="hidden md:block" />
                  )}
                  <BreadcrumbItem
                    className={index === 0 ? "hidden md:block" : ""}
                  >
                    {breadcrumb.isCurrentPage ? (
                      <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          to={breadcrumb.path}
                          className="text-sm font-medium"
                        >
                          {breadcrumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
      <div className="flex items-center gap-4">
        <EmailVerificationBadge />
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
