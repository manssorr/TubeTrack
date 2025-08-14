import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, Save, X, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Video } from '@shared/schema';
import { formatDuration } from '@/lib/storage';

interface Note {
  id: string;
  timestamp: number;
  content: string;
  createdAt: string;
}

interface MarkdownNotesPanelProps {
  video: Video | null;
  onNotesChange: (notes: string) => void;
  onInsertTimestamp: (timestamp: string) => void;
  onJumpToTimestamp: (seconds: number) => void;
  getCurrentTime: () => number;
  isFullWidth?: boolean;
  onRegisterInsertHandler?: (fn: (prefix: string) => void) => void;
}

export function MarkdownNotesPanel({ 
  video, 
  onNotesChange, 
  onInsertTimestamp,
  onJumpToTimestamp,
  getCurrentTime,
  isFullWidth = false,
  onRegisterInsertHandler,
}: MarkdownNotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Parse notes from video data on load
  useEffect(() => {
    if (video?.notes) {
      try {
        const parsedNotes = JSON.parse(video.notes);
        if (Array.isArray(parsedNotes)) {
          setNotes(parsedNotes);
          return;
        }
      } catch {
        // Convert old format to new format
        const timestampRegex = /\[(\d+:\d+(?::\d+)?)\]\s*([^\n\[]*)/g;
        const convertedNotes: Note[] = [];
        let match;
        
        while ((match = timestampRegex.exec(video.notes)) !== null) {
          const [, timestamp, content] = match;
          const seconds = parseTimeToSeconds(timestamp);
          convertedNotes.push({
            id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: seconds,
            content: content.trim(),
            createdAt: new Date().toISOString()
          });
        }
        
        setNotes(convertedNotes);
        if (convertedNotes.length > 0) {
          onNotesChange(JSON.stringify(convertedNotes));
        }
      }
    } else {
      setNotes([]);
    }
  }, [video?.notes, onNotesChange]);

  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  const handleAddNote = () => {
    if (!newNoteContent.trim()) return;

    const currentTime = getCurrentTime();
    const newNote: Note = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: currentTime,
      content: newNoteContent.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedNotes = [...notes, newNote].sort((a, b) => a.timestamp - b.timestamp);
    setNotes(updatedNotes);
    setNewNoteContent('');
    onNotesChange(JSON.stringify(updatedNotes));
  };

  const handleEditStart = (note: Note) => {
    setEditingId(note.id);
    setEditingContent(note.content);
  };

  const handleEditSave = () => {
    if (!editingId || !editingContent.trim()) return;

    const updatedNotes = notes.map(note =>
      note.id === editingId
        ? { ...note, content: editingContent.trim() }
        : note
    );

    setNotes(updatedNotes);
    setEditingId(null);
    setEditingContent('');
    onNotesChange(JSON.stringify(updatedNotes));
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const handleDelete = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    onNotesChange(JSON.stringify(updatedNotes));
  };

  const handleTimestampClick = (seconds: number) => {
    onJumpToTimestamp(seconds);
    const iframe = document.querySelector('iframe[src*="youtube.com"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(
          `{"event":"command","func":"seekTo","args":[${seconds}, true]}`,
          '*'
        );
      } catch (error) {
        console.log('Could not control YouTube player directly:', error);
      }
    }
  };

  if (!video) {
    return (
      <Card className={isFullWidth ? 'w-full' : ''}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Notes
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Select a video to start taking notes
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    if (!onRegisterInsertHandler) return;
    const handler = (prefix: string) => {
      setNewNoteContent((prev) => `${prefix}${prev}`);
    };
    onRegisterInsertHandler(handler);
    return () => onRegisterInsertHandler(() => {});
  }, [onRegisterInsertHandler]);

  const NotesContent = () => (
    <div className="flex flex-col space-y-4 h-full">
      {/* Add new note - enhanced for full width */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Add note at {formatDuration(getCurrentTime())}
          </span>
          <Button
            onClick={() => onInsertTimestamp(`[${formatDuration(getCurrentTime())}] `)}
            size="sm"
            variant="outline"
          >
            <Clock className="w-4 h-4 mr-1" />
            {formatDuration(getCurrentTime())}
          </Button>
        </div>
        
        <Textarea
          placeholder="Type your note here... (supports markdown formatting)"
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleAddNote();
            }
          }}
          className={isFullWidth || isExpanded ? 'min-h-24' : 'min-h-16'}
        />
        
        <Button 
          onClick={handleAddNote} 
          disabled={!newNoteContent.trim()} 
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note ({formatDuration(getCurrentTime())})
        </Button>
      </div>

      {/* Notes list */}
      <ScrollArea className="flex-1">
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notes yet</p>
              <p className="text-sm">Add your first timestamped note above</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="p-4 border rounded-lg bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600 shadow-sm"
              >
                {/* Timestamp header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => handleTimestampClick(note.timestamp)}
                    className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full transition-colors"
                  >
                    {formatDuration(note.timestamp)}
                  </button>
                  <div className="flex items-center space-x-1">
                    {editingId !== note.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStart(note)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(note.id)}
                          className="h-7 w-7 p-0 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    {editingId === note.id && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditSave}
                          className="h-7 w-7 p-0 text-green-600 dark:text-green-400"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditCancel}
                          className="h-7 w-7 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Note content */}
                {editingId === note.id ? (
                  <Textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleEditSave();
                      } else if (e.key === 'Escape') {
                        handleEditCancel();
                      }
                    }}
                    autoFocus
                    className="text-sm min-h-20"
                    placeholder="Edit your note... (supports markdown)"
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {/* Simple markdown rendering using a lazy import to avoid bundle bloat */}
                    {/* @ts-expect-error dynamic import typing */}
                    {React.createElement(require('react-markdown').default, {}, note.content)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Keyboard shortcuts */}
      <div className="text-xs text-gray-500 dark:text-gray-400 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="grid grid-cols-2 gap-2">
          <p><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-xs">Ctrl+Enter</kbd> Add note</p>
          <p><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-xs">Ctrl+T</kbd> Insert timestamp</p>
          <p><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-xs">Escape</kbd> Cancel edit</p>
          <p>Click timestamps to jump</p>
        </div>
      </div>
    </div>
  );

  return (
    <Card className={`${isFullWidth ? 'w-full' : ''} ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Notes ({notes.length})
          <div className="flex items-center space-x-2">
            {!isFullWidth && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>Notes - Full Screen</DialogTitle>
                  </DialogHeader>
                  <div className="h-full">
                    <NotesContent />
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={`${isExpanded ? 'h-[calc(100vh-12rem)]' : 'h-96'} flex flex-col`}>
        <NotesContent />
      </CardContent>
    </Card>
  );
}