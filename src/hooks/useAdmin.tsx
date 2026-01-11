import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsModerator(false);
        setLoading(false);
        return;
      }

      try {
        // Check both admin and moderator status in parallel
        const [adminResult, moderatorResult] = await Promise.all([
          supabase.rpc("is_admin", { _user_id: user.id }),
          supabase.rpc("is_moderator", { _user_id: user.id }),
        ]);

        setIsAdmin(adminResult.data || false);
        setIsModerator(moderatorResult.data || false);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
        setIsModerator(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  return { isAdmin, isModerator, loading: loading || authLoading };
}
