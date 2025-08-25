import { useState } from "react";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

export function CallbackTester() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testCallback = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Use a real project ID from the database
      const projectId = "bd866471-0f3b-4a77-91aa-bd0a4ba90cd3";
      
      const testData = {
        project_id: projectId,
        director_json: {
          scenes: [
            {
              scene_number: 1,
              description: "TEST SCENE - Callback verification",
              voice_style: "neutral",
              mood: "steady",
              characters: []
            }
          ]
        }
      };

      console.log("🧪 Testing callback with:", testData);

      const response = await fetch(
        "https://eyfxxhkbotkjsazvhxlj.supabase.co/functions/v1/ai-director-callback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testData),
        }
      );

      const data = await response.json();
      console.log("📥 Response:", data);

      setResult({
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (response.ok) {
        toast({
          title: "✅ Callback Success",
          description: `Status: ${response.status}. Check Supabase logs!`,
        });
      } else {
        toast({
          title: "❌ Callback Failed",
          description: `Status: ${response.status}`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("💥 Test error:", error);
      setResult({
        error: error.message
      });
      toast({
        title: "💥 Test Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Supabase Callback Tester</h3>
      
      <Button 
        onClick={testCallback} 
        disabled={testing}
        className="w-full"
      >
        {testing ? "Testing..." : "🧪 Test Callback Endpoint"}
      </Button>

      {result && (
        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Test Result:</h4>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="text-sm text-muted-foreground space-y-1">
        <p>📋 This tests the endpoint: /functions/v1/ai-director-callback</p>
        <p>🎯 Using project ID: bd866471-0f3b-4a77-91aa-bd0a4ba90cd3</p>
        <p>📊 Check Supabase → Edge Functions → ai-director-callback → Invocations</p>
      </div>
    </div>
  );
}