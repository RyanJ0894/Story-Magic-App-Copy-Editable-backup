import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ScriptUpload } from "@/components/ScriptUpload";
import { VoiceCasting } from "@/components/VoiceCasting";
import { AudioPlayer } from "@/components/AudioPlayer";
import { FeedbackForm } from "@/components/FeedbackForm";

const Index = () => {
  console.log("Index component rendering");
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Story Magic</h1>
          <p className="text-muted-foreground">Welcome to Story Magic</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
