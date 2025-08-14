import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Video } from '@shared/schema';
import { formatDuration } from '@/lib/storage';

interface Note {
  id: string;
  timestamp: number;
  content: string;
  createdAt: string;
}

interface NotePanelWithItemsProps {
  video: Video | null;
  onNotesChange: (notes: string) => void;
  onInsertTimestamp: (timestamp: string) => void;
  onJumpToTimestamp: (seconds: number) => void;
  getCurrentTime: () => number;
}

export function NotePanelWithItems({ 
  video, 
  onNotesChange, 
  onInsertTimestamp,
  onJumpToTimestamp,
  getCurrentTime 
}: NotePanelWithItemsProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  // Parse notes from video data on load
  useEffect(() => {
    if (video?.notes) {
      try {
        // Try to parse as JSON first (new format)
        const parsedNotes = JSON.parse(video.notes);
        if (Array.isArray(parsedNotes)) {
          setNotes(parsedNotes);
          return;
        }
      } catch {
        // If parsing fails, convert old format to new format
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
        // Save converted format back to video
        if (convertedNotes.length > 0) {
          onNotesChange(JSON.stringify(convertedNotes));
        }
      }
    } else {
      setNotes([]);
    }
  }, [video?.notes, onNotesChange]);

  // Convert time string to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  };

  // Add new note with current timestamp
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

  // Start editing a note
  const handleEditStart = (note: Note) => {
    setEditingId(note.id);
    setEditingContent(note.content);
  };

  // Save edited note
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

  // Cancel editing
  const handleEditCancel = () => {
    setEditingId(null);
    setEditingContent('');
  };

  // Delete note
  const handleDelete = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    onNotesChange(JSON.stringify(updatedNotes));
  };

  // Jump to timestamp
  const handleTimestampClick = (seconds: number) => {
    onJumpToTimestamp(seconds);
    // Also try to directly control the YouTube player if available
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Select a video to start taking notes
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Notes ({notes.length})
          <Button
            onClick={() => onInsertTimestamp(`[${formatDuration(getCurrentTime())}] `)}
            size="sm"
            variant="outline"
          >
            <Clock className="w-4 h-4 mr-1" />
            {formatDuration(getCurrentTime())}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Add new note */}
        <div className="space-y-2">
          <Input
            placeholder="Add a new note..."
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddNote();
              }
            }}
          />
          <Button onClick={handleAddNote} disabled={!newNoteContent.trim()} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add Note at {formatDuration(getCurrentTime())}
          </Button>
        </div>

        {/* Notes list */}
        <ScrollArea className="flex-1">
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No notes yet</p>
                <p className="text-sm">Add your first note above</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600"
                >
                  {/* Timestamp header */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => handleTimestampClick(note.timestamp)}
                      className="text-sm font-mono text-blue-600 dark:text-blue-400 hover:underline bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded"
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
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(note.id)}
                            className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
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
                            className="text-green-600 dark:text-green-400"
                          >
                            <Save className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEditCancel}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Note content */}
                  {editingId === note.id ? (
                    <Input
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleEditSave();
                        } else if (e.key === 'Escape') {
                          handleEditCancel();
                        }
                      }}
                      autoFocus
                      className="text-sm"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {note.content}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-800 rounded">
          <p><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-xs">Enter</kbd> to add/save note</p>
          <p><kbd className="bg-gray-200 dark:bg-gray-600 px-1 rounded text-xs">Ctrl+T</kbd> to insert timestamp</p>
          <p>Click timestamps to jump to that time</p>
        </div>
      </CardContent>
    </Card>
  );
}