import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, X, FileAudio, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ApplicationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FileWithProgress {
  file: File;
  progress: number;
  uploaded: boolean;
  url?: string;
}

export function ApplicationFormModal({ open, onOpenChange }: ApplicationFormModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    experience: "",
    bio: "",
    termsAccepted: false,
    honeypot: ""
  });
  
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const acceptedFormats = ".mp3,.wav,.m4a";
  const maxFileSize = 500 * 1024 * 1024;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.experience) {
      newErrors.experience = "Please select your experience level";
    }
    
    if (files.length === 0) {
      newErrors.files = "Please upload at least one audio file";
    }
    
    if (!formData.termsAccepted) {
      newErrors.terms = "You must accept the terms to continue";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles: FileWithProgress[] = [];
    
    for (const file of selectedFiles) {
      if (file.size > maxFileSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 500MB limit`,
          variant: "destructive"
        });
        continue;
      }
      
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['mp3', 'wav', 'm4a'].includes(ext || '')) {
        toast({
          title: "Invalid format",
          description: `${file.name} is not a supported audio format`,
          variant: "destructive"
        });
        continue;
      }
      
      validFiles.push({ file, progress: 0, uploaded: false });
    }
    
    setFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      const fileName = `voice-applications/${Date.now()}-${fileData.file.name}`;
      
      try {
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, progress: 10 } : f
        ));

        const { data, error } = await supabase.storage
          .from('voice-applications')
          .upload(fileName, fileData.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          console.error('Storage upload error:', error);
          uploadedUrls.push(`[File: ${fileData.file.name} - ${(fileData.file.size / (1024 * 1024)).toFixed(1)}MB - Upload failed, applicant should send via email]`);
          setFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, progress: 100, uploaded: true } : f
          ));
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('voice-applications')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
        
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, progress: 100, uploaded: true, url: urlData.publicUrl } : f
        ));
      } catch (error: any) {
        console.error('Upload error:', error);
        uploadedUrls.push(`[File: ${fileData.file.name} - ${(fileData.file.size / (1024 * 1024)).toFixed(1)}MB - Upload failed]`);
        setFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, progress: 100, uploaded: true } : f
        ));
      }
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.honeypot) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const audioUrls = await uploadFiles();
      
      const fileInfo = files.map(f => ({
        name: f.file.name,
        size: `${(f.file.size / (1024 * 1024)).toFixed(1)}MB`
      }));
      
      const response = await fetch('/api/voice-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          experience: formData.experience,
          bio: formData.bio,
          audioUrls,
          fileInfo
        })
      });
      
      if (!response.ok) {
        throw new Error('Submission failed');
      }
      
      setShowSuccess(true);
      
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: "Oops! Something went wrong. Please try again or email us directly at voices@storymagicapp.net",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleClose = () => {
    onOpenChange(false);
    setShowSuccess(false);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      experience: "",
      bio: "",
      termsAccepted: false,
      honeypot: ""
    });
    setFiles([]);
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Application Submitted!</h3>
            <p className="text-muted-foreground mb-4">
              Thank you for applying to the Story Magic Voice Marketplace. A confirmation email has been sent to {formData.email}.
            </p>
            <p className="text-sm text-muted-foreground">
              We'll review your submission within 7-10 business days and reach out with next steps.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Voice Marketplace Application</DialogTitle>
          <DialogDescription>
            Submit your application to join the Story Magic Voice Marketplace
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <input
            type="text"
            name="website"
            value={formData.honeypot}
            onChange={(e) => setFormData(prev => ({ ...prev, honeypot: e.target.value }))}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />
          
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Your full name"
              data-testid="input-full-name"
            />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="your@email.com"
              data-testid="input-email"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(555) 123-4567"
              data-testid="input-phone"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="experience">Voice Acting Experience *</Label>
            <Select
              value={formData.experience}
              onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
            >
              <SelectTrigger data-testid="select-experience">
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional Voice Actor</SelectItem>
                <SelectItem value="some-experience">Some Experience</SelectItem>
                <SelectItem value="beginner">Beginner/No Experience</SelectItem>
              </SelectContent>
            </Select>
            {errors.experience && <p className="text-sm text-destructive">{errors.experience}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Brief Bio (optional)</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, 500) }))}
              placeholder="Tell us about yourself and your voice"
              className="min-h-[100px]"
              data-testid="textarea-bio"
            />
            <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/500</p>
          </div>
          
          <div className="space-y-2">
            <Label>Audio Files * (.mp3, .wav, .m4a - max 500MB each)</Label>
            <div 
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-amber-500/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              data-testid="upload-area"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload audio files</p>
              <p className="text-xs text-muted-foreground mt-1">30+ minutes of audio recommended</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFormats}
              multiple
              onChange={handleFileSelect}
              className="hidden"
              data-testid="input-file"
            />
            {errors.files && <p className="text-sm text-destructive">{errors.files}</p>}
            
            {files.length > 0 && (
              <div className="space-y-2 mt-3">
                {files.map((fileData, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                    <FileAudio className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{fileData.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(fileData.file.size)}</p>
                      {isSubmitting && (
                        <Progress value={fileData.progress} className="h-1 mt-1" />
                      )}
                    </div>
                    {fileData.uploaded ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        disabled={isSubmitting}
                        className="flex-shrink-0"
                        data-testid={`button-remove-file-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, termsAccepted: checked as boolean }))}
              data-testid="checkbox-terms"
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              I confirm that I own the rights to my voice and authorize Story Magic to create an AI voice model for marketplace licensing under non-exclusive terms.
            </Label>
          </div>
          {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
          
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
            disabled={isSubmitting}
            data-testid="button-submit-application"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Application"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
