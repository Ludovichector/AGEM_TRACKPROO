"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, FolderOpen, File, FileText, FileImage, Upload,
  Search, ChevronRight, Download, Eye, MoreHorizontal, Plus
} from "lucide-react";
import { formatDate, formatFileSize } from "@/lib/format";

interface Document {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  version: number;
  uploadedBy: string;
  createdAt: string;
  url: string;
}

interface GedFolder {
  id: string;
  name: string;
  path: string;
  documents: Document[];
  children: GedFolder[];
}

interface DocumentsPageClientProps {
  rootFolders: GedFolder[];
  canUpload: boolean;
  projectId: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("pdf") || mimeType.includes("text")) return FileText;
  return File;
}

function FolderNode({
  folder,
  depth = 0,
  selectedFolder,
  onSelect,
}: {
  folder: GedFolder;
  depth?: number;
  selectedFolder: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const isSelected = selectedFolder === folder.id;
  const hasChildren = folder.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(folder.id);
          if (hasChildren) setExpanded((e) => !e);
        }}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm"
        style={{
          paddingLeft: `${12 + depth * 16}px`,
          backgroundColor: isSelected ? "rgba(201,169,97,0.12)" : "transparent",
          color: isSelected ? "var(--agem-gold-dark)" : "var(--text-secondary)",
        }}
      >
        {hasChildren ? (
          <ChevronRight
            className="w-3.5 h-3.5 shrink-0 transition-transform"
            style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}
        {expanded ? (
          <FolderOpen className="w-4 h-4 shrink-0" style={{ color: "var(--agem-gold)" }} />
        ) : (
          <Folder className="w-4 h-4 shrink-0" style={{ color: "var(--agem-gold)" }} />
        )}
        <span className="truncate">{folder.name}</span>
        <span
          className="ml-auto text-xs shrink-0"
          style={{ color: "var(--text-muted)" }}
        >
          {folder.documents.length}
        </span>
      </button>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            {folder.children.map((child) => (
              <FolderNode
                key={child.id}
                folder={child}
                depth={depth + 1}
                selectedFolder={selectedFolder}
                onSelect={onSelect}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getAllFolders(folders: GedFolder[]): GedFolder[] {
  return folders.flatMap((f) => [f, ...getAllFolders(f.children)]);
}

export function DocumentsPageClient({ rootFolders, canUpload }: DocumentsPageClientProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    rootFolders[0]?.id ?? null
  );
  const [search, setSearch] = useState("");

  const allFolders = getAllFolders(rootFolders);
  const selectedFolder = allFolders.find((f) => f.id === selectedFolderId) ?? null;

  const documents = selectedFolder
    ? selectedFolder.documents.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const totalDocs = allFolders.reduce((sum, f) => sum + f.documents.length, 0);

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      {/* Sidebar arborescence */}
      <div
        className="w-64 shrink-0 border-r flex flex-col"
        style={{
          borderColor: "var(--border-subtle)",
          backgroundColor: "var(--bg-card)",
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              GED - Dossiers
            </h2>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {totalDocs} fichiers
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {rootFolders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              selectedFolder={selectedFolderId}
              onSelect={setSelectedFolderId}
            />
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div
          className="px-5 py-3.5 border-b flex items-center gap-3"
          style={{
            borderColor: "var(--border-subtle)",
            backgroundColor: "var(--bg-card)",
          }}
        >
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un document…"
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-colors"
              style={{
                backgroundColor: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
              }}
            />
          </div>
          {canUpload && (
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: "var(--agem-gold)",
                color: "var(--agem-black)",
              }}
            >
              <Upload className="w-4 h-4" />
              Uploader
            </button>
          )}
        </div>

        {/* Breadcrumb */}
        {selectedFolder && (
          <div
            className="px-5 py-2 text-xs flex items-center gap-1"
            style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>{selectedFolder.path || selectedFolder.name}</span>
          </div>
        )}

        {/* Document list */}
        <div className="flex-1 overflow-y-auto p-5">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48">
              <FileText className="w-10 h-10 mb-3" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {search ? "Aucun résultat" : "Dossier vide"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {documents.map((doc, i) => {
                const Icon = getFileIcon(doc.mimeType);
                return (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all group"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "rgba(201,169,97,0.1)" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "var(--agem-gold)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          v{doc.version}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>•</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {formatFileSize(doc.sizeBytes)}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>•</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {doc.uploadedBy} - {formatDate(doc.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        title="Aperçu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        title="Télécharger"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
