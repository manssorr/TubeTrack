import React from 'react';
import { Maximize, Minimize, Monitor, Focus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { UserSettings } from '@shared/schema';

interface VideoPlayerModesProps {
  currentMode: UserSettings['videoPlayerMode'];
  onModeChange: (mode: UserSettings['videoPlayerMode']) => void;
}

export function VideoPlayerModes({ currentMode, onModeChange }: VideoPlayerModesProps) {
  const modes = [
    { value: 'normal' as const, label: 'Normal', icon: Monitor },
    { value: 'theater' as const, label: 'Theater Mode', icon: Maximize },
    { value: 'focus' as const, label: 'Focus Mode', icon: Focus },
    { value: 'fullscreen' as const, label: 'Fullscreen', icon: Eye },
  ];

  const currentModeData = modes.find(mode => mode.value === currentMode);
  const CurrentIcon = currentModeData?.icon || Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          <CurrentIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {modes.map(mode => {
          const Icon = mode.icon;
          return (
            <DropdownMenuItem
              key={mode.value}
              onClick={() => onModeChange(mode.value)}
              className={currentMode === mode.value ? 'bg-primary/10' : ''}
            >
              <Icon className="w-4 h-4 mr-2" />
              {mode.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mode descriptions for help
export const modeDescriptions = {
  normal: 'Standard view with sidebar and notes panel',
  theater: 'Video takes most of the screen width for better viewing',
  focus: 'Minimal UI with only video player and essential controls',
  fullscreen: 'Browser fullscreen mode for immersive experience'
};