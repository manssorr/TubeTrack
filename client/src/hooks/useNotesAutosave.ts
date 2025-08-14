import { useEffect, useRef, useCallback } from "react";
import { useNotes } from "./useLocalStorage";
import { TNote } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface AutosaveOptions {
  videoId: string;
  content: string;
  tags: string[];
  delay?: number; // Autosave delay in milliseconds (default: 2000ms)
  onSaveStatusChange?: (status: "idle" | "saving" | "saved" | "error", message?: string) => void;
}

export function useNotesAutosave({
  videoId,
  content,
  tags,
  delay = 2000,
  onSaveStatusChange,
}: AutosaveOptions) {
  const { addOrUpdateNote, removeNote, getNotesByVideo } = useNotes();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>("");
  const isInitialLoadRef = useRef(true);

  // Initialize note content from storage
  const loadNote = useCallback(() => {
    const videoNotes = getNotesByVideo(videoId);
    const existingNote = videoNotes[0]; // Get the most recent note for this video
    if (existingNote) {
      lastSavedContentRef.current = existingNote.content;
      return existingNote;
    }
    return null;
  }, [getNotesByVideo, videoId]);

  // Save note to storage
  const saveNote = useCallback(async () => {
    if (!videoId || content === lastSavedContentRef.current) {
      return;
    }

    onSaveStatusChange?.("saving", "Saving notes...");

    try {
      // Simulate save delay for UX
      await new Promise(resolve => setTimeout(resolve, 300));

      const now = new Date().toISOString();
      const videoNotes = getNotesByVideo(videoId);
      const existingNote = videoNotes[0]; // Get the most recent note

      const updatedNote: TNote = {
        id: existingNote?.id || uuidv4(),
        videoId,
        content: content.trim(),
        timestamps: [], // TODO: Parse timestamps from content in the future
        tags,
        createdAt: existingNote?.createdAt || now,
        updatedAt: now,
      };

      addOrUpdateNote(updatedNote);
      lastSavedContentRef.current = content;
      onSaveStatusChange?.("saved", "Notes saved!");

      // Clear saved status after 2 seconds
      setTimeout(() => {
        onSaveStatusChange?.("idle");
      }, 2000);

      console.log(`Notes saved for video ${videoId}`);
    } catch (error) {
      console.error("Failed to save notes:", error);
      onSaveStatusChange?.("error", "Failed to save notes");
    }
  }, [videoId, content, tags, getNotesByVideo, addOrUpdateNote, onSaveStatusChange]);

  // Manual save function
  const manualSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await saveNote();
  }, [saveNote]);

  // Debounced autosave effect
  useEffect(() => {
    // Skip autosave on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      return;
    }

    // Skip if content hasn't changed
    if (content === lastSavedContentRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave
    timeoutRef.current = setTimeout(() => {
      saveNote();
    }, delay);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, delay, saveNote]);

  // Save on component unmount (window beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Perform synchronous save on page unload
      if (content !== lastSavedContentRef.current) {
        try {
          const now = new Date().toISOString();
          const videoNotes = getNotesByVideo(videoId);
          const existingNote = videoNotes[0];

          const updatedNote: TNote = {
            id: existingNote?.id || uuidv4(),
            videoId,
            content: content.trim(),
            timestamps: [],
            tags,
            createdAt: existingNote?.createdAt || now,
            updatedAt: now,
          };

          // Use the notes service for immediate save
          addOrUpdateNote(updatedNote);
          console.log(`Notes saved on page unload for video ${videoId}`);
        } catch (error) {
          console.error("Failed to save notes on unload:", error);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [videoId, content, tags, getNotesByVideo, addOrUpdateNote]);

  // Get note data
  const getNote = useCallback(() => {
    const videoNotes = getNotesByVideo(videoId);
    return videoNotes[0] || null;
  }, [getNotesByVideo, videoId]);

  // Delete note
  const deleteNote = useCallback(() => {
    const videoNotes = getNotesByVideo(videoId);
    if (videoNotes[0]) {
      removeNote(videoNotes[0].id);
      lastSavedContentRef.current = "";
      onSaveStatusChange?.("idle");
    }
  }, [videoId, getNotesByVideo, removeNote, onSaveStatusChange]);

  return {
    loadNote,
    saveNote: manualSave,
    getNote,
    deleteNote,
    isDirty: content !== lastSavedContentRef.current,
    lastSavedContent: lastSavedContentRef.current,
  };
}
