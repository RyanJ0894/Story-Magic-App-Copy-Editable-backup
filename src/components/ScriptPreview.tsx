import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, User, Play, Copy, Check } from "lucide-react";
import { ParsedScript, ScriptParser } from "@/lib/scriptParser";
import { useToast } from "@/hooks/use-toast";

interface ScriptPreviewProps {
  parsedScript: ParsedScript;
  onGenerateAudio: () => void;
  generating: boolean;
}

export default function ScriptPreview({
  parsedScript,
  onGenerateAudio,
  generating,
}: ScriptPreviewProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const copyFilteredText = async () => {
    const filteredText = ScriptParser.getFilteredTextForAudio(parsedScript);
    try {
      await navigator.clipboard.writeText(filteredText);
      setCopied(true);
      toast({
        title: "Text copied!",
        description: "Filtered script text has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  if (!parsedScript.scenes.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Script Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No script parsed yet</p>
            <p className="text-sm">Upload or paste a script to see the preview</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Script Preview
          <Badge variant="secondary" className="ml-2">
            {parsedScript.scenes.length} scenes, {parsedScript.totalLines} lines
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Parsed script with {parsedScript.characters.length} characters
          </p>
          <div className="flex gap-2">
            <Button
              onClick={copyFilteredText}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Filtered Text
                </>
              )}
            </Button>
            <Button
              onClick={onGenerateAudio}
              disabled={generating}
              size="sm"
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              {generating ? "Generating..." : "Generate Multi-Voice Audio"}
            </Button>
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-6 pr-4">
            {parsedScript.scenes.map((scene, sceneIndex) => (
              <div key={sceneIndex} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline">Scene {scene.index + 1}</Badge>
                  <h3 className="font-medium">{scene.title}</h3>
                </div>

                {scene.lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No dialogue in this scene
                  </p>
                ) : (
                  <div className="space-y-3">
                    {scene.lines.map((line, lineIndex) => (
                      <div
                        key={lineIndex}
                        className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {line.speaker}
                            </span>
                            <Badge variant={line.type === 'narrator' ? 'default' : 'secondary'} className="text-xs">
                              {line.type === 'narrator' ? 'Narrator' : 'Character'}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Line {line.lineIndex + 1}
                            </Badge>
                          </div>
                          <p className="text-sm leading-relaxed">
                            "{line.text}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Characters Found:</h4>
          <div className="flex flex-wrap gap-2">
            {parsedScript.characters.map((character) => (
              <Badge key={character} variant="outline">
                {character}
              </Badge>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Filtered Text Preview:</h4>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-sm leading-relaxed">
              {ScriptParser.getFilteredTextForAudio(parsedScript).substring(0, 200)}
              {ScriptParser.getFilteredTextForAudio(parsedScript).length > 200 && "..."}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {ScriptParser.getFilteredTextForAudio(parsedScript).length} characters total
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 