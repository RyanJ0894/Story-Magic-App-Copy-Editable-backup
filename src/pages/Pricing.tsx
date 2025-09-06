import { useState, useEffect } from "react";
import { Check, Star, Users, Shield, Zap, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { EnterpriseContactModal, AcademicVerificationModal } from "@/components/PlanSelectionModals";
import { useToast } from "@/hooks/use-toast";
export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [isNewUser, setIsNewUser] = useState(false);
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [academicModalOpen, setAcademicModalOpen] = useState(false);
  const [selectedEnterprisePlan, setSelectedEnterprisePlan] = useState("");
  const {
    toast
  } = useToast();
  useEffect(() => {
    console.log("🎯 Pricing page loaded successfully");
    // Check for newuser parameter
    const urlParams = new URLSearchParams(window.location.search);
    setIsNewUser(urlParams.get('newuser') === 'true');
  }, []);
  const handleIndividualTrial = () => {
    // Redirect to auth page to sign up/sign in before starting trial
    window.location.href = "/auth";
  };
  const handleEnterprisePlan = (planName: string) => {
    setSelectedEnterprisePlan(planName);
    setEnterpriseModalOpen(true);
  };
  const handleAcademicPlan = () => {
    setAcademicModalOpen(true);
  };
  const pricingCards = [{
    id: "individual",
    title: "Individual",
    price: "$30",
    period: "/month",
    billing: "Monthly recurring",
    target: "Perfect for freelancers, independent writers, and individual professionals",
    features: ["Full access to AI voice library", "Unlimited script uploads", "All ambient soundscapes & music", "Sound effects library", "Mobile & desktop access", "Email support"],
    ctaText: "Start Free Trial",
    ctaVariant: "cinema" as const,
    popular: false
  }, {
    id: "starter",
    title: "Starter Enterprise",
    price: "$2,400",
    period: "/year",
    perUser: "($20/user/month)",
    billing: "Annual commitment - paid upfront",
    target: "Small agencies, boutique production companies, university film departments",
    includes: "10 user accounts",
    features: ["Admin dashboard & user management", "Shared script library", "Basic collaboration tools (comments, playlists)", "Standard voice library (20+ voices)", "Email support (48hr response)", "Usage analytics"],
    additionalUsers: "$20/month each (11-25 users: $15/month each)",
    ctaText: "Contact Sales",
    ctaVariant: "cinema-outline" as const,
    popular: false
  }, {
    id: "professional",
    title: "Professional Enterprise",
    price: "$6,000",
    period: "/year",
    perUser: "($16.67/user/month)",
    billing: "Annual commitment - paid upfront",
    target: "Mid-size talent agencies, production companies, established film programs",
    includes: "30 user accounts",
    features: ["Everything in Starter Enterprise, plus:", "Premium voice library (50+ voices)", "Custom voice cloning (up to 5 voices)", "Advanced collaboration suite", "Priority audio processing", "Phone + email support (24hr response)", "Custom ambient sound library (100+ environments)", "Advanced analytics dashboard"],
    additionalUsers: "$20/month each (31-75 users: $15/month each)",
    ctaText: "Contact Sales",
    ctaVariant: "cinema" as const,
    popular: true
  }, {
    id: "studio",
    title: "Studio Enterprise",
    price: "$15,000",
    period: "/year",
    perUser: "($16.67/user/month)",
    billing: "Annual commitment - paid upfront",
    target: "Major talent agencies, film studios, large production companies",
    includes: "75 user accounts",
    features: ["Everything in Professional Enterprise, plus:", "Unlimited custom voice cloning", "Dedicated account manager", "24/7 priority support", "Enterprise-grade security (SSO)", "Custom ambient soundscapes", "Advanced workflow automation", "Detailed reporting suite"],
    additionalUsers: "$20/month each (76-200 users: $15/month each)",
    ctaText: "Contact Sales",
    ctaVariant: "cinema-outline" as const,
    popular: false
  }, {
    id: "unlimited",
    title: "Enterprise Unlimited",
    price: "Custom Pricing",
    period: "",
    billing: "Annual commitment - paid upfront",
    target: "Major studios, large university systems, enterprise-wide implementations",
    includes: "200+ user accounts",
    features: ["Everything in Studio Enterprise, plus:", "Unlimited user accounts", "Dedicated infrastructure", "Custom feature development", "Advanced compliance (SOC 2, GDPR)", "Multiple admin hierarchies", "Custom voice library development", "Quarterly business reviews"],
    baseFee: "Starting at $25,000/year",
    ctaText: "Schedule Consultation",
    ctaVariant: "cinema-outline" as const,
    popular: false
  }, {
    id: "university",
    title: "University Program",
    price: "50% Off Enterprise",
    period: "",
    billing: "Academic year licensing",
    target: "Accredited film schools and university programs",
    options: ["Academic Starter: $1,200/year (10 accounts)", "Academic Professional: $3,000/year (30 accounts)"],
    requirements: "Academic accreditation verification required",
    ctaText: "Apply for Academic Pricing",
    ctaVariant: "cinema-outline" as const,
    popular: false
  }];
  const addOnServices = {
    comingSoon: [{
      name: "Professional voice cloning",
      price: "$500 per voice"
    }, {
      name: "Expanded music library",
      price: "$200/month"
    }, {
      name: "Custom soundscape development",
      price: "$1,000 per environment"
    }, {
      name: "Professional SFX library",
      price: "$100/month"
    }],
    professional: [{
      name: "Dedicated onboarding",
      price: "$2,500 one-time"
    }, {
      name: "Voice coaching consultation",
      price: "$200/hour"
    }]
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
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* New User Welcome Banner */}
      {isNewUser && <section className="bg-gradient-to-r from-cinema-blue/10 to-cinema-gold/10 border-b border-cinema-gold/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-3 text-center">
              <Sparkles className="w-6 h-6 text-cinema-gold" />
              <p className="text-lg font-medium text-foreground">
                Welcome to Story Magic! Please select a plan to access your dashboard and start creating.
              </p>
            </div>
          </div>
        </section>}

      {/* Hero Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Choose Your Story Magic Plan
          </h2>
          <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
        </p>
          <p className="text-lg font-medium max-w-3xl mx-auto text-sky-500">From individual creators to major studios - stop reading scripts. Start experiencing them. Multitask while listening during commutes, workouts, meals, and more.</p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingCards.map(card => <Card key={card.id} className={`relative ${card.popular ? 'border-cinema-gold shadow-glow' : ''}`}>
                {card.popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cinema-gold text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>}
                
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">{card.title}</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-cinema-gold">{card.price}</span>
                      <span className="text-muted-foreground">{card.period}</span>
                    </div>
                    {card.perUser && <p className="text-sm text-muted-foreground">{card.perUser}</p>}
                    <p className="text-sm text-muted-foreground">{card.billing}</p>
                  </div>
                  <CardDescription className="text-sm">{card.target}</CardDescription>
                  {card.includes && <p className="text-sm font-medium text-cinema-gold">{card.includes}</p>}
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {card.features?.map((feature, index) => <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-cinema-gold mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>)}
                    {card.options?.map((option, index) => <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-cinema-gold mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{option}</span>
                      </li>)}
                  </ul>
                  
                  {card.additionalUsers && <p className="text-xs text-muted-foreground border-t pt-2">
                      Additional users: {card.additionalUsers}
                    </p>}
                  
                  {card.baseFee && <p className="text-sm font-medium text-cinema-gold">{card.baseFee}</p>}
                  
                  {card.requirements && <p className="text-xs text-muted-foreground">{card.requirements}</p>}
                </CardContent>

                <CardFooter>
                  {card.id === "individual" ? <Button variant={card.ctaVariant} className="w-full" onClick={handleIndividualTrial}>
                      {card.ctaText}
                    </Button> : card.id === "university" ? <Button variant={card.ctaVariant} className="w-full" onClick={handleAcademicPlan}>
                      {card.ctaText}
                    </Button> : <Button variant={card.ctaVariant} className="w-full" onClick={() => handleEnterprisePlan(card.title)}>
                      {card.ctaText}
                    </Button>}
                </CardFooter>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Add-On Services */}
      <section className="py-16 bg-muted/30">
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
                  {addOnServices.comingSoon.map((service, index) => <li key={index} className="flex justify-between items-center">
                      <span>{service.name}</span>
                      <span className="font-medium text-cinema-gold">{service.price}</span>
                    </li>)}
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
                  {addOnServices.professional.map((service, index) => <li key={index} className="flex justify-between items-center">
                      <span>{service.name}</span>
                      <span className="font-medium text-cinema-gold">{service.price}</span>
                    </li>)}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Industry-Specific Benefits */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Tailored for Your Industry</h3>
          
          <Tabs defaultValue="agencies" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="agencies">Agencies</TabsTrigger>
              <TabsTrigger value="production">Production</TabsTrigger>
              <TabsTrigger value="studios">Studios</TabsTrigger>
              <TabsTrigger value="universities">Universities</TabsTrigger>
            </TabsList>
            
            {Object.entries(industryBenefits).map(([key, industry]) => <TabsContent key={key} value={key} className="mt-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{industry.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid md:grid-cols-2 gap-4">
                      {industry.benefits.map((benefit, index) => <li key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-cinema-gold mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>)}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>)}
          </Tabs>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h3>
          
          <Accordion type="single" collapsible className="max-w-3xl mx-auto">
            <AccordionItem value="item-1">
              <AccordionTrigger>What's included in the free trial?</AccordionTrigger>
              <AccordionContent>
                The free trial includes full access to all Individual plan features for 14 days, including unlimited script uploads, the complete AI voice library, and all ambient soundscapes.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>Can I upgrade or downgrade my plan?</AccordionTrigger>
              <AccordionContent>
                Yes, you can change your plan at any time. For enterprise plans, contact our sales team to discuss migration options and any applicable credits or adjustments.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>How does voice cloning work?</AccordionTrigger>
              <AccordionContent>
                Our AI voice cloning technology requires just a few minutes of audio sample to create a realistic voice clone. Professional and higher plans include custom voice cloning with dedicated support.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>What file formats do you support?</AccordionTrigger>
              <AccordionContent>
                We support all major screenplay formats including Final Draft (.fdx), Fountain (.fountain), PDF, and plain text files. Our AI automatically adapts to different formatting styles.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>Is there enterprise-grade security?</AccordionTrigger>
              <AccordionContent>
                Yes, Studio Enterprise and above include enterprise-grade security features like SSO, advanced compliance (SOC 2, GDPR), and dedicated infrastructure options for sensitive projects.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-accent">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Scripts?
          </h3>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join thousands of industry professionals who are already experiencing their scripts in a whole new way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="cinema-outline" size="lg" asChild className="bg-white/10 border-white text-white hover:bg-white hover:text-primary">
              <Link to="/auth">Start Free Trial</Link>
            </Button>
            <Button variant="cinema-outline" size="lg" asChild className="bg-white/10 border-white text-white hover:bg-white hover:text-primary">
              <Link to="/auth">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Modals */}
      <EnterpriseContactModal isOpen={enterpriseModalOpen} onClose={() => setEnterpriseModalOpen(false)} planName={selectedEnterprisePlan} />
      
      <AcademicVerificationModal isOpen={academicModalOpen} onClose={() => setAcademicModalOpen(false)} />
    </div>;
}