import { Header } from "@/components/Header";
import { ScriptUpload } from "@/components/ScriptUpload";
import { VoiceCasting } from "@/components/VoiceCasting";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FeedbackForm } from "@/components/FeedbackForm";
import { AuthGuard } from "@/components/AuthGuard";

const Dashboard = () => {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="space-y-16">
          <ScriptUpload />
          <VoiceCasting />
          <AudioPlayer />
          <FeedbackForm />
        </main>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;