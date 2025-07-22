import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MessageSquare, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const FeedbackForm = () => {
  const [rating, setRating] = useState<string>("");
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Thank you for your feedback!",
        description: "We'll use your insights to improve Story Magic.",
      });
      setRating("");
      setFeedback("");
      setEmail("");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-card border-border shadow-cinematic">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <MessageSquare className="h-5 w-5 text-cinema-gold" />
                Share Your Experience
              </CardTitle>
              <CardDescription>
                Help us perfect the Story Magic experience with your feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="rating">How would you rate your experience?</Label>
                  <RadioGroup value={rating} onValueChange={setRating}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="5" id="5" />
                      <Label htmlFor="5" className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        Excellent
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4" id="4" />
                      <Label htmlFor="4" className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-muted-foreground" />
                        Very Good
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="3" id="3" />
                      <Label htmlFor="3" className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <Star className="h-4 w-4 text-muted-foreground" />
                        Good
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id="2" />
                      <Label htmlFor="2" className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <Star className="h-4 w-4 text-muted-foreground" />
                        Fair
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" id="1" />
                      <Label htmlFor="1" className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-cinema-gold fill-cinema-gold" />
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <Star className="h-4 w-4 text-muted-foreground" />
                        <Star className="h-4 w-4 text-muted-foreground" />
                        Needs Improvement
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Tell us more about your experience</Label>
                  <Textarea
                    id="feedback"
                    placeholder="What did you love? What could be improved? Any suggestions for new features?"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll only use this to follow up on your feedback or notify you of major updates.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  variant="cinema" 
                  className="w-full"
                  disabled={isSubmitting || !rating || !feedback}
                >
                  {isSubmitting ? "Sending..." : "Send Feedback"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};