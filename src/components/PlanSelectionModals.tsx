import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EnterpriseContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
}

export function EnterpriseContactModal({ isOpen, onClose, planName }: EnterpriseContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    teamSize: '',
    needs: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update profile with pending enterprise setup
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          plan_selected: true,
          plan_type: planName,
          account_status: 'pending_enterprise_setup',
          selection_date: new Date().toISOString()
        });

      if (profileError) throw profileError;

      toast({
        title: "Request Submitted!",
        description: "Thanks! We'll contact you within 24 hours to set up your enterprise account.",
      });

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error('Enterprise contact error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Let's set up your {planName} account</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="teamSize">Team Size</Label>
            <Input
              id="teamSize"
              value={formData.teamSize}
              onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
              placeholder="e.g., 15-30 people"
              required
            />
          </div>
          <div>
            <Label htmlFor="needs">Tell us about your needs</Label>
            <Textarea
              id="needs"
              value={formData.needs}
              onChange={(e) => setFormData({ ...formData, needs: e.target.value })}
              placeholder="What are you hoping to accomplish with Story Magic?"
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Processing..." : "Submit & Access Dashboard"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface AcademicVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AcademicVerificationModal({ isOpen, onClose }: AcademicVerificationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    institution: '',
    academicEmail: '',
    status: 'student' as 'student' | 'faculty',
    verification: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Update profile with pending academic verification
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          plan_selected: true,
          plan_type: 'University Program',
          account_status: 'pending_academic_verification',
          selection_date: new Date().toISOString()
        });

      if (profileError) throw profileError;

      toast({
        title: "Verification Submitted!",
        description: "We'll review your academic status within 48 hours.",
      });

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error('Academic verification error:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Academic Verification Required</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="institution">Institution Name</Label>
            <Input
              id="institution"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="e.g., University of California, Berkeley"
              required
            />
          </div>
          <div>
            <Label htmlFor="academicEmail">Academic Email</Label>
            <Input
              id="academicEmail"
              type="email"
              value={formData.academicEmail}
              onChange={(e) => setFormData({ ...formData, academicEmail: e.target.value })}
              placeholder="your.name@university.edu"
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select 
              id="status"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'student' | 'faculty' })}
              required
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          <div>
            <Label htmlFor="verification">Additional Information</Label>
            <Textarea
              id="verification"
              value={formData.verification}
              onChange={(e) => setFormData({ ...formData, verification: e.target.value })}
              placeholder="Student ID, department, program details, etc."
              rows={3}
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Processing..." : "Submit for Verification"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}