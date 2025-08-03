import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Volume2,
  Download,
  Mic,
  FileText,
  Save,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScriptParser, ParsedScript, Character } from "@/lib/scriptParser";
import { MultiVoiceGenerator, AudioSegment, GenerationProgress } from "@/lib/multiVoiceGenerator";
import CharacterVoiceAssignment from "@/components/CharacterVoiceAssignment";
import ScriptPreview from "@/components/ScriptPreview";

interface MultiVoicePanelProps {
  scriptText?: string;
  defaultApiKey?: string;
  allowScriptEdit?: boolean;
  projectId?: string;
  onScriptChange?: (scriptText: string) => void;
  onAudioSaved?: (audioUrl: string) => void;
}

export default function MultiVoicePanel({ 
  scriptText: initialScriptText = "", 
  defaultApiKey = "sk_d166b9980919a408b73eede7ad7cc1b65f892ee39307c7cf",
  allowScriptEdit = true,
  projectId,
  onScriptChange,
  onAudioSaved
}: MultiVoicePanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [scriptText, setScriptText] = useState(initialScriptText);
  const [parsedScript, setParsedScript] = useState<ParsedScript>({ 
    scenes: [], 
    characters: [], 
    narrator: { voiceId: 'JBFqnCBsd6RMkjVDRZzb', voiceName: 'George (Narrator, Deep)' },
    totalLines: 0 
  });
  const [characterVoices, setCharacterVoices] = useState<Character[]>([]);
  const [multiVoiceGenerating, setMultiVoiceGenerating] = useState(false);
  const [multiVoiceAudioUrl, setMultiVoiceAudioUrl] = useState<string | null>(null);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [showMultiVoicePlayer, setShowMultiVoicePlayer] = useState(false);
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load saved data when component mounts
  useEffect(() => {
    if (projectId && user) {
      loadSavedData();
    }
  }, [projectId, user]);

  // Update scriptText when initialScriptText changes (e.g., when project script loads)
  useEffect(() => {
    if (initialScriptText && !scriptText) {
      setScriptText(initialScriptText);
    }
  }, [initialScriptText, scriptText]);

  const loadSavedData = async () => {
    if (!projectId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('multi_voice_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading saved data:', error);
        return;
      }

      if (data) {
        setScriptText(data.script_text || '');
        setCharacterVoices(data.character_voices || []);
        if (data.audio_url) {
          setMultiVoiceAudioUrl(data.audio_url);
          setShowMultiVoicePlayer(true);
        }
        toast({
          title: "Saved data loaded",
          description: "Your previous multi-voice data has been restored",
        });
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToSupabase = async () => {
    if (!projectId || !user) {
      toast({
        title: "Cannot save",
        description: "Project ID or user not available",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Save audio file to Supabase storage if we have generated audio
      let audioUrl = multiVoiceAudioUrl;
      
      if (multiVoiceAudioUrl) {
        console.log('Saving audio URL:', multiVoiceAudioUrl);
        console.log('Audio URL type:', typeof multiVoiceAudioUrl);
        console.log('Audio URL starts with blob:', multiVoiceAudioUrl.startsWith('blob:'));
        
        if (multiVoiceAudioUrl.startsWith('blob:')) {
          console.log('Converting blob URL to file...');
          
          try {
            // Convert blob URL to actual blob and upload
            const response = await fetch(multiVoiceAudioUrl);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
            }
            
            const audioBlob = await response.blob();
            console.log('Audio blob size:', audioBlob.size, 'bytes');
            console.log('Audio blob type:', audioBlob.type);
            
            if (audioBlob.size === 0) {
              throw new Error('Audio blob is empty');
            }
            
            const fileName = `${user.id}/${projectId}/multi-voice-audio-${Date.now()}.wav`;
            console.log('Uploading to:', fileName);
            
            const { error: uploadError } = await supabase.storage
              .from('user-files')
              .upload(fileName, audioBlob, {
                upsert: true,
                contentType: 'audio/wav'
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw uploadError;
            }

            console.log('Upload successful, getting public URL...');
            const { data: urlData } = supabase.storage
              .from('user-files')
              .getPublicUrl(fileName);
            
            audioUrl = urlData.publicUrl;
            console.log('Public URL:', audioUrl);
            
            // Test the uploaded file
            const testResponse = await fetch(audioUrl, { method: 'HEAD' });
            console.log('Uploaded file test:', testResponse.status, testResponse.statusText);
            
            if (!testResponse.ok) {
              throw new Error(`Uploaded file not accessible: ${testResponse.status}`);
            }
            
            console.log('File upload and test successful!');
            
          } catch (blobError) {
            console.error('Blob upload error:', blobError);
            toast({
              title: "Audio upload failed",
              description: `Failed to upload audio file to storage: ${blobError.message}`,
              variant: "destructive",
            });
            return;
          }
        } else if (multiVoiceAudioUrl.startsWith('http')) {
          // URL is already a public URL, use it directly
          console.log('Using existing public URL:', multiVoiceAudioUrl);
          audioUrl = multiVoiceAudioUrl;
        } else {
          console.error('Invalid audio URL format:', multiVoiceAudioUrl);
          toast({
            title: "Invalid audio URL",
            description: "Audio URL format is not supported",
            variant: "destructive",
          });
          return;
        }
      } else {
        console.log('No audio URL to save');
        toast({
          title: "No audio to save",
          description: "Generate audio first before saving",
          variant: "destructive",
        });
        return;
      }

      console.log('Saving to multi_voice_data table with audio URL:', audioUrl);
      // Save data to multi_voice_data table
      const { error } = await supabase
        .from('multi_voice_data')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          script_text: scriptText,
          character_voices: characterVoices,
          audio_url: audioUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'project_id,user_id'
        });

      if (error) {
        console.error('Multi-voice data save error:', error);
        throw error;
      }

      console.log('Updating user_projects table...');
      // Also update the user_projects table with the audio URL
      if (audioUrl) {
        const { error: projectUpdateError } = await supabase
          .from('user_projects')
          .update({ 
            audio_url: audioUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId);

        if (projectUpdateError) {
          console.error('Error updating project audio URL:', projectUpdateError);
          // Don't throw here, as the multi-voice data was saved successfully
        }
      }

      // Update the audio URL if we uploaded a new file
      if (audioUrl && audioUrl !== multiVoiceAudioUrl) {
        setMultiVoiceAudioUrl(audioUrl);
      }

      console.log('Save completed successfully!');
      toast({
        title: "Data saved successfully!",
        description: "Your script and audio have been saved to the cloud",
      });
      onAudioSaved?.(audioUrl);
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Save failed",
        description: "Failed to save data to the cloud",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (scriptText.trim()) {
      try {
        const parsed = ScriptParser.parseScript(scriptText);
        setParsedScript(parsed);
        
        // Only assign default voices if we don't have any saved character voices
        if (parsed.characters.length > 0 && characterVoices.length === 0) {
          console.log('🎭 Assigning default voices to new characters');
          const defaultVoices = ScriptParser.assignDefaultVoices(parsed.characters);
          setCharacterVoices(defaultVoices);
        } else if (parsed.characters.length > 0 && characterVoices.length > 0) {
          console.log('🎭 Preserving existing character voice assignments');
          // Update character voices to include any new characters not yet assigned
          const existingCharacterNames = characterVoices.map(cv => cv.name);
          const newCharacters = parsed.characters.filter(char => !existingCharacterNames.includes(char));
          
          if (newCharacters.length > 0) {
            console.log('🎭 Adding voices for new characters:', newCharacters);
            const newVoices = ScriptParser.assignDefaultVoices(newCharacters);
            setCharacterVoices(prev => [...prev, ...newVoices]);
          }
        }
      } catch (error) {
        console.error("Error parsing script:", error);
        toast({
          title: "Script parsing failed",
          description: "Could not parse the script. Please check the format.",
          variant: "destructive",
        });
      }
    } else {
      setParsedScript({ 
        scenes: [], 
        characters: [], 
        narrator: { voiceId: 'JBFqnCBsd6RMkjVDRZzb', voiceName: 'George (Narrator, Deep)' },
        totalLines: 0 
      });
      setCharacterVoices([]);
    }
  }, [scriptText, toast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    
    // Add detailed error handling
    const handleError = (event: Event) => {
      const audioElement = event.target as HTMLAudioElement;
      console.error('Audio playback error:', {
        error: audioElement.error,
        networkState: audioElement.networkState,
        readyState: audioElement.readyState,
        src: audioElement.src,
        currentSrc: audioElement.currentSrc
      });
      
      if (audioElement.error) {
        console.error('Audio error details:', {
          code: audioElement.error.code,
          message: audioElement.error.message
        });
      }
      
      toast({
        title: "Audio playback error",
        description: `Error playing audio: ${audioElement.error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    };
    
    const handleLoadStart = () => {
      console.log('Audio loading started:', audio.src);
    };
    
    const handleCanPlay = () => {
      console.log('Audio can play:', {
        duration: audio.duration,
        readyState: audio.readyState,
        networkState: audio.networkState
      });
    };
    
    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded:', {
        duration: audio.duration,
        currentSrc: audio.currentSrc
      });
      setDuration(audio.duration);
    };
    
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [multiVoiceAudioUrl, toast]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value[0] / 100;
    setVolume(value[0]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVoiceChange = (characterName: string, voiceId: string, voiceName: string) => {
    setCharacterVoices(prev => {
      const existing = prev.find(cv => cv.name === characterName);
      if (existing) {
        return prev.map(cv => 
          cv.name === characterName 
            ? { ...cv, voiceId, voiceName }
            : cv
        );
      } else {
        return [...prev, { name: characterName, voiceId, voiceName }];
      }
    });
  };

  const handleAssignAllVoices = () => {
    if (parsedScript.characters.length > 0) {
      const defaultVoices = ScriptParser.assignDefaultVoices(parsedScript.characters);
      setCharacterVoices(defaultVoices);
      toast({
        title: "Voices assigned!",
        description: `Assigned voices to ${parsedScript.characters.length} characters`,
      });
    }
  };

  const generateMultiVoiceAudio = async (forceRegenerate = false) => {
    console.log('🔥 GENERATING MULTI-VOICE AUDIO - Force regenerate:', forceRegenerate);
    
    if (forceRegenerate) {
      console.log('🗑️ Clearing existing audio data for fresh generation...');
      setMultiVoiceAudioUrl(null);
      setAudioSegments([]);
      
      // Clear from database too
      if (projectId && user) {
        try {
          await supabase
            .from('multi_voice_data')
            .delete()
            .eq('project_id', projectId)
            .eq('user_id', user.id);
          console.log('✅ Cleared cached multi-voice data from database');
        } catch (error) {
          console.error('Failed to clear cached data:', error);
        }
      }
    }
    
    if (!apiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your ElevenLabs API key.",
        variant: "destructive",
      });
      return;
    }
    if (parsedScript.totalLines === 0) {
      toast({
        title: "No script content",
        description: "Please provide a script with dialogue to generate audio.",
        variant: "destructive",
      });
      return;
    }
    if (characterVoices.length === 0) {
      toast({
        title: "No voices assigned",
        description: "Please assign voices to characters first.",
        variant: "destructive",
      });
      return;
    }
    setMultiVoiceGenerating(true);
    setMultiVoiceAudioUrl(null);
    setAudioSegments([]);
    setGenerationProgress(null);
    try {
      const generator = new MultiVoiceGenerator(apiKey, (progress) => {
        setGenerationProgress(progress);
      });
      const result = await generator.generateMultiVoiceAudio(parsedScript, characterVoices);
      
      console.log('Audio generation completed:', result);
      console.log('Audio URL type:', typeof result.audioUrl);
      console.log('Audio URL:', result.audioUrl);
      
      setMultiVoiceAudioUrl(result.audioUrl);
      setAudioSegments(result.segments);
      setShowMultiVoicePlayer(true);
      
      // Automatically save to Supabase if we have a project ID
      if (projectId) {
        console.log('Auto-saving generated audio to Supabase...');
        // Pass the audio URL directly to avoid timing issues
        await saveToSupabaseWithAudio(result.audioUrl);
      }
      
      toast({
        title: "Multi-voice audio generated!",
        description: `Generated audio for ${result.segments.length} dialogue lines`,
      });
    } catch (error) {
      console.error("Error generating multi-voice audio:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate multi-voice audio",
        variant: "destructive",
      });
    } finally {
      setMultiVoiceGenerating(false);
      setGenerationProgress(null);
    }
  };

  // New function to save with explicit audio URL
  const saveToSupabaseWithAudio = async (audioUrlToSave: string) => {
    if (!projectId || !user) {
      toast({
        title: "Cannot save",
        description: "Project ID or user not available",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Save audio file to Supabase storage if we have generated audio
      let finalAudioUrl = audioUrlToSave;
      
      if (audioUrlToSave) {
        console.log('Saving audio URL:', audioUrlToSave);
        console.log('Audio URL type:', typeof audioUrlToSave);
        console.log('Audio URL starts with blob:', audioUrlToSave.startsWith('blob:'));
        
        if (audioUrlToSave.startsWith('blob:')) {
          console.log('Converting blob URL to file...');
          
          try {
            // Convert blob URL to actual blob and upload
            const response = await fetch(audioUrlToSave);
            
            if (!response.ok) {
              throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
            }
            
            const audioBlob = await response.blob();
            console.log('Audio blob size:', audioBlob.size, 'bytes');
            console.log('Audio blob type:', audioBlob.type);
            
            if (audioBlob.size === 0) {
              throw new Error('Audio blob is empty');
            }
            
            const fileName = `${user.id}/${projectId}/multi-voice-audio-${Date.now()}.wav`;
            console.log('Uploading to:', fileName);
            
            const { error: uploadError } = await supabase.storage
              .from('user-files')
              .upload(fileName, audioBlob, {
                upsert: true,
                contentType: 'audio/wav'
              });

            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw uploadError;
            }

            console.log('Upload successful, getting public URL...');
            const { data: urlData } = supabase.storage
              .from('user-files')
              .getPublicUrl(fileName);
            
            finalAudioUrl = urlData.publicUrl;
            console.log('Public URL:', finalAudioUrl);
            
            // Also try to get a signed URL for better access
            const { data: signedUrlData, error: signedUrlError } = await supabase.storage
              .from('user-files')
              .createSignedUrl(fileName, 86400); // 24 hours expiry
            
            if (!signedUrlError && signedUrlData) {
              console.log('Signed URL generated:', signedUrlData.signedUrl);
              finalAudioUrl = signedUrlData.signedUrl; // Use signed URL instead
            }
            
            // Note: Supabase storage URLs might not be immediately accessible via HEAD requests
            // The file is uploaded successfully, so we'll proceed without the test
            console.log('File upload successful! Public URL generated.');
            
            // Optional: Check if file becomes accessible after a short delay
            setTimeout(async () => {
              try {
                const response = await fetch(finalAudioUrl, { method: 'HEAD' });
                console.log('Delayed file accessibility check:', response.status, response.statusText);
                if (response.ok) {
                  console.log('✅ Audio file is now accessible!');
                } else {
                  console.log('⚠️ Audio file still not accessible via HEAD request, but this is normal for Supabase storage');
                }
              } catch (error) {
                console.log('⚠️ Delayed accessibility check failed, but this is normal for Supabase storage');
              }
            }, 2000); // Check after 2 seconds
            
          } catch (blobError) {
            console.error('Blob upload error:', blobError);
            toast({
              title: "Audio upload failed",
              description: `Failed to upload audio file to storage: ${blobError.message}`,
              variant: "destructive",
            });
            return;
          }
        } else if (audioUrlToSave.startsWith('http')) {
          // URL is already a public URL, use it directly
          console.log('Using existing public URL:', audioUrlToSave);
          finalAudioUrl = audioUrlToSave;
        } else {
          console.error('Invalid audio URL format:', audioUrlToSave);
          toast({
            title: "Invalid audio URL",
            description: "Audio URL format is not supported",
            variant: "destructive",
          });
          return;
        }
      } else {
        console.log('No audio URL to save');
        toast({
          title: "No audio to save",
          description: "Generate audio first before saving",
          variant: "destructive",
        });
        return;
      }

      console.log('Saving to multi_voice_data table with audio URL:', finalAudioUrl);
      // Save data to multi_voice_data table
      const { error } = await supabase
        .from('multi_voice_data')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          script_text: scriptText,
          character_voices: characterVoices,
          audio_url: finalAudioUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'project_id,user_id'
        });

      if (error) {
        console.error('Multi-voice data save error:', error);
        throw error;
      }

      console.log('Updating user_projects table...');
      // Also update the user_projects table with the audio URL
      if (finalAudioUrl) {
        const { error: projectUpdateError } = await supabase
          .from('user_projects')
          .update({ 
            audio_url: finalAudioUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId);

        if (projectUpdateError) {
          console.error('Error updating project audio URL:', projectUpdateError);
          // Don't throw here, as the multi-voice data was saved successfully
        }
      }

      // Update the audio URL if we uploaded a new file
      if (finalAudioUrl && finalAudioUrl !== audioUrlToSave) {
        setMultiVoiceAudioUrl(finalAudioUrl);
      }

      console.log('Save completed successfully!');
      toast({
        title: "Data saved successfully!",
        description: "Your script and audio have been saved to the cloud",
      });
      onAudioSaved?.(finalAudioUrl);
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Save failed",
        description: "Failed to save data to the cloud",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadMultiVoiceAudio = () => {
    if (!multiVoiceAudioUrl) return;
    MultiVoiceGenerator.downloadAudio(multiVoiceAudioUrl, `multi-voice-script-${Date.now()}.wav`);
  };

  // Check Supabase storage bucket configuration
  const checkStorageBucket = async () => {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Storage bucket error:', error);
        toast({
          title: "Storage access error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Available storage buckets:', data);
      
      // Check if user-files bucket exists
      const userFilesBucket = data.find(bucket => bucket.name === 'user-files');
      if (!userFilesBucket) {
        console.log('user-files bucket not found, attempting to create it...');
        
        // Try to create the bucket
        const { error: createError } = await supabase.storage.createBucket('user-files', {
          public: true,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: ['audio/wav', 'audio/mpeg', 'audio/mp3', 'text/plain', 'application/pdf']
        });
        
        if (createError) {
          console.error('Failed to create bucket:', createError);
          toast({
            title: "Storage bucket creation failed",
            description: "Please create the 'user-files' bucket manually in Supabase dashboard",
            variant: "destructive",
          });
          return;
        } else {
          console.log('user-files bucket created successfully');
          toast({
            title: "Storage bucket created",
            description: "The 'user-files' bucket has been created and configured",
          });
        }
      } else {
        console.log('user-files bucket found:', userFilesBucket);
        
        // Check bucket public/private status
        if (!userFilesBucket.public) {
          console.log('Bucket is private, attempting to make it public...');
          
          // Try to update bucket to public (this might require admin privileges)
          const { error: updateError } = await supabase.storage.updateBucket('user-files', {
            public: true
          });
          
          if (updateError) {
            console.error('Failed to make bucket public:', updateError);
            toast({
              title: "Storage bucket not public",
              description: "The 'user-files' bucket is not public. Please make it public in Supabase dashboard.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Storage bucket updated",
              description: "The 'user-files' bucket is now public",
            });
          }
        } else {
          toast({
            title: "Storage bucket OK",
            description: "The 'user-files' bucket is properly configured",
          });
        }
      }
      
      // Test file upload and access
      const testFileName = `${user?.id}/test-${Date.now()}.txt`;
      const testContent = 'Test file for storage access';
      
      const { error: uploadTestError } = await supabase.storage
        .from('user-files')
        .upload(testFileName, testContent, {
          upsert: true,
          contentType: 'text/plain'
        });
      
      if (uploadTestError) {
        console.error('Test upload failed:', uploadTestError);
        toast({
          title: "Test upload failed",
          description: uploadTestError.message,
          variant: "destructive",
        });
      } else {
        console.log('Test upload successful');
        
        const { data: testUrlData } = supabase.storage
          .from('user-files')
          .getPublicUrl(testFileName);
        
        console.log('Test file public URL:', testUrlData.publicUrl);
        
        // Clean up test file
        await supabase.storage
          .from('user-files')
          .remove([testFileName]);
        
        toast({
          title: "Storage test successful",
          description: "File upload and public URL generation working correctly",
        });
      }
      
    } catch (error) {
      console.error('Storage bucket check error:', error);
    }
  };

  // Test database connectivity and RLS policies
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      
      // Test basic connection
      const { data: testData, error: testError } = await supabase
        .from('multi_voice_data')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('Database connection test failed:', testError);
        toast({
          title: "Database connection failed",
          description: testError.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Database connection successful:', testData);
      
      // Test insert permission
      const { error: insertError } = await supabase
        .from('multi_voice_data')
        .insert({
          project_id: projectId,
          user_id: user?.id,
          script_text: 'Test script',
          character_voices: [],
          audio_url: null,
        });
      
      if (insertError) {
        console.error('Insert test failed:', insertError);
        toast({
          title: "Insert permission failed",
          description: insertError.message,
          variant: "destructive",
        });
      } else {
        console.log('Insert test successful');
        
        // Clean up test data
        await supabase
          .from('multi_voice_data')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user?.id)
          .eq('script_text', 'Test script');
        
        toast({
          title: "Database test successful",
          description: "Connection and permissions are working correctly",
        });
      }
      
    } catch (error) {
      console.error('Database test error:', error);
      toast({
        title: "Database test failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Test audio URL and format
  const testAudioUrlComprehensive = async () => {
    if (!multiVoiceAudioUrl) {
      toast({
        title: "No audio URL",
        description: "Generate audio first to test the URL",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('=== Comprehensive Audio URL Test ===');
      console.log('Audio URL:', multiVoiceAudioUrl);
      
      // Test 1: Basic fetch to check if file exists
      console.log('Test 1: Checking if file exists...');
      const response = await fetch(multiVoiceAudioUrl, { 
        method: 'GET',
        headers: {
          'Range': 'bytes=0-1023', // Only fetch first 1KB to check headers
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        mode: 'cors' // Explicitly request CORS
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Test 2: Check content type
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (contentType && !contentType.includes('audio/')) {
        console.warn('⚠️ Content-Type is not audio:', contentType);
      }
      
      // Test 3: Check file size
      const contentLength = response.headers.get('content-length');
      console.log('Content-Length:', contentLength, 'bytes');
      
      if (contentLength) {
        const sizeInMB = parseInt(contentLength) / (1024 * 1024);
        console.log('File size:', sizeInMB.toFixed(2), 'MB');
        
        if (sizeInMB < 0.1) {
          console.warn('⚠️ File seems too small for audio:', sizeInMB, 'MB');
        }
      }
      
      // Test 4: Check if it's a valid WAV file
      console.log('Test 4: Checking WAV file format...');
      const audioData = await response.arrayBuffer();
      const dataView = new DataView(audioData);
      
      // Check WAV header
      const riff = String.fromCharCode(...new Uint8Array(audioData.slice(0, 4)));
      const wave = String.fromCharCode(...new Uint8Array(audioData.slice(8, 12)));
      
      console.log('RIFF header:', riff);
      console.log('WAVE header:', wave);
      
      if (riff !== 'RIFF' || wave !== 'WAVE') {
        console.error('❌ Invalid WAV file format');
        toast({
          title: "Invalid audio format",
          description: "The file is not a valid WAV file",
          variant: "destructive",
        });
        return;
      }
      
      // Check audio format details
      const audioFormat = dataView.getUint16(20, true);
      const numChannels = dataView.getUint16(22, true);
      const sampleRate = dataView.getUint32(24, true);
      const bitsPerSample = dataView.getUint16(34, true);
      
      console.log('Audio format details:', {
        format: audioFormat === 1 ? 'PCM' : `Unknown (${audioFormat})`,
        channels: numChannels,
        sampleRate: sampleRate,
        bitsPerSample: bitsPerSample
      });
      
      if (audioFormat !== 1) {
        console.warn('⚠️ Audio format is not PCM (format 1)');
      }
      
      // Test 5: Try to create an audio element with CORS settings
      console.log('Test 5: Testing browser audio compatibility...');
      const testAudio = new Audio();
      
      // Set CORS attributes
      testAudio.crossOrigin = 'anonymous';
      
      testAudio.addEventListener('canplaythrough', () => {
        console.log('✅ Audio element can play the file');
        console.log('Duration:', testAudio.duration, 'seconds');
        toast({
          title: "Audio test successful",
          description: `File is valid and playable (${testAudio.duration.toFixed(1)}s)`,
        });
      });
      
      testAudio.addEventListener('error', (e) => {
        console.error('❌ Audio element error:', testAudio.error);
        console.error('Error details:', {
          code: testAudio.error?.code,
          message: testAudio.error?.message,
          networkState: testAudio.networkState,
          readyState: testAudio.readyState
        });
        toast({
          title: "Audio playback test failed",
          description: `Browser cannot play this audio: ${testAudio.error?.message || 'Unknown error'}`,
          variant: "destructive",
        });
      });
      
      testAudio.src = multiVoiceAudioUrl;
      
    } catch (error) {
      console.error('❌ Audio URL test failed:', error);
      toast({
        title: "Audio URL test failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Test audio access with authentication
  const testAudioWithAuth = async () => {
    if (!multiVoiceAudioUrl || !user) {
      toast({
        title: "Cannot test",
        description: "Audio URL or user not available",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('=== Testing Audio Access with Authentication ===');
      
      // Method 1: Try with Supabase auth headers
      console.log('Method 1: Testing with Supabase auth...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        const response = await fetch(multiVoiceAudioUrl, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Cache-Control': 'no-cache'
          }
        });
        
        console.log('Auth response status:', response.status);
        if (response.ok) {
          console.log('✅ Audio accessible with authentication');
          toast({
            title: "Audio accessible with auth",
            description: "File can be accessed with authentication headers",
          });
        } else {
          console.log('❌ Audio not accessible with auth');
        }
      }
      
      // Method 2: Try to get signed URL
      console.log('Method 2: Testing with signed URL...');
      const urlParts = multiVoiceAudioUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${user.id}/${projectId}/${fileName}`;
      
      console.log('File path:', filePath);
      
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('user-files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry
      
      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError);
      } else {
        console.log('Signed URL generated:', signedUrlData.signedUrl);
        
        // Test the signed URL
        const signedResponse = await fetch(signedUrlData.signedUrl);
        console.log('Signed URL response:', signedResponse.status);
        
        if (signedResponse.ok) {
          console.log('✅ Audio accessible via signed URL');
          toast({
            title: "Signed URL works",
            description: "Audio accessible via signed URL",
          });
          
          // Update the audio URL to use signed URL
          setMultiVoiceAudioUrl(signedUrlData.signedUrl);
        }
      }
      
    } catch (error) {
      console.error('Auth test error:', error);
      toast({
        title: "Auth test failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="my-4 lg:my-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg lg:text-xl">
            <Mic className="h-5 w-5" />
            Multi-Character Voice Generation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 lg:space-y-6">
          {/* API Key Input */}
          <div className="mb-4">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your ElevenLabs API key here"
              className="w-full max-w-md text-sm"
            />
          </div>

          {/* Script Input (if allowed) */}
          {allowScriptEdit && (
            <div className="mb-4 lg:mb-6">
              <label className="text-sm font-medium mb-2 block">
                Script Input
              </label>
              <Textarea
                value={scriptText}
                onChange={(e) => {
                  setScriptText(e.target.value);
                  onScriptChange?.(e.target.value);
                }}
                placeholder="Paste your script with character names in ALL CAPS and dialogue below..."
                className="min-h-[150px] lg:min-h-[200px] text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {scriptText.length} characters
              </p>
            </div>
          )}

          {/* Save Button */}
          {projectId && (
            <div className="mb-4">
              <Button
                onClick={() => {
                  if (multiVoiceAudioUrl) {
                    saveToSupabaseWithAudio(multiVoiceAudioUrl);
                  } else {
                    saveToSupabase();
                  }
                }}
                disabled={saving || loading}
                variant="default"
                className="gap-2 w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving to Cloud...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {multiVoiceAudioUrl ? "Save Audio & Script to Cloud" : "Save Script to Cloud"}
                  </>
                )}
              </Button>
              
              {/* Debug Buttons */}
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <Button
                  onClick={checkStorageBucket}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Check Storage
                </Button>
                <Button
                  onClick={testDatabaseConnection}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Test Database
                </Button>
                {multiVoiceAudioUrl && (
                  <>
                    <Button
                      onClick={() => {
                        console.log('Current audio URL:', multiVoiceAudioUrl);
                        toast({
                          title: "Audio URL logged",
                          description: "Check console for audio URL details",
                        });
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Log Audio URL
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const response = await fetch(multiVoiceAudioUrl, { method: 'HEAD' });
                          console.log('Audio URL test:', response.status, response.statusText);
                          toast({
                            title: "Audio URL test",
                            description: `Status: ${response.status} ${response.statusText}`,
                          });
                        } catch (error) {
                          console.error('Audio URL test failed:', error);
                          toast({
                            title: "Audio URL test failed",
                            description: error.message,
                            variant: "destructive",
                          });
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Test Audio URL
                    </Button>
                    <Button
                      onClick={testAudioUrlComprehensive}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Comprehensive Test
                    </Button>
                    <Button
                      onClick={testAudioWithAuth}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Test Auth Access
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Character Voice Assignment */}
          {parsedScript.characters.length > 0 && (
            <CharacterVoiceAssignment
              characters={parsedScript.characters}
              characterVoices={characterVoices}
              onVoiceChange={handleVoiceChange}
              onAssignAll={handleAssignAllVoices}
            />
          )}

          {/* Script Preview */}
          {parsedScript.scenes.length > 0 && (
            <div className="mt-8">
              <ScriptPreview
                parsedScript={parsedScript}
                onGenerateAudio={generateMultiVoiceAudio}
                generating={multiVoiceGenerating}
              />
            </div>
          )}

          {/* Generation Progress */}
          {multiVoiceGenerating && generationProgress && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Generating audio for {generationProgress.character}...
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {generationProgress.current} / {generationProgress.total}
                    </span>
                  </div>
                  <Progress 
                    value={(generationProgress.current / generationProgress.total) * 100} 
                    className="w-full" 
                  />
                  <p className="text-sm text-muted-foreground">
                    "{generationProgress.text}"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multi-Voice Audio Player */}
          {showMultiVoicePlayer && multiVoiceAudioUrl && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Multi-Voice Audio Player
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <audio 
                    ref={audioRef} 
                    src={multiVoiceAudioUrl} 
                    preload="metadata"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      console.error('Main audio player error:', e);
                      const audioElement = e.target as HTMLAudioElement;
                      console.error('Audio error details:', {
                        error: audioElement.error,
                        networkState: audioElement.networkState,
                        readyState: audioElement.readyState,
                        src: audioElement.src
                      });
                    }}
                    onLoadStart={() => console.log('Main audio loading started:', multiVoiceAudioUrl)}
                    onCanPlay={() => console.log('Main audio can play')}
                    onLoadedMetadata={() => console.log('Main audio metadata loaded')}
                  />
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlay}
                      className="h-12 w-12 rounded-full"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      onValueChange={handleSeek}
                      max={duration || 100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="flex-1 max-w-32"
                    />
                    <span className="text-sm text-muted-foreground w-10">
                      {volume}%
                    </span>
                  </div>
                  <Button
                    onClick={downloadMultiVoiceAudio}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Multi-Voice Audio
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 