import { useEffect } from "react";
import { useAuth } from "./authProvider";
import { useRouter } from "next/navigation";
import ToursSectionLoader from "../components/shared/loader/ToursSectionLoader";

export const withAuth = (Component: React.ComponentType) => {
  return function ProtectedRoute() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push("/admin?signin");
      }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || !isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <ToursSectionLoader />
        </div>
      );
    }

    return <Component />;
  };
};
