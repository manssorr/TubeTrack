import { useState, useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import {
    FileText,
    Plus,
    Clock,
    Save,
    AlertCircle,
    Trash2,
    SidebarClose,
    MoveDown
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

import { useNotes } from "@/hooks/useLocalStorage";
import { TNote } from "@/types";

interface VideoNotesPanelProps {
    videoId: string;
    currentTime?: number;
    onTimestampClick?: (seconds: number) => void;
    position?: 'side' | 'bottom';
    onPositionChange?: (position: 'side' | 'bottom') => void;
    className?: string;
}

interface NoteEditorProps {
    note: TNote;
    currentTime: number;
    onUpdate: (note: TNote) => void;
    onDelete: (noteId: string) => void;
    onTimestampClick: (seconds: number) => void;
    onAddTimestamp: (noteId: string) => void;
}

// Individual Note Editor Component
function NoteEditor({
    note,
    currentTime,
    onUpdate,
    onDelete,
    onTimestampClick,
    onAddTimestamp
}: NoteEditorProps) {
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [isDirty, setIsDirty] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing your note...'
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline cursor-pointer',
                },
            })
        ],
        content: note.content,
        onUpdate: ({ editor }) => {
            const content = editor.getHTML();
            if (content !== note.content) {
                setIsDirty(true);
                // Debounced save
                setTimeout(() => {
                    handleSave(content);
                }, 1000);
            }
        },
    });

    const handleSave = useCallback(async (content?: string) => {
        setSaveStatus('saving');
        try {
            const updatedNote: TNote = {
                ...note,
                content: content || editor?.getHTML() || '',
                updatedAt: new Date().toISOString(),
            };

            onUpdate(updatedNote);
            setIsDirty(false);
            setSaveStatus('saved');

            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error('Failed to save note:', error);
            setSaveStatus('error');
        }
    }, [note, editor, onUpdate]);

    const formatTimestamp = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleTimestampClick = (seconds: number) => {
        onTimestampClick(seconds);
    };

    const extractTags = (content: string): string[] => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const text = tempDiv.textContent || '';
        const tagRegex = /#([a-zA-Z0-9_-]+)/g;
        const tags: string[] = [];
        let match;
        while ((match = tagRegex.exec(text)) !== null) {
            const tag = match[1];
            if (tag && !tags.includes(tag)) {
                tags.push(tag);
            }
        }
        return tags;
    };

    const tags = extractTags(note.content);

    // Calculate time since creation
    const timeSince = (date: string) => {
        const now = new Date();
        const created = new Date(date);
        const diffMs = now.getTime() - created.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
    };

    return (
        <Card className="mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">
                            {timeSince(note.createdAt)}
                        </div>
                        {/* Note timestamp - clickable */}
                        {note.timestamps.length > 0 && note.timestamps[0] && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs font-mono"
                                onClick={() => handleTimestampClick(note.timestamps[0]!.seconds)}
                                title="Click to seek to this moment in the video"
                            >
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimestamp(note.timestamps[0]!.seconds)}
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Save Status Indicator */}
                        {saveStatus !== 'idle' && (
                            <div className="flex items-center gap-1">
                                {saveStatus === 'saving' && (
                                    <div className="animate-spin w-3 h-3 border border-primary border-t-transparent rounded-full" />
                                )}
                                {saveStatus === 'saved' && <Save className="w-3 h-3 text-green-500" />}
                                {saveStatus === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
                            </div>
                        )}

                        {/* Add Timestamp Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onAddTimestamp(note.id)}
                            title={`Add timestamp ${formatTimestamp(currentTime)}`}
                        >
                            <Clock className="w-4 h-4" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onDelete(note.id)}
                            title="Delete note"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Tags Display */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardHeader>

            <CardContent className="pt-0">
                {/* TipTap Editor */}
                <div className="prose prose-sm max-w-none focus-within:outline-none">
                    <EditorContent
                        editor={editor}
                        className="min-h-[80px] p-3 rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[60px] [&_.ProseMirror]:prose [&_.ProseMirror]:prose-sm [&_.ProseMirror]:max-w-none"
                    />
                </div>

                {isDirty && (
                    <div className="text-xs text-muted-foreground mt-2">
                        Unsaved changes... (auto-saving)
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function VideoNotesPanel({
    videoId,
    currentTime = 0,
    onTimestampClick,
    position = 'side',
    onPositionChange,
    className = "",
}: VideoNotesPanelProps) {
    const { addOrUpdateNote, removeNote, getNotesByVideo } = useNotes();
    const [videoNotes, setVideoNotes] = useState<TNote[]>([]);

    // Load notes for current video
    useEffect(() => {
        const notes = getNotesByVideo(videoId);
        setVideoNotes(notes);
    }, [videoId, getNotesByVideo]);

    // Create new note
    const createNewNote = useCallback(() => {
        const newNote: TNote = {
            id: uuidv4(),
            videoId,
            content: '',
            timestamps: [{
                seconds: currentTime,
                label: `Note created at ${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`
            }],
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        addOrUpdateNote(newNote);
        setVideoNotes(prev => [newNote, ...prev]);
    }, [videoId, currentTime, addOrUpdateNote]);

    // Update note
    const handleUpdateNote = useCallback((updatedNote: TNote) => {
        // Extract tags from content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = updatedNote.content;
        const text = tempDiv.textContent || '';
        const tagRegex = /#([a-zA-Z0-9_-]+)/g;
        const tags: string[] = [];
        let match;
        while ((match = tagRegex.exec(text)) !== null) {
            const tag = match[1];
            if (tag && !tags.includes(tag)) {
                tags.push(tag);
            }
        }

        const noteWithTags = { ...updatedNote, tags };
        addOrUpdateNote(noteWithTags);
        setVideoNotes(prev => prev.map(note =>
            note.id === noteWithTags.id ? noteWithTags : note
        ));
    }, [addOrUpdateNote]);

    // Delete note
    const handleDeleteNote = useCallback((noteId: string) => {
        removeNote(noteId);
        setVideoNotes(prev => prev.filter(note => note.id !== noteId));
    }, [removeNote]);

    // Add timestamp to existing note
    const handleAddTimestamp = useCallback((noteId: string) => {
        const note = videoNotes.find(n => n.id === noteId);
        if (!note) return;

        const newTimestamp = {
            seconds: currentTime,
            label: `Added at ${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, '0')}`
        };

        const updatedNote: TNote = {
            ...note,
            timestamps: [...note.timestamps, newTimestamp],
            updatedAt: new Date().toISOString(),
        };

        handleUpdateNote(updatedNote);
    }, [videoNotes, currentTime, handleUpdateNote]);

    return (
        <Card className={`h-full flex flex-col ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Notes ({videoNotes.length})
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Position Toggle Button */}
                        {onPositionChange && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onPositionChange(position === 'side' ? 'bottom' : 'side')}
                                title={position === 'side' ? "Move notes below video" : "Move notes to sidebar"}
                            >
                                {position === 'side' ? (
                                    <MoveDown className="w-4 h-4" />
                                ) : (
                                    <SidebarClose className="w-4 h-4" />
                                )}
                            </Button>
                        )}

                        {/* Add Note Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={createNewNote}
                            title="Create new note"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Note
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-4">
                {videoNotes.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No notes yet for this video.</p>
                        <p className="text-sm">Click &quot;Add Note&quot; to create your first note.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {videoNotes.map((note) => (
                            <NoteEditor
                                key={note.id}
                                note={note}
                                currentTime={currentTime}
                                onUpdate={handleUpdateNote}
                                onDelete={handleDeleteNote}
                                onTimestampClick={onTimestampClick || (() => { })}
                                onAddTimestamp={handleAddTimestamp}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
