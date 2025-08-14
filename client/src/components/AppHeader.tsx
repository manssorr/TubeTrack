import React from 'react';
import { Moon, Sun, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';
import { exportProgressData, importProgressData } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface AppHeaderProps {
  onImport: (data: any) => void;
  helpTrigger?: React.ReactNode;
}

export function AppHeader({ onImport, helpTrigger }: AppHeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleExport = () => {
    try {
      exportProgressData();
      toast({
        title: "Export Successful",
        description: "Your progress data has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export progress data.",
        variant: "destructive",
      });
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const data = await importProgressData(file);
        onImport(data);
        toast({
          title: "Import Successful",
          description: "Your progress data has been imported.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import progress data. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-white ml-0.5"></div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Learning Tracker</h1>
          </div>
          <div className="flex items-center space-x-4">
            {helpTrigger}
            <Button variant="ghost" size="sm" onClick={handleImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
