import { useState } from "react";
import { Check, Star, Building2, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/layout/Header";

const CORRECT_PASSWORD = "Masejase0894";

const enterprisePlans = [
  {
    id: "starter-enterprise",
    name: "Starter Enterprise",
    price: "$2,400",
    period: "/year",
    perUser: "($20/user/month)",
    description: "Annual commitment - paid upfront",
    positioning: "Small agencies, boutique production companies, university film departments",
    users: "10 user accounts",
    features: [
      "Admin dashboard & user management",
      "Shared script library",
      "Basic collaboration tools (comments, playlists)",
      "Standard voice library (20+ voices)",
      "Email support (48hr response)",
      "Usage analytics",
    ],
    additionalUsers: "Additional users: $20/month each (11-25 users: $15/month each)",
    ctaText: "Contact Sales",
    popular: false,
  },
  {
    id: "professional-enterprise",
    name: "Professional Enterprise",
    price: "$6,000",
    period: "/year",
    perUser: "($16.67/user/month)",
    description: "Annual commitment - paid upfront",
    positioning: "Mid-size talent agencies, production companies, established film programs",
    users: "30 user accounts",
    features: [
      "Everything in Starter Enterprise, plus:",
      "Premium voice library (50+ voices)",
      "Custom voice cloning (up to 5 voices)",
      "Advanced collaboration suite",
      "Priority audio processing",
      "Phone + email support (24hr response)",
      "Custom ambient sound library (100+ environments)",
      "Advanced analytics dashboard",
    ],
    additionalUsers: "Additional users: $20/month each (31-75 users: $15/month each)",
    ctaText: "Contact Sales",
    popular: true,
  },
  {
    id: "growth-enterprise",
    name: "Growth Enterprise",
    price: "$10,000",
    period: "/year",
    perUser: "($13.89/user/month)",
    description: "Annual commitment - paid upfront",
    positioning: "Growing studios, expanding agencies, multi-department organizations",
    users: "60 user accounts",
    features: [
      "Everything in Professional Enterprise, plus:",
      "Custom voice cloning (up to 15 voices)",
      "Multi-team workspace management",
      "API access for integrations",
      "Dedicated account representative",
      "Priority phone support (4hr response)",
      "Custom SFX library development",
      "White-label options available",
    ],
    additionalUsers: "Additional users: $15/month each (61-100 users: $12/month each)",
    ctaText: "Contact Sales",
    popular: false,
  },
  {
    id: "studio-enterprise",
    name: "Studio Enterprise",
    price: "$15,000",
    period: "/year",
    perUser: "($16.67/user/month)",
    description: "Annual commitment - paid upfront",
    positioning: "Major talent agencies, film studios, large production companies",
    users: "75 user accounts",
    features: [
      "Everything in Professional Enterprise, plus:",
      "Unlimited custom voice cloning",
      "Dedicated account manager",
      "24/7 priority support",
      "Enterprise-grade security (SSO)",
      "Custom ambient soundscapes",
      "Advanced workflow automation",
      "Detailed reporting suite",
    ],
    additionalUsers: "Additional users: $20/month each (76-200 users: $15/month each)",
    ctaText: "Contact Sales",
    popular: false,
  },
  {
    id: "enterprise-unlimited",
    name: "Enterprise Unlimited",
    price: "Custom Pricing",
    period: "",
    perUser: "",
    description: "Annual commitment - paid upfront",
    positioning: "Major studios, large university systems, enterprise-wide implementations",
    users: "200+ user accounts",
    features: [
      "Everything in Studio Enterprise, plus:",
      "Unlimited user accounts",
      "Dedicated infrastructure",
      "Custom feature development",
      "Advanced compliance (SOC 2, GDPR)",
      "Multiple admin hierarchies",
      "Custom voice library development",
      "Quarterly business reviews",
    ],
    additionalUsers: "Starting at $25,000/year",
    ctaText: "Schedule Consultation",
    popular: false,
  },
];

const universityProgram = {
  name: "University Program",
  discount: "50% Off Enterprise",
  description: "Academic year licensing",
  positioning: "Accredited film schools and university programs",
  tiers: [
    "Academic Starter: $1,200/year (10 accounts)",
    "Academic Professional: $3,000/year (30 accounts)",
  ],
  note: "Academic accreditation verification required",
  ctaText: "Apply for Academic Pricing",
};

export default function EnterprisePackages() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-cinema-gold/10">
                  <Lock className="w-8 h-8 text-cinema-gold" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Enterprise Packages</CardTitle>
              <CardDescription>
                Enter the access password to view enterprise pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                  data-testid="input-enterprise-password"
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button 
                  type="submit" 
                  variant="cinema" 
                  className="w-full"
                  data-testid="button-submit-password"
                >
                  Access Packages
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Enterprise Packages
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Scalable solutions for teams, agencies, and studios of all sizes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {enterprisePlans.map((plan) => (
              <Card 
                key={plan.id}
                className={`relative flex flex-col ${plan.popular ? 'border-cinema-gold ring-2 ring-cinema-gold/20' : 'border-border'}`}
                data-testid={`card-plan-${plan.id}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cinema-gold text-cinema-dark">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-cinema-gold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.perUser && (
                      <p className="text-sm text-muted-foreground">{plan.perUser}</p>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.positioning}
                  </p>
                  <p className="text-sm font-semibold text-cinema-gold mt-2">
                    {plan.users}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-cinema-gold flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.additionalUsers && (
                    <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                      {plan.additionalUsers}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={plan.popular ? "cinema" : "cinema-outline"} 
                    className="w-full"
                    data-testid={`button-${plan.id}`}
                  >
                    {plan.ctaText}
                  </Button>
                </CardFooter>
              </Card>
            ))}

            <Card className="border-cinema-blue/30 bg-gradient-to-br from-cinema-blue/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-xl">{universityProgram.name}</CardTitle>
                <div className="space-y-1">
                  <span className="text-2xl font-bold text-cinema-gold">{universityProgram.discount}</span>
                </div>
                <CardDescription className="text-sm">
                  {universityProgram.description}
                </CardDescription>
                <p className="text-sm text-muted-foreground mt-2">
                  {universityProgram.positioning}
                </p>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2">
                  {universityProgram.tiers.map((tier, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-cinema-gold flex-shrink-0 mt-0.5" />
                      <span>{tier}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
                  {universityProgram.note}
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  variant="cinema-outline" 
                  className="w-full"
                  data-testid="button-academic-apply"
                >
                  {universityProgram.ctaText}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>For custom enterprise solutions, please contact our sales team.</p>
        </div>
      </footer>
    </div>
  );
}
