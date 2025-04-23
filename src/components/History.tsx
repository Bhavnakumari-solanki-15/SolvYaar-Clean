import { useState, useEffect } from 'react';
import { HistoryItem, GroupedHistory, InputType, ToolType, INPUT_TYPE_ICONS, TOOL_TYPE_ICONS } from '@/types/history';
import { historyService } from '@/services/historyService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash2, RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function History() {
  const [history, setHistory] = useState<GroupedHistory>({
    today: [],
    yesterday: [],
    lastWeek: [],
    older: []
  });
  const [inputTypeFilter, setInputTypeFilter] = useState<InputType | undefined>();
  const [toolTypeFilter, setToolTypeFilter] = useState<ToolType | undefined>();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [inputTypeFilter, toolTypeFilter]);

  async function loadHistory() {
    try {
      setIsLoading(true);
      setError(null);
      const groupedHistory = await historyService.filterHistory(inputTypeFilter, toolTypeFilter);
      setHistory(groupedHistory);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load history';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await historyService.deleteHistoryItem(id);
      toast.success('History item deleted');
      loadHistory();
    } catch (error) {
      toast.error('Failed to delete history item');
    }
  }

  async function handleClearAll() {
    try {
      await historyService.clearHistory();
      toast.success('History cleared');
      loadHistory();
    } catch (error) {
      toast.error('Failed to clear history');
    }
  }

  function handleRerun(item: HistoryItem) {
    // TODO: Implement rerun functionality
    toast.info('Rerunning query...');
  }

  function toggleExpand(id: string) {
    const newExpanded = new Set(expandedItems);
    if (expandedItems.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  }

  function renderHistoryItem(item: HistoryItem) {
    const isExpanded = expandedItems.has(item.id);
    
    return (
      <Collapsible key={item.id} open={isExpanded}>
        <Card className="mb-4">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{INPUT_TYPE_ICONS[item.inputType]}</span>
              <span className="text-xl">{TOOL_TYPE_ICONS[item.toolType]}</span>
              <div className="flex flex-col">
                <span className="font-medium">{format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}</span>
                <span className="text-sm text-muted-foreground">{item.query.substring(0, 50)}...</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleRerun(item)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => toggleExpand(item.id)}>
                  <ChevronDown className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="p-4 pt-0">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Query:</h4>
                  <p className="text-sm text-muted-foreground">{item.query}</p>
                </div>
                {item.solution && (
                  <div>
                    <h4 className="font-medium">Solution:</h4>
                    <p className="text-sm text-muted-foreground">{item.solution}</p>
                  </div>
                )}
                {(item.imageUrl || item.audioUrl || item.fileUrl) && (
                  <div>
                    <h4 className="font-medium">Attachments:</h4>
                    {item.imageUrl && <img src={item.imageUrl} alt="Problem" className="mt-2 max-w-md rounded" />}
                    {item.audioUrl && <audio src={item.audioUrl} controls className="mt-2" />}
                    {item.fileUrl && (
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        View File
                      </a>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  function renderHistoryGroup(title: string, items: HistoryItem[]) {
    if (!items || items.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="mb-4 text-lg font-semibold">{title}</h3>
        <div className="space-y-4">
          {items.map(renderHistoryItem)}
        </div>
      </div>
    );
  }

  const hasHistoryItems = Object.values(history).some(group => group.length > 0);

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-3xl font-bold">History</h2>
        <div className="flex items-center gap-4">
          <Select
            value={inputTypeFilter}
            onValueChange={(value) => setInputTypeFilter(value as InputType)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by input type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={undefined}>All input types</SelectItem>
              {Object.entries(INPUT_TYPE_ICONS).map(([type, icon]) => (
                <SelectItem key={type} value={type}>
                  <span className="flex items-center gap-2">
                    {icon} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={toolTypeFilter}
            onValueChange={(value) => setToolTypeFilter(value as ToolType)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by tool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={undefined}>All tools</SelectItem>
              {Object.entries(TOOL_TYPE_ICONS).map(([type, icon]) => (
                <SelectItem key={type} value={type}>
                  <span className="flex items-center gap-2">
                    {icon} {type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            variant="destructive" 
            onClick={handleClearAll}
            disabled={!hasHistoryItems}
          >
            Clear All
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {renderHistoryGroup('Today', history.today)}
          {renderHistoryGroup('Yesterday', history.yesterday)}
          {renderHistoryGroup('Last 7 Days', history.lastWeek)}
          {renderHistoryGroup('Older', history.older)}
          
          {!error && !hasHistoryItems && (
            <div className="text-center py-8 text-muted-foreground">
              No history items found
            </div>
          )}
        </>
      )}
    </div>
  );
} 