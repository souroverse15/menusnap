import { useEffect } from "react";
import { useQuery } from "react-query";
import { useAuth } from "@clerk/clerk-react";
import { authApi } from "@/lib/api";

export function useUserSync(isSignedIn, user) {
  const { getToken } = useAuth();

  // Sync user data with backend
  const {
    data: userData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    ["user-sync", user?.id],
    async () => {
      if (!isSignedIn || !user) {
        return null; // Return null instead of throwing error
      }

      const token = await getToken({ skipCache: true });
      if (!token) {
        throw new Error("No authentication token available");
      }

      return authApi.getCurrentUser(token);
    },
    {
      enabled: isSignedIn && !!user,
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error("Failed to sync user data:", error);
      },
    }
  );

  useEffect(() => {
    // Refetch user data when user changes (e.g., after profile update)
    if (isSignedIn && user) {
      refetch();
    }
  }, [user?.updatedAt, isSignedIn, refetch]);

  return {
    userData: userData?.data?.user,
    isLoading,
    error,
    refetch,
  };
}
