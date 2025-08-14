import { useEffect, useCallback } from "react";

interface VideoKeyboardShortcutsOptions {
    // Player controls
    onPlayPause: () => void;
    onSeekBackward: (seconds?: number) => void;
    onSeekForward: (seconds?: number) => void;
    onVolumeUp: () => void;
    onVolumeDown: () => void;
    onMuteToggle: () => void;
    onSpeedDecrease: () => void;
    onSpeedIncrease: () => void;
    onFullscreen?: () => void;
    
    // Navigation
    onPrevious?: () => void;
    onNext?: () => void;
    
    // Custom seeks
    onSeekToPercentage?: (percentage: number) => void;
    
    // Options
    enabled?: boolean;
    preventDefaultOnTarget?: string[]; // CSS selectors where shortcuts should be prevented
}

interface ShortcutInfo {
    key: string;
    description: string;
    modifiers?: string[];
}

export const KEYBOARD_SHORTCUTS: ShortcutInfo[] = [
    { key: "Space", description: "Play/Pause" },
    { key: "K", description: "Play/Pause" },
    { key: "←", description: "Seek backward 5s" },
    { key: "→", description: "Seek forward 5s" },
    { key: "J", description: "Seek backward 10s" },
    { key: "L", description: "Seek forward 10s" },
    { key: "↑", description: "Volume up" },
    { key: "↓", description: "Volume down" },
    { key: "M", description: "Mute/Unmute" },
    { key: "<", description: "Decrease speed", modifiers: ["Shift"] },
    { key: ">", description: "Increase speed", modifiers: ["Shift"] },
    { key: "F", description: "Fullscreen" },
    { key: "P", description: "Previous video" },
    { key: "N", description: "Next video" },
    { key: "0-9", description: "Seek to percentage (0-90%)" },
    { key: "Home", description: "Seek to beginning" },
    { key: "End", description: "Seek to end" },
];

export function useVideoKeyboardShortcuts({
    onPlayPause,
    onSeekBackward,
    onSeekForward,
    onVolumeUp,
    onVolumeDown,
    onMuteToggle,
    onSpeedDecrease,
    onSpeedIncrease,
    onFullscreen,
    onPrevious,
    onNext,
    onSeekToPercentage,
    enabled = true,
    preventDefaultOnTarget = ["input", "textarea", "[contenteditable]"],
}: VideoKeyboardShortcutsOptions) {
    
    const handleKeyPress = useCallback(
        (event: KeyboardEvent) => {
            if (!enabled) return;
            
            // Check if focus is on an input element where we shouldn't intercept
            const target = event.target as Element;
            const shouldPrevent = preventDefaultOnTarget.some(selector => {
                try {
                    return target.matches(selector);
                } catch (e) {
                    return false;
                }
            });
            
            if (shouldPrevent) return;
            
            // Handle shortcuts
            const { key, shiftKey, ctrlKey, altKey, metaKey } = event;
            
            // Don't handle if modifier keys are pressed (except for specific cases)
            if (ctrlKey || altKey || metaKey) return;
            
            let handled = false;
            
            switch (key.toLowerCase()) {
                case " ": // Spacebar
                case "k":
                    onPlayPause();
                    handled = true;
                    break;
                    
                case "arrowleft":
                    onSeekBackward(5);
                    handled = true;
                    break;
                    
                case "arrowright":
                    onSeekForward(5);
                    handled = true;
                    break;
                    
                case "j":
                    onSeekBackward(10);
                    handled = true;
                    break;
                    
                case "l":
                    onSeekForward(10);
                    handled = true;
                    break;
                    
                case "arrowup":
                    onVolumeUp();
                    handled = true;
                    break;
                    
                case "arrowdown":
                    onVolumeDown();
                    handled = true;
                    break;
                    
                case "m":
                    onMuteToggle();
                    handled = true;
                    break;
                    
                case ",":
                    if (shiftKey) { // < key
                        onSpeedDecrease();
                        handled = true;
                    }
                    break;
                    
                case ".":
                    if (shiftKey) { // > key
                        onSpeedIncrease();
                        handled = true;
                    }
                    break;
                    
                case "f":
                    if (onFullscreen) {
                        onFullscreen();
                        handled = true;
                    }
                    break;
                    
                case "p":
                    if (onPrevious) {
                        onPrevious();
                        handled = true;
                    }
                    break;
                    
                case "n":
                    if (onNext) {
                        onNext();
                        handled = true;
                    }
                    break;
                    
                case "home":
                    if (onSeekToPercentage) {
                        onSeekToPercentage(0);
                        handled = true;
                    }
                    break;
                    
                case "end":
                    if (onSeekToPercentage) {
                        onSeekToPercentage(100);
                        handled = true;
                    }
                    break;
                    
                // Number keys for percentage seeking
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    if (onSeekToPercentage) {
                        const percentage = parseInt(key) * 10;
                        onSeekToPercentage(percentage);
                        handled = true;
                    }
                    break;
            }
            
            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        },
        [
            enabled,
            preventDefaultOnTarget,
            onPlayPause,
            onSeekBackward,
            onSeekForward,
            onVolumeUp,
            onVolumeDown,
            onMuteToggle,
            onSpeedDecrease,
            onSpeedIncrease,
            onFullscreen,
            onPrevious,
            onNext,
            onSeekToPercentage,
        ]
    );
    
    useEffect(() => {
        if (!enabled) return;
        
        document.addEventListener("keydown", handleKeyPress);
        
        return () => {
            document.removeEventListener("keydown", handleKeyPress);
        };
    }, [handleKeyPress, enabled]);
}

// Helper component for displaying shortcuts help
export function KeyboardShortcutsHelp({ 
    className = "" 
}: { 
    className?: string 
}) {
    return (
        <div className={`space-y-2 text-sm ${className}`}>
            <h3 className="font-semibold text-lg mb-3">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                        <span className="text-muted-foreground">{shortcut.description}</span>
                        <div className="flex items-center space-x-1">
                            {shortcut.modifiers?.map((modifier) => (
                                <kbd key={modifier} className="px-2 py-1 text-xs bg-muted rounded">
                                    {modifier}
                                </kbd>
                            ))}
                            <kbd className="px-2 py-1 text-xs bg-muted rounded">
                                {shortcut.key}
                            </kbd>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
