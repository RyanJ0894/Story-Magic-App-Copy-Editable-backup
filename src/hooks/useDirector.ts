import { useState, useEffect, useRef } from "react";
import { runDirector } from "@/integrations/filmDirectorApi";
import { supabase } from "../../supabase/client";

export function useDirector() {
  const [directorJson, setDirectorJson] = useState<any | null>(null);
  const [waitingForDirector, setWaitingForDirector] = useState(false);
  const [directorError, setDirectorError] = useState<string>("");
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionRef = useRef<any>(null);
  const DIRECTOR_TIMEOUT = 3600000; // 1 hour

  const triggerDirector = async (projectId: string, script: string) => {
    try {
      setWaitingForDirector(true);
      setDirectorError("");
      
      
      // Set up timeout for long-running jobs
      timeoutRef.current = setTimeout(() => {
        setWaitingForDirector(false);
        const errorMsg = "Director analysis timed out. Please try again.";
        setDirectorError(errorMsg);
        
        // Clean up subscription
        if (subscriptionRef.current) {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        }
        
      }, DIRECTOR_TIMEOUT);
      
      await runDirector(projectId, script);
      
      // Set up real-time listener for this specific project
      subscriptionRef.current = supabase
        .channel(`project-${projectId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_projects',
            filter: `id=eq.${projectId}`
          },
          (payload) => {
            const newData = payload.new as any;
            
            // Check if ai_director_json was updated
            if (newData?.ai_director_json) {
              // Clear timeout since we got a successful response
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              
              handleDirectorComplete(newData.ai_director_json);
              
              
              // Unsubscribe after receiving the update
              if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
              }
            }
          }
        )
        .subscribe();
      
    } catch (err: any) {
      // Clean up timeouts and subscriptions
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      const errorMsg = err.message || String(err);
      setDirectorError(errorMsg);
      setWaitingForDirector(false);
      
    }
  };

  const handleDirectorComplete = (directorData: any) => {
    // Only update if we don't already have this data
    if (!directorJson || JSON.stringify(directorJson) !== JSON.stringify(directorData)) {
      setDirectorJson(directorData);
      setWaitingForDirector(false);
    }
  };

  const clearDirectorData = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    setDirectorJson(null);
    setWaitingForDirector(false);
    setDirectorError("");
  };

  // Cleanup timeout and subscription on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  return {
    // State
    directorJson,
    waitingForDirector,
    directorError,
    
    // Actions
    triggerDirector,
    handleDirectorComplete,
    clearDirectorData,
    setDirectorJson // For direct updates from real-time
  };
}
