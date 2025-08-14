import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from '@shared/schema';
import { formatDuration } from '@/lib/storage';

interface NotesPanelProps {
  video: Video | null;
  onNotesChange: (notes: string) => void;
  onInsertTimestamp: (timestamp: string) => void;
  onJumpToTimestamp: (seconds: number) => void;
  getCurrentTime: () => number;
}

export function NotesPanel({ 
  video, 
  onNotesChange, 
  onInsertTimestamp,
  onJumpToTimestamp,
  getCurrentTime 
}: NotesPanelProps) {
  const [notes, setNotes] = useState(video?.notes || '');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [characterCount, setCharacterCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update notes when video changes
  useEffect(() => {
    setNotes(video?.notes || '');
    setCharacterCount(video?.notes?.length || 0);
  }, [video]);

  // Handle notes change with auto-save
  const handleNotesChange = (value: string) => {
    setNotes(value);
    setCharacterCount(value.length);
    setSaveStatus('saving');

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Auto-save after 1 second of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      onNotesChange(value);
      setSaveStatus('saved');
    }, 1000);
  };

  // Insert timestamp at cursor position
  const handleInsertTimestamp = () => {
    const currentTime = getCurrentTime();
    const timestamp = `[${formatDuration(currentTime)}] `;
    onInsertTimestamp(timestamp);

    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = notes.substring(0, start) + timestamp + notes.substring(end);
      
      setNotes(newValue);
      setSaveStatus('saving');
      
      // Set cursor position after timestamp
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + timestamp.length, start + timestamp.length);
      }, 0);

      // Auto-save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onNotesChange(newValue);
        setSaveStatus('saved');
      }, 1000);
    }
  };

  // Handle clicking on timestamps in notes
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const clickPosition = textarea.selectionStart;
    const textBeforeCursor = notes.substring(0, clickPosition);
    const textAfterCursor = notes.substring(clickPosition);
    
    // Look for timestamp pattern [MM:SS] or [HH:MM:SS]
    const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
    let match;
    
    // Find timestamp that cursor is within
    while ((match = timestampRegex.exec(notes)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      
      if (clickPosition >= start && clickPosition <= end) {
        const timeString = match[1];
        const seconds = parseTimeString(timeString);
        if (seconds >= 0) {
          onJumpToTimestamp(seconds);
        }
        break;
      }
    }
  };

  // Parse time string to seconds
  const parseTimeString = (timeString: string): number => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return -1;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (!video) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            Select a video to take notes
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notes</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleInsertTimestamp}>
            <Clock className="w-4 h-4 mr-1" />
            Timestamp
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          ref={textareaRef}
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          onClick={handleTextareaClick}
          className="min-h-64 resize-none text-sm"
          placeholder="Take notes here... Use Ctrl+T to insert timestamps or click the Timestamp button"
        />
        
        {/* Auto-save indicator */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center">
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3 h-3 text-green-500 mr-1" />
                Auto-saved
              </>
            )}
            {saveStatus === 'saving' && (
              <>
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin mr-1" />
                Saving...
              </>
            )}
          </span>
          <span>{characterCount} characters</span>
        </div>
      </CardContent>
    </Card>
  );
}
