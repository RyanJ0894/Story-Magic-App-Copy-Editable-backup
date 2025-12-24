import { useMemo, useState } from "react";
import { 
  Mic, 
  DollarSign, 
  Shield, 
  CheckCircle, 
  Download, 
  Upload, 
  Wand2, 
  Play,
  Mail,
  HelpCircle,
  TrendingUp,
  Lock,
  Scale,
  Users,
  Headphones
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ApplicationFormModal } from "@/components/voice-marketplace/ApplicationFormModal";

export default function VoiceMarketplace() {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const shimmerParticles = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: (i * 17 + 7) % 100,
      y: (i * 23 + 11) % 100,
      delay: (i * 0.3) % 3,
      duration: 1.5 + (i % 5) * 0.5,
      opacity: 0.3 + (i % 7) * 0.1,
    }));
  }, []);

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Passive Income Stream",
      description: "Submit your voice once, earn every time it's used—forever. No auditions, no callbacks, no waiting."
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      title: "Transparent Compensation",
      description: "15% of all Story Magic revenue goes directly to voice actors. You'll always know exactly how much you're earning and why."
    },
    {
      icon: <Scale className="w-6 h-6" />,
      title: "Fair Revenue Distribution",
      description: "Unlike streaming platforms that pay fractions of a penny, our model ensures meaningful compensation for your work."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Keep Your Rights",
      description: "Non-exclusive licensing means you retain full ownership of your voice and can work anywhere else you choose."
    },
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: "Join the Future",
      description: "Be part of the AI revolution in entertainment. Your voice will help actors, producers, and agencies evaluate scripts faster than ever before."
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Record Your Submission",
      description: "Download our free scripts and record 30+ minutes of clean audio. We provide the material—you just need a decent microphone and a quiet space."
    },
    {
      number: "2",
      title: "Submit for Review",
      description: "Upload your audio through our application portal. Our team evaluates every submission for quality, clarity, and versatility."
    },
    {
      number: "3",
      title: "We Create Your AI Voice",
      description: "If accepted, we handle all the technical work. We'll train a custom AI model of your voice at no cost to you."
    },
    {
      number: "4",
      title: "Start Earning",
      description: "Once your voice is live in the marketplace, you earn automatically every time a Story Magic user selects it for their project."
    }
  ];

  const requirements = [
    {
      title: "30+ minutes of clean audio",
      description: "Record from our provided scripts (available on the application page). We need variety to train your AI voice model effectively."
    },
    {
      title: "Professional audio quality",
      description: "Clear, noise-free recordings. You don't need a professional studio, but your audio should be free from background noise, echo, and distortion. Most smart phone recorders will do."
    },
    {
      title: "Consistent performance",
      description: "Natural delivery, good pacing, clear enunciation. We're looking for voices that sound unique, conversational, and real."
    },
    {
      title: "Legal rights confirmation",
      description: "You must own the rights to your voice and confirm you're legally authorized to license it."
    }
  ];

  const faqs = [
    {
      question: "Do I need professional voice acting experience?",
      answer: "No! While professional experience helps, we're open to talented newcomers. What matters most is audio quality and a compelling voice."
    },
    {
      question: "What equipment do I need?",
      answer: "At minimum: a decent USB microphone (like a Blue Yeti or Audio-Technica AT2020) and a quiet recording space. Professional studio equipment is not required. Most smartphones can get the job done."
    },
    {
      question: "How long does the review process take?",
      answer: "Typically 7-10 business days. High application volume may extend this timeframe."
    },
    {
      question: "Can I submit multiple voice styles or accents?",
      answer: "Yes! If you can authentically perform different styles or accents, submit separate recordings for each. Each approved voice becomes a separate marketplace listing."
    },
    {
      question: "Is this exclusive? Can I still do other voice work?",
      answer: "Non-exclusive. You retain full rights to your voice and can work with any other platform or client."
    },
    {
      question: "How much can I realistically earn?",
      answer: "It varies based on how often your voice is selected. Popular voices used frequently can earn hundreds or even thousands per month as the platform grows."
    },
    {
      question: "What if someone uses my AI voice for something inappropriate?",
      answer: "Our Terms of Service strictly prohibit illegal, harmful, or explicit content. Any violation results in immediate account termination."
    },
    {
      question: "Can I update or improve my voice model later?",
      answer: "Yes! You can submit updated recordings anytime to improve your voice model quality."
    },
    {
      question: "What happens if I want to remove my voice from the marketplace?",
      answer: "You can request removal at any time. We'll remove your voice from new projects within 30 days. You'll continue earning from projects already using your voice until completion."
    },
    {
      question: "How do I track my earnings?",
      answer: "You'll have access to a dashboard showing real-time usage statistics and monthly earnings projections."
    }
  ];

  const trustBuilders = [
    { icon: <DollarSign className="w-5 h-5" />, title: "Transparent Payments", description: "Full visibility into earnings and usage" },
    { icon: <Lock className="w-5 h-5" />, title: "Secure Platform", description: "Your voice data is protected with enterprise-grade security" },
    { icon: <Scale className="w-5 h-5" />, title: "Fair Terms", description: "Non-exclusive licensing, no hidden fees" },
    { icon: <TrendingUp className="w-5 h-5" />, title: "Growing Platform", description: "As Story Magic grows, so does the Voice Actor Revenue Pool" },
    { icon: <Users className="w-5 h-5" />, title: "Community Support", description: "Dedicated support team for all voice actor questions" }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 50%, transparent 70%)',
            animationDuration: '4s',
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.06) 50%, transparent 70%)',
            animationDuration: '5s',
            animationDelay: '1s',
          }}
        />
        <div 
          className="absolute top-2/3 left-1/3 w-64 h-64 rounded-full blur-3xl animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 60%)',
            animationDuration: '6s',
            animationDelay: '2s',
          }}
        />
        {shimmerParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-amber-400 rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              opacity: particle.opacity,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <Header />

      <main className="container mx-auto px-4 py-16 relative z-10">
        <section className="text-center mb-20" data-testid="section-hero">
          <Badge variant="secondary" className="mb-6">
            <Mic className="w-3 h-3 mr-1" />
            Voice Marketplace
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 bg-clip-text text-transparent">
            Your Voice. Endless Stories. Fair Pay.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Join the Story Magic Voice Marketplace and earn passive income every time your AI voice brings a screenplay to life. We're building the future of audio production—and we're compensating voice actors fairly.
          </p>
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white" 
            data-testid="button-apply-hero"
            onClick={() => setIsApplicationOpen(true)}
          >
            <Mic className="w-5 h-5 mr-2" />
            Apply to Join the Marketplace
          </Button>
        </section>

        <section className="mb-20" data-testid="section-benefits">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Paid What You Deserve</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The entertainment industry has always undervalued voice talent. We're changing that. Here's what makes Story Magic different:
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-gradient-card border-border shadow-cinematic" data-testid={`card-benefit-${index}`}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                    {benefit.icon}
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-20" data-testid="section-how-it-works">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Four Simple Steps to Start Earning</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="bg-gradient-card border-border shadow-cinematic relative" data-testid={`card-step-${index}`}>
                <CardHeader>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold mb-4">
                    {step.number}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-20" data-testid="section-compensation">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How You Get Paid</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The Voice Actor Revenue Pool
            </p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <Card className="bg-gradient-card border-border shadow-cinematic">
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
                <CardDescription>Every month, 15% of Story Magic's total revenue goes into the Voice Actor Revenue Pool</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">Your voice is used in a project - You earn 1 usage credit</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">At month's end, we calculate your share based on your percentage of total usage</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">Payments are sent automatically via PayPal, direct deposit, or wire transfer</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-border shadow-cinematic">
              <CardHeader>
                <CardTitle>Example Earnings</CardTitle>
                <CardDescription>See how earnings are calculated</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Story Magic Monthly Revenue</span>
                  <span className="font-semibold">$50,000</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Voice Actor Pool (15%)</span>
                  <span className="font-semibold text-amber-500">$7,500</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Your Voice Usage</span>
                  <span className="font-semibold">150 projects</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Total Voice Usage</span>
                  <span className="font-semibold">3,000 projects</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-amber-500/10 rounded-lg px-3 mt-4">
                  <span className="font-semibold">Your Earnings</span>
                  <span className="font-bold text-lg text-amber-500">$375</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card className="bg-gradient-card border-border shadow-cinematic text-center p-6">
              <p className="text-sm text-muted-foreground mb-2">Minimum Payout</p>
              <p className="text-2xl font-bold text-amber-500">$25</p>
              <p className="text-xs text-muted-foreground mt-1">Earnings under $25 roll over</p>
            </Card>
            <Card className="bg-gradient-card border-border shadow-cinematic text-center p-6">
              <p className="text-sm text-muted-foreground mb-2">Payment Schedule</p>
              <p className="text-2xl font-bold">Monthly</p>
              <p className="text-xs text-muted-foreground mt-1">Within 15 days of month-end</p>
            </Card>
            <Card className="bg-gradient-card border-border shadow-cinematic text-center p-6">
              <p className="text-sm text-muted-foreground mb-2">Payment Methods</p>
              <p className="text-lg font-bold">PayPal, Direct Deposit, Wire</p>
            </Card>
          </div>
        </section>

        <section className="mb-20" data-testid="section-requirements">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What We're Looking For</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              To be considered for the Voice Marketplace, you must submit:
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {requirements.map((req, index) => (
              <Card key={index} className="bg-gradient-card border-border shadow-cinematic" data-testid={`card-requirement-${index}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-2">{req.title}</h3>
                      <p className="text-sm text-muted-foreground">{req.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="bg-gradient-card border-border shadow-cinematic">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground mb-4">We accept submissions from:</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="secondary">Professional voice actors</Badge>
                <Badge variant="secondary">Aspiring voice talent</Badge>
                <Badge variant="secondary">Actors with voice experience</Badge>
                <Badge variant="secondary">Anyone with a unique voice</Badge>
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Please note: Not all submissions will be accepted. We evaluate each application individually to ensure our marketplace maintains high quality standards.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="mb-20" data-testid="section-faq">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <Card className="bg-gradient-card border-border shadow-cinematic max-w-3xl mx-auto">
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} data-testid={`accordion-faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      <span className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        <section className="mb-20" data-testid="section-trust">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold mb-4">Our Commitment to Voice Actors</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {trustBuilders.map((item, index) => (
              <Card key={index} className="bg-gradient-card border-border shadow-cinematic w-full sm:w-auto sm:min-w-[200px]" data-testid={`card-trust-${index}`}>
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="text-amber-500">{item.icon}</div>
                  <div>
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="text-center mb-10" data-testid="section-cta">
          <Card className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border-amber-500/20 shadow-cinematic max-w-3xl mx-auto">
            <CardContent className="py-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the Future of Voice Acting</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                The entertainment industry is evolving, and AI is creating new opportunities for voice talent. Story Magic is committed to fair compensation, transparent practices, and empowering voice actors.
              </p>
              <p className="text-lg font-medium mb-6">Ready to turn your voice into passive income?</p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white mb-6" 
                data-testid="button-apply-cta"
                onClick={() => setIsApplicationOpen(true)}
              >
                <Mic className="w-5 h-5 mr-2" />
                Apply to Join the Marketplace
              </Button>
              <p className="text-sm text-muted-foreground">
                Questions? Email us at{" "}
                <a href="mailto:voices@storymagicapp.net" className="text-amber-500 hover:underline">
                  voices@storymagicapp.net
                </a>
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <ApplicationFormModal 
        open={isApplicationOpen} 
        onOpenChange={setIsApplicationOpen} 
      />
    </div>
  );
}
