interface DirectorAnalysisProps {
  directorJson?: any;
  waitingForDirector?: boolean;
  directorError?: string;
  onGenerateAudio?: () => void;
  isGeneratingAudio?: boolean;
  showGenerateButton?: boolean;
}

export default function DirectorAnalysis({
  directorJson,
  waitingForDirector,
  directorError,
  onGenerateAudio,
  isGeneratingAudio = false,
  showGenerateButton = true
}: DirectorAnalysisProps) {
  if (!directorJson && !waitingForDirector && !directorError) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-2">Director JSON (preview)</h2>
      
      {waitingForDirector && (
        <div className="text-sm opacity-80 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            AI Director is analyzing your script...
          </div>
        </div>
      )}

      {directorError && (
        <div className="text-red-400 text-sm mb-4">
          Error: {directorError}
        </div>
      )}

      {directorJson && (
        <>
          <pre className="text-xs bg-black/30 rounded-md p-3 overflow-auto max-h-80">
            {JSON.stringify(directorJson, null, 2)}
          </pre>

          {showGenerateButton && onGenerateAudio && (
            <button
              onClick={onGenerateAudio}
              disabled={isGeneratingAudio}
              className="mt-4 rounded-md px-4 py-2 bg-yellow-400 text-black disabled:opacity-60 flex items-center gap-2"
            >
              {isGeneratingAudio ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Generating Audio...
                </>
              ) : (
                "Generate Audio"
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
