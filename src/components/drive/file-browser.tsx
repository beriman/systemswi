"use client";

import { useState } from "react";
import { DriveItem, getItemsByParent, getFolderPath, searchItems, ROOT_FOLDER_ID, isFolder, getFileIcon, formatFileSize } from "@/lib/drive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface FileBrowserProps {
    onFileSelect?: (file: DriveItem) => void;
}

// FileItem inline component to avoid "use client" serialization issues
function FileItem({
    item,
    onNavigate,
    onSelect
}: {
    item: DriveItem;
    onNavigate: (item: DriveItem) => void;
    onSelect?: (item: DriveItem) => void;
}) {
    const handleClick = () => {
        if (isFolder(item)) {
            onNavigate(item);
        } else {
            onSelect?.(item);
        }
    };

    const icon = getFileIcon(item.mimeType);
    const modifiedDate = new Date(item.modifiedTime).toLocaleDateString("id-ID");

    return (
        <Card
            className="p-3 cursor-pointer hover:bg-accent/50 transition-colors flex items-center gap-3"
            onClick={handleClick}
        >
            <span className="text-2xl">{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                    {modifiedDate} • {formatFileSize(item.size)}
                </p>
            </div>
            {isFolder(item) && <span className="text-muted-foreground">→</span>}
        </Card>
    );
}

export function FileBrowser({ onFileSelect }: FileBrowserProps) {
    const [currentFolderId, setCurrentFolderId] = useState(ROOT_FOLDER_ID);
    const [selectedFile, setSelectedFile] = useState<DriveItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const items = searchQuery
        ? searchItems(searchQuery)
        : getItemsByParent(currentFolderId);
    const breadcrumb = getFolderPath(currentFolderId);

    const handleNavigate = (item: DriveItem) => {
        setCurrentFolderId(item.id);
        setSelectedFile(null);
        setSearchQuery(""); // Clear search when navigating
    };

    const handleSelect = (item: DriveItem) => {
        setSelectedFile(item);
        onFileSelect?.(item);
    };

    const navigateToRoot = () => {
        setCurrentFolderId(ROOT_FOLDER_ID);
        setSelectedFile(null);
        setSearchQuery("");
    };

    const navigateToFolder = (folderId: string) => {
        setCurrentFolderId(folderId);
        setSelectedFile(null);
        setSearchQuery("");
    };

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <Input
                type="search"
                placeholder="🔍 Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
            />

            {/* Breadcrumb (hidden during search) */}
            {!searchQuery && (
                <div className="flex items-center gap-2 text-sm flex-wrap">
                    <Button variant="ghost" size="sm" onClick={navigateToRoot} className="h-7 px-2">
                        🏠 Root
                    </Button>
                    {breadcrumb.map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                            <span className="text-muted-foreground">/</span>
                            <Button variant="ghost" size="sm" onClick={() => navigateToFolder(item.id)} className="h-7 px-2">
                                {item.name}
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Search mode indicator */}
            {searchQuery && (
                <p className="text-sm text-muted-foreground">
                    Searching: &quot;{searchQuery}&quot; ({items.length} results)
                </p>
            )}

            {/* File list */}
            <div className="grid gap-2">
                {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "🔍 No results found" : "📂 Folder kosong"}
                    </div>
                ) : (
                    items.map((item) => (
                        <FileItem
                            key={item.id}
                            item={item}
                            onNavigate={handleNavigate}
                            onSelect={handleSelect}
                        />
                    ))
                )}
            </div>

            {/* Selected file info */}
            {selectedFile && (
                <div className="p-4 bg-accent/20 rounded-lg">
                    <p className="text-sm font-medium">Selected: {selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">Type: {selectedFile.mimeType}</p>
                </div>
            )}
        </div>
    );
}

export default FileBrowser;
