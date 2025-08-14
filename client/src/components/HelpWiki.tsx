import React, { useState } from 'react';
import { 
  HelpCircle, 
  Keyboard, 
  Video, 
  FileText, 
  BarChart3, 
  Settings, 
  ChevronRight,
  Play,
  Pause,
  Bookmark,
  Clock,
  Maximize,
  Focus,
  Eye,
  Monitor,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface HelpWikiProps {
  trigger?: React.ReactNode;
}

export function HelpWiki({ trigger }: HelpWikiProps) {
  const [activeSection, setActiveSection] = useState<string>('getting-started');

  const keyboardShortcuts = [
    {
      category: 'Video Playback',
      shortcuts: [
        { key: 'Space', description: 'Play/Pause video', icon: <Play className="w-4 h-4" /> },
        { key: 'Enter', description: 'Mark progress checkpoint', icon: <Bookmark className="w-4 h-4" /> },
        { key: 'Ctrl + F', description: 'Toggle fullscreen', icon: <Maximize className="w-4 h-4" /> },
        { key: 'Escape', description: 'Exit fullscreen', icon: <X className="w-4 h-4" /> },
      ]
    },
    {
      category: 'Notes & Timestamps',
      shortcuts: [
        { key: 'Ctrl + T', description: 'Insert timestamp at cursor', icon: <Clock className="w-4 h-4" /> },
        { key: 'Click timestamp', description: 'Jump to that time in video', icon: <Video className="w-4 h-4" /> },
      ]
    }
  ];

  const videoModes = [
    { 
      mode: 'Normal', 
      icon: <Monitor className="w-5 h-5" />, 
      description: 'Standard view with sidebar and notes panel. Best for taking detailed notes while watching.',
      when: 'Use for focused learning with extensive note-taking'
    },
    { 
      mode: 'Theater', 
      icon: <Maximize className="w-5 h-5" />, 
      description: 'Video takes most of the screen width for better viewing. Notes panel remains accessible.',
      when: 'Use for content that benefits from larger video size'
    },
    { 
      mode: 'Focus', 
      icon: <Focus className="w-5 h-5" />, 
      description: 'Minimal UI with only essential controls. Reduces distractions for deep focus.',
      when: 'Use when you want to focus purely on the content'
    },
    { 
      mode: 'Fullscreen', 
      icon: <Eye className="w-5 h-5" />, 
      description: 'Browser fullscreen mode for immersive experience. Controls appear on hover.',
      when: 'Use for presentations or when maximum immersion is needed'
    }
  ];

  const features = [
    {
      title: 'Progress Tracking',
      icon: <BarChart3 className="w-5 h-5 text-blue-500" />,
      description: 'Track your learning progress with segment-based tracking that remembers exactly what you\'ve watched.',
      benefits: [
        'Resume from where you left off',
        'Visual progress indicators',
        'Completion estimates based on your pace'
      ]
    },
    {
      title: 'Smart Notes',
      icon: <FileText className="w-5 h-5 text-green-500" />,
      description: 'Take timestamped notes that sync with video playback. Click any timestamp to jump to that moment.',
      benefits: [
        'Auto-save as you type',
        'Timestamp insertion with Ctrl+T',
        'Click timestamps to navigate'
      ]
    },
    {
      title: 'Learning Analytics',
      icon: <BarChart3 className="w-5 h-5 text-purple-500" />,
      description: 'Understand your learning patterns with detailed analytics and time estimates.',
      benefits: [
        'Learning ratio (your pace vs content duration)',
        'Time remaining estimates',
        'Completion tracking across playlists'
      ]
    },
    {
      title: 'Multiple Input Methods',
      icon: <Video className="w-5 h-5 text-orange-500" />,
      description: 'Load content via YouTube playlist URLs or upload custom JSON with your video list.',
      benefits: [
        'Direct YouTube playlist import',
        'Custom JSON upload support',
        'Offline playlist management'
      ]
    }
  ];

  const bestPractices = [
    {
      title: 'Effective Learning Workflow',
      tips: [
        'Start with Theater mode for overview, switch to Normal for detailed study',
        'Use Enter key frequently to mark your progress - it helps with resuming later',
        'Take notes in your own words rather than transcribing',
        'Use timestamps (Ctrl+T) to mark important concepts for quick review'
      ]
    },
    {
      title: 'Progress Management',
      tips: [
        'Mark checkpoints every 5-10 minutes to ensure accurate resume points',
        'Use the analytics dashboard to identify your optimal learning times',
        'Review your learning ratio to adjust study session lengths',
        'Export your data regularly as backup'
      ]
    },
    {
      title: 'Note-Taking Strategy',
      tips: [
        'Insert timestamps before key concepts for easy navigation',
        'Use bullet points and headers to structure your notes',
        'Write questions and answers to test your understanding',
        'Review timestamped notes after completing videos'
      ]
    }
  ];

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <HelpCircle className="w-4 h-4 mr-2" />
      Help
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <span>Learning Platform Guide</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-6">
          <Accordion type="single" collapsible className="w-full" defaultValue="getting-started">
            {/* Getting Started */}
            <AccordionItem value="getting-started">
              <AccordionTrigger className="text-left">
                <span className="flex items-center space-x-2">
                  <Play className="w-4 h-4" />
                  <span>Getting Started</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Welcome to your YouTube Learning Progress Tracker! This platform helps you learn efficiently from video content with progress tracking, smart notes, and learning analytics.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2 text-sm">Step 1: Add Content</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Paste a YouTube playlist URL or upload a JSON file with your video list. The platform will fetch all video details automatically.
                      </p>
                    </Card>
                    
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2 text-sm">Step 2: Start Learning</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Select a video and start watching. Use Enter to mark progress and Ctrl+T to insert timestamps in your notes.
                      </p>
                    </Card>
                    
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2 text-sm">Step 3: Track Progress</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Monitor your learning analytics to understand your pace and get accurate completion estimates.
                      </p>
                    </Card>
                    
                    <Card className="p-4">
                      <h4 className="font-semibold mb-2 text-sm">Step 4: Review & Export</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Use your timestamped notes for review and export your progress data for backup or sharing.
                      </p>
                    </Card>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Keyboard Shortcuts */}
            <AccordionItem value="shortcuts">
              <AccordionTrigger>
                <span className="flex items-center space-x-2">
                  <Keyboard className="w-4 h-4" />
                  <span>Keyboard Shortcuts</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6">
                  {keyboardShortcuts.map((category, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-sm mb-3">{category.category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {category.shortcuts.map((shortcut, i) => (
                          <div key={i} className="flex items-center space-x-3 p-2 rounded border">
                            {shortcut.icon}
                            <div className="flex-1">
                              <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                {shortcut.key}
                              </div>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 flex-2">
                              {shortcut.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Video Player Modes */}
            <AccordionItem value="video-modes">
              <AccordionTrigger>
                <span className="flex items-center space-x-2">
                  <Video className="w-4 h-4" />
                  <span>Video Player Modes</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {videoModes.map((mode, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-primary">{mode.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{mode.mode} Mode</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {mode.description}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {mode.when}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Platform Features */}
            <AccordionItem value="features">
              <AccordionTrigger>
                <span className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Platform Features</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start space-x-3">
                        <div>{feature.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-2">{feature.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {feature.description}
                          </p>
                          <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            {feature.benefits.map((benefit, i) => (
                              <li key={i} className="flex items-center space-x-2">
                                <ChevronRight className="w-3 h-3" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Best Practices */}
            <AccordionItem value="best-practices">
              <AccordionTrigger>
                <span className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Best Practices</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6">
                  {bestPractices.map((practice, index) => (
                    <div key={index}>
                      <h4 className="font-semibold text-sm mb-3">{practice.title}</h4>
                      <ul className="space-y-2">
                        {practice.tips.map((tip, i) => (
                          <li key={i} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <ChevronRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}