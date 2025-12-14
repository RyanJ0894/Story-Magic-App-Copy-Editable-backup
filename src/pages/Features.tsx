import { Check, Mic, Music, Wand2, Clock, Users, Download, Headphones, Palette, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";

type FeatureCategory = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: {
    name: string;
    description: string;
    availability: string[];
  }[];
};

export default function Features() {
  const featureCategories: FeatureCategory[] = [
    {
      id: "voices",
      title: "AI Voice Library",
      description: "Transform your scripts with professional-quality AI voices",
      icon: <Mic className="w-6 h-6" />,
      features: [
        {
          name: "Standard Voice Library (50+ voices)",
          description: "Access a diverse collection of AI voices for narration, dialogue, and character work",
          availability: ["Free", "Starter", "Pro", "Creator"]
        },
        {
          name: "Premium Voice Library (100+ voices)",
          description: "Unlock character-specific voices with more variety and style options",
          availability: ["Pro", "Creator"]
        },
        {
          name: "Full Premium Library (150+ voices)",
          description: "Complete access to our entire voice collection including exclusive voices",
          availability: ["Creator"]
        },
        {
          name: "Custom Voice Cloning",
          description: "Create unique AI voices from audio samples for personalized productions",
          availability: ["Pro (3 voices)", "Creator (10 voices)"]
        },
        {
          name: "Unlimited Voice Recasting",
          description: "Change character voices as many times as you need to find the perfect fit",
          availability: ["Free", "Starter", "Pro", "Creator"]
        }
      ]
    },
    {
      id: "audio",
      title: "Audio Production",
      description: "Professional-grade audio tools for cinematic experiences",
      icon: <Headphones className="w-6 h-6" />,
      features: [
        {
          name: "Complete Music Library (100+ tracks)",
          description: "Background music and scores for any mood or genre",
          availability: ["Free", "Starter", "Pro", "Creator"]
        },
        {
          name: "Premium Music Library (300+ tracks)",
          description: "Genre-specific tracks for professional productions",
          availability: ["Pro", "Creator"]
        },
        {
          name: "Full Ambience & SFX Library",
          description: "Environmental sounds and effects to bring scenes to life",
          availability: ["Free", "Starter", "Pro", "Creator"]
        },
        {
          name: "Advanced SFX Library (500+ effects)",
          description: "Expanded collection of professional sound effects",
          availability: ["Pro", "Creator"]
        },
        {
          name: "Genre-Specific Sound Packs",
          description: "Curated audio packs for Horror, Sci-Fi, Romance, and more",
          availability: ["Creator"]
        },
        {
          name: "Studio-Quality Audio",
          description: "Broadcast standard audio at -16 LUFS with no watermarks",
          availability: ["Free", "Starter", "Pro", "Creator"]
        }
      ]
    },
    {
      id: "scripts",
      title: "Script Processing",
      description: "Powerful tools for script upload and management",
      icon: <Wand2 className="w-6 h-6" />,
      features: [
        {
          name: "Script Upload (up to 150 pages)",
          description: "Upload and process scripts of any length up to 150 pages",
          availability: ["Free (1/mo)", "Starter (5/mo)", "Pro (15/mo)", "Creator (Unlimited)"]
        },
        {
          name: "Screenplay-Style Playback",
          description: "Experience your script with synced text highlighting as audio plays",
          availability: ["Free", "Starter", "Pro", "Creator"]
        },
        {
          name: "Priority Processing (2x faster)",
          description: "Get your audio generated twice as fast with priority queue",
          availability: ["Pro", "Creator"]
        },
        {
          name: "Casting Simulation Mode",
          description: "Test multiple voice combinations to find the perfect cast",
          availability: ["Creator"]
        }
      ]
    },
    {
      id: "storage",
      title: "Storage & Downloads",
      description: "Keep your projects safe and export in multiple formats",
      icon: <Download className="w-6 h-6" />,
      features: [
        {
          name: "Project Storage",
          description: "Store your projects securely in the cloud",
          availability: ["Free (7 days)", "Starter (30 days)", "Pro (90 days)", "Creator (Unlimited)"]
        },
        {
          name: "M4A Downloads",
          description: "Download your audio in high-quality M4A format",
          availability: ["Free", "Starter", "Pro", "Creator"]
        },
        {
          name: "WAV Export",
          description: "Uncompressed audio export for professional editing",
          availability: ["Pro", "Creator"]
        },
        {
          name: "Multi-Format Exports",
          description: "Export in M4A, WAV, and MP3 formats",
          availability: ["Creator"]
        },
        {
          name: "White-Label Audio",
          description: "Add your own branding to exported audio",
          availability: ["Creator"]
        }
      ]
    },
    {
      id: "collaboration",
      title: "Collaboration",
      description: "Work together with your team seamlessly",
      icon: <Users className="w-6 h-6" />,
      features: [
        {
          name: "Project Sharing",
          description: "Share your projects with collaborators",
          availability: ["Pro (3 people)", "Creator (Unlimited)"]
        },
        {
          name: "Script Collaboration Rooms",
          description: "Real-time multi-user sessions for team collaboration",
          availability: ["Creator"]
        },
        {
          name: "Exclusive Voice Marketplace",
          description: "Access to SAG actor voices when available",
          availability: ["Creator"]
        }
      ]
    },
    {
      id: "support",
      title: "Support & Access",
      description: "Get help when you need it",
      icon: <Shield className="w-6 h-6" />,
      features: [
        {
          name: "Mobile & Desktop Access",
          description: "Use Story Magic on any device",
          availability: ["Starter", "Pro", "Creator"]
        },
        {
          name: "Email Support",
          description: "Get help via email from our support team",
          availability: ["Starter (48hr)", "Pro (24hr)", "Creator (4hr)"]
        },
        {
          name: "Phone Support",
          description: "Direct phone support for urgent issues",
          availability: ["Creator"]
        },
        {
          name: "Early Access to New Features",
          description: "Be the first to try new features before public release",
          availability: ["Creator"]
        },
        {
          name: "Commercial Use Rights",
          description: "Use your audio in commercial projects and monetized content",
          availability: ["Pro", "Creator"]
        },
        {
          name: "Full Commercial Licensing",
          description: "Complete licensing for any commercial use",
          availability: ["Creator"]
        }
      ]
    }
  ];

  const getPlanBadgeVariant = (plan: string) => {
    if (plan.includes("Free")) return "secondary";
    if (plan.includes("Starter")) return "outline";
    if (plan.includes("Pro")) return "default";
    if (plan.includes("Creator")) return "default";
    return "outline";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Powerful Features for Every Creator
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-3xl mx-auto">
            From AI voice synthesis to cinematic soundscapes, Story Magic gives you everything 
            you need to transform your scripts into immersive audio experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="cinema" size="lg" asChild>
              <Link to="/pricing" data-testid="link-view-pricing">View Pricing</Link>
            </Button>
            <Button variant="cinema-outline" size="lg" asChild>
              <Link to="/auth" data-testid="link-get-started">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="space-y-12 max-w-5xl mx-auto">
            {featureCategories.map((category) => (
              <Card key={category.id} data-testid={`card-feature-${category.id}`}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-cinema-gold/10 text-cinema-gold">
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.features.map((feature, index) => (
                      <div 
                        key={index} 
                        className="flex flex-col md:flex-row md:items-start gap-3 p-4 rounded-lg bg-muted/30"
                      >
                        <div className="flex-1">
                          <div className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-cinema-gold mt-0.5 flex-shrink-0" />
                            <div>
                              <h4 className="font-medium text-foreground">{feature.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 md:justify-end">
                          {feature.availability.map((plan, planIndex) => (
                            <Badge 
                              key={planIndex} 
                              variant={getPlanBadgeVariant(plan)}
                              className="text-xs"
                            >
                              {plan}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-accent">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Bring Your Scripts to Life?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Start creating cinematic audio experiences today. Try Story Magic free with no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="cinema-outline" 
              size="lg" 
              asChild 
              className="bg-white/10 border-white text-white hover:bg-white hover:text-primary"
            >
              <Link to="/auth" data-testid="link-start-free-footer">Start Free</Link>
            </Button>
            <Button 
              variant="cinema-outline" 
              size="lg" 
              asChild
              className="bg-white/10 border-white text-white hover:bg-white hover:text-primary"
            >
              <Link to="/pricing" data-testid="link-compare-plans">Compare Plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
