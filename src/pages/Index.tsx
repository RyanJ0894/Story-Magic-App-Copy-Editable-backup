import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ScriptUpload } from "@/components/ScriptUpload";
import { VoiceCasting } from "@/components/VoiceCasting";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FeedbackForm } from "@/components/FeedbackForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <ScriptUpload />
      <VoiceCasting />
      <AudioPlayer />
      <FeedbackForm />
    </div>
  );
};

export default Index;
