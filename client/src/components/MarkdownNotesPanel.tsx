import { useState, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { FileText, Eye, Edit3, Clock, Save, AlertCircle } from "lucide-react";

import { useNotesAutosave } from "@/hooks/useNotesAutosave";

import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";

interface MarkdownNotesPanelProps {
    videoId: string;
    currentTime?: number;
    onTimestampClick?: (seconds: number) => void;
    className?: string;
}

interface NoteSaveStatus {
    status: 'idle' | 'saving' | 'saved' | 'error';
    message?: string;
}

export default function MarkdownNotesPanel({
    videoId,
    currentTime = 0,
    onTimestampClick,
    className = "",
}: MarkdownNotesPanelProps) {
    const [noteContent, setNoteContent] = useState("");
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
    const [saveStatus, setSaveStatus] = useState<NoteSaveStatus>({ status: 'idle' });

    // Extract hashtags from content
    const extractTags = useCallback((content: string): string[] => {
        const tagRegex = /#([a-zA-Z0-9_-]+)/g;
        const tags: string[] = [];
        let match;
        while ((match = tagRegex.exec(content)) !== null) {
            const tag = match[1];
            if (tag && !tags.includes(tag)) {
                tags.push(tag);
            }
        }
        return tags;
    }, []);

    const tags = extractTags(noteContent);

    // Autosave functionality
    const { loadNote, saveNote, isDirty } = useNotesAutosave({
        videoId,
        content: noteContent,
        tags,
        delay: 2000,
        onSaveStatusChange: (status, message) => {
            setSaveStatus({ status, ...(message && { message }) });
        },
    });

    // Load existing note on mount or when videoId changes
    useEffect(() => {
        const existingNote = loadNote();
        if (existingNote) {
            setNoteContent(existingNote.content);
        } else {
            setNoteContent("");
        }
    }, [videoId, loadNote]);

    // Format time as [mm:ss] timestamp
    const formatTimestamp = useCallback((seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `[${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}]`;
    }, []);

    // Parse timestamps from markdown content (currently unused but ready for future features)
    const parseTimestamps = useCallback((content: string) => {
        const timestampRegex = /\[(\d{1,2}):(\d{2})\]/g;
        const matches: Array<{ text: string; seconds: number; index: number }> = [];
        let match;
        while ((match = timestampRegex.exec(content)) !== null) {
            const minutes = parseInt(match[1] || '0', 10);
            const seconds = parseInt(match[2] || '0', 10);
            const totalSeconds = minutes * 60 + seconds;
            matches.push({
                text: match[0],
                seconds: totalSeconds,
                index: match.index || 0,
            });
        }
        return matches;
    }, []);

    // Silence unused variable warning - this will be used for future features
    parseTimestamps;

    // Insert timestamp at current position
    const insertTimestamp = useCallback(() => {
        const timestamp = formatTimestamp(currentTime);
        const textarea = document.querySelector('.notes-textarea') as HTMLTextAreaElement;

        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = noteContent.slice(0, start) + timestamp + ' ' + noteContent.slice(end);
            setNoteContent(newContent);

            // Move cursor after timestamp
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + timestamp.length + 1, start + timestamp.length + 1);
            }, 0);
        }
    }, [currentTime, noteContent, formatTimestamp]);

    // Handle note content change
    const handleContentChange = useCallback((value: string) => {
        setNoteContent(value);
    }, []);

    // Manual save function
    const handleManualSave = useCallback(async () => {
        await saveNote();
    }, [saveNote]);

    // Custom markdown components
    const markdownComponents = {
        // Custom code block renderer with syntax highlighting
        code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className={`${className} bg-muted px-1 py-0.5 rounded text-sm font-mono`} {...props}>
                    {children}
                </code>
            );
        },
        // Custom link renderer to handle timestamps
        a: ({ href, children, ...props }: any) => {
            // Check if this looks like a timestamp
            const timestampMatch = /^\[(\d{1,2}):(\d{2})\]$/.exec(String(children));
            if (timestampMatch && onTimestampClick) {
                const minutes = parseInt(timestampMatch[1] || '0', 10);
                const seconds = parseInt(timestampMatch[2] || '0', 10);
                const totalSeconds = minutes * 60 + seconds;

                return (
                    <button
                        className="timestamp-link text-primary hover:text-primary/80 underline font-mono cursor-pointer bg-primary/10 px-1 py-0.5 rounded"
                        onClick={(e) => {
                            e.preventDefault();
                            onTimestampClick(totalSeconds);
                        }}
                        {...props}
                    >
                        {children}
                    </button>
                );
            }

            return <a href={href} {...props}>{children}</a>;
        },
    };



    return (
        <Card className={`h-full flex flex-col ${className}`}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Notes
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Save Status Indicator */}
                        {saveStatus.status !== 'idle' && (
                            <div className="flex items-center gap-1 text-sm">
                                {saveStatus.status === 'saving' && (
                                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                                )}
                                {saveStatus.status === 'saved' && <Save className="w-4 h-4 text-green-500" />}
                                {saveStatus.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                <span className={`
                                    ${saveStatus.status === 'saving' ? 'text-muted-foreground' : ''}
                                    ${saveStatus.status === 'saved' ? 'text-green-600' : ''}
                                    ${saveStatus.status === 'error' ? 'text-red-600' : ''}
                                `}>
                                    {saveStatus.message}
                                </span>
                            </div>
                        )}

                        {/* Insert Timestamp Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={insertTimestamp}
                            title={`Insert timestamp ${formatTimestamp(currentTime)}`}
                        >
                            <Clock className="w-4 h-4" />
                        </Button>

                        {/* Manual Save Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleManualSave}
                            disabled={saveStatus.status === 'saving' || !isDirty}
                            title={isDirty ? "Save changes" : "No changes to save"}
                        >
                            <Save className={`w-4 h-4 ${isDirty ? 'text-orange-500' : ''}`} />
                        </Button>
                    </div>
                </CardTitle>

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

            <CardContent className="flex-1 flex flex-col p-0">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "edit" | "preview")} className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 mx-4 mb-3">
                        <TabsTrigger value="edit" className="flex items-center gap-2">
                            <Edit3 className="w-4 h-4" />
                            Edit
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Preview
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="edit" className="flex-1 px-4 pb-4 mt-0">
                        <textarea
                            className="notes-textarea w-full h-full min-h-[400px] p-3 rounded-md border border-input bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                            placeholder="Write your notes here... Use #tags and insert timestamps with the clock button.

Examples:
- #important This is an important concept
- #todo Review this later
- [12:34] Key point discussed here"
                            value={noteContent}
                            onChange={(e) => handleContentChange(e.target.value)}
                        />
                    </TabsContent>

                    <TabsContent value="preview" className="flex-1 px-4 pb-4 mt-0">
                        <div className="h-full min-h-[400px] p-3 rounded-md border border-input bg-background overflow-y-auto">
                            {noteContent.trim() ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none
                                    prose-headings:text-foreground
                                    prose-p:text-foreground
                                    prose-strong:text-foreground
                                    prose-em:text-foreground
                                    prose-code:text-foreground
                                    prose-pre:bg-muted
                                    prose-blockquote:text-muted-foreground
                                    prose-blockquote:border-border
                                    prose-ul:text-foreground
                                    prose-ol:text-foreground
                                    prose-li:text-foreground
                                ">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={markdownComponents}
                                    >
                                        {noteContent}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">
                                    No content to preview. Switch to Edit tab to start writing.
                                </p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
