import { Edit, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ScriptHeaderProps {
  isSelectionMode: boolean;
  selectedItemsCount: number;
  onToggleSelectionMode: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onEditSelected: () => void;
}

export const ScriptHeader = ({
  isSelectionMode,
  selectedItemsCount,
  onToggleSelectionMode,
  onSelectAll,
  onClearSelection,
  onEditSelected
}: ScriptHeaderProps) => {
  return (
    <div className="border-b p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelectionMode}
          >
            {isSelectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            {isSelectionMode ? "Exit Selection" : "Select Items"}
          </Button>
          
          {isSelectionMode && (
            <>
              <Button variant="outline" size="sm" onClick={onSelectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={onClearSelection}>
                Clear
              </Button>
              <Badge variant="secondary">
                {selectedItemsCount} selected
              </Badge>
            </>
          )}
        </div>

        {isSelectionMode && selectedItemsCount > 0 && (
          <Button 
            size="sm"
            onClick={onEditSelected}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Selected ({selectedItemsCount})
          </Button>
        )}
      </div>
    </div>
  );
};
