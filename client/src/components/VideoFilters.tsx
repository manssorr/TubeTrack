import React, { useState } from "react";
import { Search, Filter, SortAsc, X } from "lucide-react";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export type CompletionFilter = "all" | "completed" | "in-progress" | "not-started";
export type SortOption = "position" | "title" | "duration" | "completion";

interface VideoFiltersProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    completionFilter: CompletionFilter;
    onCompletionFilterChange: (filter: CompletionFilter) => void;
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    videoCount?: number;
    filteredCount?: number;
}

const completionFilterLabels: Record<CompletionFilter, string> = {
    all: "All Videos",
    completed: "Completed",
    "in-progress": "In Progress",
    "not-started": "Not Started",
};

const sortOptionLabels: Record<SortOption, string> = {
    position: "Position",
    title: "Title",
    duration: "Duration",
    completion: "Completion",
};

export default function VideoFilters({
    searchQuery,
    onSearchChange,
    completionFilter,
    onCompletionFilterChange,
    sortBy,
    onSortChange,
    videoCount = 0,
    filteredCount = 0,
}: VideoFiltersProps) {
    const [localSearch, setLocalSearch] = useState(searchQuery);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearchChange(localSearch);
    };

    const handleClearSearch = () => {
        setLocalSearch("");
        onSearchChange("");
    };

    const hasActiveFilters = searchQuery || completionFilter !== "all";
    const isFiltered = filteredCount !== videoCount;

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Search videos and channels..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="pl-10 pr-10"
                />
                {localSearch && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={handleClearSearch}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </form>

            {/* Filters and Sort Row */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    {/* Completion Filter */}
                    <Select value={completionFilter} onValueChange={onCompletionFilterChange}>
                        <SelectTrigger className="w-40">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(completionFilterLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort Options */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="default">
                                <SortAsc className="w-4 h-4 mr-2" />
                                Sort: {sortOptionLabels[sortBy]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {Object.entries(sortOptionLabels).map(([value, label]) => (
                                <DropdownMenuItem
                                    key={value}
                                    onClick={() => onSortChange(value as SortOption)}
                                    className={sortBy === value ? "bg-accent" : ""}
                                >
                                    {label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Results Info and Clear Filters */}
                <div className="flex items-center gap-3">
                    {isFiltered && (
                        <span className="text-sm text-muted-foreground">
                            Showing {filteredCount} of {videoCount} videos
                        </span>
                    )}

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                handleClearSearch();
                                onCompletionFilterChange("all");
                            }}
                            className="text-sm"
                        >
                            <X className="w-3 h-3 mr-1" />
                            Clear filters
                        </Button>
                    )}
                </div>
            </div>

            {/* Active Filter Badges */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                        <Badge variant="secondary" className="gap-1">
                            Search: &quot;{searchQuery}&quot;
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={handleClearSearch}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </Badge>
                    )}
                    {completionFilter !== "all" && (
                        <Badge variant="secondary" className="gap-1">
                            {completionFilterLabels[completionFilter]}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => onCompletionFilterChange("all")}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
