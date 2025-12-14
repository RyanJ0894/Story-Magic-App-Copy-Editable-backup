import { useState, useEffect } from "react";
import { Check, X, Star, Users, Zap, Sparkles, Building2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { EnterpriseContactModal, AcademicVerificationModal } from "@/components/layout/PlanSelectionModals";
import { useToast } from "@/hooks/use-toast";

type PricingTier = {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  positioning: string;
  features: string[];
  limitations: string[];
  perfectFor?: string[];
  ctaText: string;
  popular: boolean;
};

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [academicModalOpen, setAcademicModalOpen] = useState(false);
  const [selectedEnterprisePlan, setSelectedEnterprisePlan] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    console.log("Pricing page loaded successfully");
    const urlParams = new URLSearchParams(window.location.search);
    setIsNewUser(urlParams.get('newuser') === 'true');
  }, []);

  const handleGetStarted = (tierName: string) => {
    window.location.href = "/auth";
  };

  const handleEnterpriseInquiry = () => {
    setSelectedEnterprisePlan("Enterprise");
    setEnterpriseModalOpen(true);
  };

  const pricingTiers: PricingTier[] = [
    {
      id: "free",
      name: "Free",
      tagline: "Discovery",
      monthlyPrice: 0,
      annualPrice: 0,
      positioning: "Experience cinematic audio production - once.",
      features: [
        "1 script upload per month (up to 150 pages)",
        "Full standard AI voice library (50+ voices)",
        "Complete music library (100+ tracks)",
        "Full ambience & SFX library",
        "Unlimited voice recasting",
        "Screenplay-style playback interface",
        "Studio-quality audio (broadcast standard)",
        "Clean audio exports (no watermark)",
        "Download your audio (M4A format)"
      ],
      limitations: [
        "7-day project storage",
        "Only 1 script per month",
        "No voice cloning",
        "No premium voices",
        "No priority processing",
        "No commercial use rights",
        "No collaboration features"
      ],
      ctaText: "Create Your First Script Free",
      popular: false
    },
    {
      id: "starter",
      name: "Starter",
      tagline: "Individual",
      monthlyPrice: 30,
      annualPrice: 288,
      positioning: "For writers and actors who need reliable access",
      features: [
        "5 script uploads per month (up to 150 pages each)",
        "Full standard AI voice library (50+ voices)",
        "Complete music library (100+ tracks)",
        "Full ambience & SFX library",
        "Unlimited voice recasting",
        "Clean audio exports (no watermark)",
        "Studio-quality audio (broadcast standard)",
        "Unlimited downloads (M4A format)",
        "30-day project storage",
        "Mobile & desktop access",
        "Email support (48hr response)",
        "Personal use & portfolio allowed"
      ],
      limitations: [
        "No voice cloning",
        "No premium voice library",
        "No priority processing",
        "No commercial licensing",
        "No collaboration"
      ],
      ctaText: "Start 7-Day Free Trial",
      popular: false
    },
    {
      id: "pro",
      name: "Pro",
      tagline: "Professional",
      monthlyPrice: 60,
      annualPrice: 576,
      positioning: "For working professionals bringing scripts to life",
      features: [
        "15 script uploads per month (up to 150 pages each)",
        "Premium AI voice library (100+ voices)",
        "Custom voice cloning (up to 3 cloned voices)",
        "Premium music library (300+ tracks, genre-specific)",
        "Advanced SFX library (500+ effects)",
        "Priority processing (2x faster generation)",
        "90-day project storage",
        "WAV export option (uncompressed)",
        "Commercial use rights",
        "Collaboration sharing (up to 3 people)",
        "Email support (24hr response)"
      ],
      limitations: [],
      perfectFor: [
        "Screenwriters pitching scripts to studios",
        "Actors rehearsing and auditioning",
        "Indie filmmakers in pre-production",
        "Directors testing casting options"
      ],
      ctaText: "Start 7-Day Free Trial",
      popular: true
    },
    {
      id: "creator",
      name: "Creator",
      tagline: "Elite",
      monthlyPrice: 100,
      annualPrice: 960,
      positioning: "Unlimited creative freedom for serious filmmakers",
      features: [
        "Unlimited script uploads (up to 150 pages each)",
        "Full premium voice library (150+ voices)",
        "Custom voice cloning (up to 10 cloned voices)",
        "Exclusive voice marketplace access",
        "Genre-specific sound packs (Horror, Sci-Fi, Romance, etc.)",
        "Script collaboration rooms (real-time multi-user)",
        "Casting simulation mode",
        "Unlimited project storage",
        "Multi-format exports (M4A, WAV, MP3)",
        "White-label audio (your branding option)",
        "Priority support (4hr response, phone available)",
        "Early access to new features",
        "Full commercial licensing"
      ],
      limitations: [],
      perfectFor: [
        "Professional filmmakers",
        "Production companies (small teams)",
        "Casting directors",
        "Film school instructors",
        "Prolific writers with multiple projects"
      ],
      ctaText: "Start 7-Day Free Trial",
      popular: false
    }
  ];

  const addOnServices = {
    comingSoon: [
      { name: "Professional voice cloning", price: "$500 per voice" },
      { name: "Expanded music library", price: "$200/month" },
      { name: "Custom soundscape development", price: "$1,000 per environment" },
      { name: "Professional SFX library", price: "$100/month" }
    ],
    professional: [
      { name: "Dedicated onboarding", price: "$2,500 one-time" },
      { name: "Voice coaching consultation", price: "$200/hour" }
    ]
  };

  const industryBenefits = {
    agencies: {
      title: "For Talent Agencies",
      benefits: ["Bulk voice cloning for client roster", "Client progress tracking", "Streamlined script review", "Custom branding options"]
    },
    production: {
      title: "For Production Companies",
      benefits: ["Project-based organization", "Distributed team collaboration", "Version control for scripts", "Production tool integrations"]
    },
    studios: {
      title: "For Film Studios",
      benefits: ["Enterprise-grade security", "Advanced decision-making analytics", "Scalable infrastructure", "Custom workflow development"]
    },
    universities: {
      title: "For Universities",
      benefits: ["Student portfolio tools", "Professor oversight features", "Curriculum alignment", "Academic collaboration tools"]
    }
  };

  const formatPrice = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) return "$0";
    if (isAnnual) {
      const monthlyEquivalent = Math.floor(tier.annualPrice / 12);
      return `$${monthlyEquivalent}`;
    }
    return `$${tier.monthlyPrice}`;
  };

  const getAnnualSavings = (tier: PricingTier) => {
    if (tier.monthlyPrice === 0) return 0;
    return (tier.monthlyPrice * 12) - tier.annualPrice;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {isNewUser && (
        <section className="bg-gradient-to-r from-cinema-blue/10 to-cinema-gold/10 border-b border-cinema-gold/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-3 text-center">
              <Sparkles className="w-6 h-6 text-cinema-gold" />
              <p className="text-lg font-medium text-foreground">
                Welcome to Story Magic! Please select a plan to access your dashboard and start creating.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="py-8 md:py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Choose Your Story Magic Plan
          </h2>
          <p className="text-lg font-medium max-w-3xl mx-auto text-muted-foreground mb-8">
            From hobbyists to professional filmmakers - stop reading scripts. Start experiencing them. 
            Multitask while listening during commutes, workouts, meals, and more.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </Label>
            <Switch
              id="billing-toggle"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              data-testid="switch-billing-toggle"
            />
            <Label htmlFor="billing-toggle" className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </Label>
            {isAnnual && (
              <Badge variant="secondary" className="bg-cinema-gold/20 text-cinema-gold border-cinema-gold/30">
                Save 20% on paid plans
              </Badge>
            )}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.id} 
                className={`relative flex flex-col ${tier.popular ? 'border-cinema-gold shadow-glow' : ''}`}
                data-testid={`card-pricing-${tier.id}`}
              >
                {tier.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cinema-gold text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">{tier.tagline}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-cinema-gold">{formatPrice(tier)}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {isAnnual && tier.monthlyPrice > 0 && (
                      <p className="text-sm text-cinema-gold">
                        ${tier.annualPrice}/year (save ${getAnnualSavings(tier)})
                      </p>
                    )}
                    {!isAnnual && tier.monthlyPrice > 0 && (
                      <p className="text-sm text-muted-foreground">Billed monthly</p>
                    )}
                  </div>
                  <CardDescription className="text-sm mt-2">{tier.positioning}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <ul className="space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-cinema-gold mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {tier.limitations.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-2">Limitations:</p>
                      <ul className="space-y-1">
                        {tier.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <X className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-muted-foreground">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tier.perfectFor && tier.perfectFor.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-foreground mb-2">Perfect for:</p>
                      <ul className="space-y-1">
                        {tier.perfectFor.map((item, index) => (
                          <li key={index} className="text-xs text-muted-foreground">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-4">
                  <Button 
                    variant={tier.popular ? "cinema" : "cinema-outline"} 
                    className="w-full"
                    onClick={() => handleGetStarted(tier.name)}
                    data-testid={`button-cta-${tier.id}`}
                  >
                    {tier.ctaText}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-cinema-blue/30 bg-gradient-to-br from-cinema-blue/5 to-cinema-gold/5">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-cinema-blue/10">
                    <Building2 className="w-8 h-8 text-cinema-blue" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Need Enterprise Solutions?</CardTitle>
                <CardDescription className="text-base max-w-2xl mx-auto">
                  For large teams, talent agencies, production companies, and film studios that require 
                  advanced collaboration, custom integrations, SSO, and dedicated support.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cinema-gold">10-200+</p>
                    <p className="text-sm text-muted-foreground">Team members</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cinema-gold">Custom</p>
                    <p className="text-sm text-muted-foreground">Voice libraries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-cinema-gold">24/7</p>
                    <p className="text-sm text-muted-foreground">Priority support</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="cinema" 
                    size="lg"
                    onClick={handleEnterpriseInquiry}
                    data-testid="button-enterprise-contact"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Sales
                  </Button>
                  <Button 
                    variant="cinema-outline" 
                    size="lg"
                    onClick={() => setAcademicModalOpen(true)}
                    data-testid="button-academic-inquiry"
                  >
                    Academic Pricing Available
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Enhance Your Experience</h3>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cinema-gold" />
                  Coming Soon Add-Ons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {addOnServices.comingSoon.map((service, index) => (
                    <li key={index} className="flex justify-between items-center gap-4">
                      <span>{service.name}</span>
                      <span className="font-medium text-cinema-gold whitespace-nowrap">{service.price}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-cinema-gold" />
                  Professional Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {addOnServices.professional.map((service, index) => (
                    <li key={index} className="flex justify-between items-center gap-4">
                      <span>{service.name}</span>
                      <span className="font-medium text-cinema-gold whitespace-nowrap">{service.price}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Tailored for Your Industry</h3>
          
          <Tabs defaultValue="agencies" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="agencies" data-testid="tab-agencies">Agencies</TabsTrigger>
              <TabsTrigger value="production" data-testid="tab-production">Production</TabsTrigger>
              <TabsTrigger value="studios" data-testid="tab-studios">Studios</TabsTrigger>
              <TabsTrigger value="universities" data-testid="tab-universities">Universities</TabsTrigger>
            </TabsList>
            
            {Object.entries(industryBenefits).map(([key, industry]) => (
              <TabsContent key={key} value={key} className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{industry.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid md:grid-cols-2 gap-4">
                      {industry.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-cinema-gold mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h3>
          
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            <AccordionItem value="item-1">
              <AccordionTrigger>What's included in the Free tier?</AccordionTrigger>
              <AccordionContent>
                The Free tier gives you full access to create one cinematic audio production per month. 
                You get access to our complete standard voice library (50+ voices), music library (100+ tracks), 
                and all ambience and SFX. Projects are stored for 7 days, and you can download your audio in M4A format.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>What's included in the free trial?</AccordionTrigger>
              <AccordionContent>
                The 7-day free trial on Starter, Pro, and Creator plans gives you full access to all features 
                of that tier. You can cancel anytime during the trial without being charged.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>Can I upgrade or downgrade my plan?</AccordionTrigger>
              <AccordionContent>
                Yes, you can change your plan at any time. When upgrading, you'll get immediate access to new features 
                and be charged a prorated amount. When downgrading, changes take effect at your next billing cycle.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>How does voice cloning work?</AccordionTrigger>
              <AccordionContent>
                Voice cloning is available on Pro (3 voices) and Creator (10 voices) plans. Our AI technology 
                requires just a few minutes of audio sample to create a realistic voice clone. All cloned voices 
                are for your exclusive use.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>What are commercial use rights?</AccordionTrigger>
              <AccordionContent>
                Commercial use rights (included in Pro and Creator plans) allow you to use your generated audio 
                for commercial projects including films, advertisements, podcasts, and any monetized content. 
                Free and Starter plans are for personal use and portfolio only.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>What file formats do you support?</AccordionTrigger>
              <AccordionContent>
                We support all major screenplay formats including Final Draft (.fdx), Fountain (.fountain), PDF, 
                and plain text files. For exports, Free and Starter plans offer M4A format, Pro adds WAV, 
                and Creator includes M4A, WAV, and MP3 options.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger>Do you offer refunds?</AccordionTrigger>
              <AccordionContent>
                Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not satisfied with 
                Story Magic, contact our support team within 30 days of your purchase for a full refund.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="py-16 bg-gradient-accent">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Scripts?
          </h3>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who are already experiencing their scripts in a whole new way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="cinema-outline" 
              size="lg" 
              asChild 
              className="bg-white/10 border-white text-white hover:bg-white hover:text-primary"
            >
              <Link to="/auth" data-testid="link-start-free">Start Free</Link>
            </Button>
            <Button 
              variant="cinema-outline" 
              size="lg" 
              className="bg-white/10 border-white text-white hover:bg-white hover:text-primary"
              onClick={handleEnterpriseInquiry}
              data-testid="link-contact-sales-footer"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      <EnterpriseContactModal 
        isOpen={enterpriseModalOpen} 
        onClose={() => setEnterpriseModalOpen(false)} 
        planName={selectedEnterprisePlan} 
      />
      
      <AcademicVerificationModal 
        isOpen={academicModalOpen} 
        onClose={() => setAcademicModalOpen(false)} 
      />
    </div>
  );
}
