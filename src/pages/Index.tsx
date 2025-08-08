import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ScriptUpload } from "@/components/ScriptUpload";
import { VoiceCasting } from "@/components/VoiceCasting";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FeedbackForm } from "@/components/FeedbackForm";

const Index = () => {
  console.log("Index component rendering");
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <section className="container mx-auto px-4 py-16 space-y-16">
          <ScriptUpload />
          <VoiceCasting />
          <AudioPlayer />
          <FeedbackForm />
        </section>
      </main>
    </div>
  );
};

export default Index;
