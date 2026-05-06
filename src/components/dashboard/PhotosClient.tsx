"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, MapPin, Calendar, Plus, X, Tag } from "lucide-react";
import { formatDate } from "@/lib/format";
import { toast } from "sonner";

interface PhotoAnnotation {
  id: string;
  authorName: string;
  content: string;
  posX: number;
  posY: number;
  createdAt: string;
}

interface Photo {
  id: string;
  zone: string;
  caption: string | null;
  fileUrl: string;
  thumbnailUrl: string | null;
  takenAt: string;
  takenBy: {
    name: string;
    role: string;
  };
  tags: string[];
  annotations: PhotoAnnotation[];
}

export function PhotosClient({ photos, userRole }: { photos: Photo[], userRole: string }) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const zones = Array.from(new Set(photos.map(p => p.zone)));
  const filteredPhotos = selectedZone ? photos.filter(p => p.zone === selectedZone) : photos;

  const canUpload = userRole !== "MOA_DG" && userRole !== "MOA_COPIL" && userRole !== "OBSERVATEUR";

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2 flex items-center gap-3">
            <Camera className="w-8 h-8 text-[var(--agem-gold)]" />
            Journal de Chantier
          </h1>
          <p className="text-[var(--text-muted)]">
            Suivi visuel et chronologique de l'avancement des travaux.
          </p>
        </div>
        {canUpload && (
          <button 
            onClick={() => toast.info("Intégration du stockage cloud (S3) en cours de finalisation pour l'upload de photos.")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--agem-gold)] text-black rounded-lg font-bold hover:bg-[var(--agem-gold-dark)] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ajouter des photos
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedZone(null)}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            selectedZone === null 
              ? "bg-[var(--text-primary)] text-[var(--bg-canvas)]" 
              : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-muted)]"
          }`}
        >
          Toutes les zones
        </button>
        {zones.map(zone => (
          <button
            key={zone}
            onClick={() => setSelectedZone(zone)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              selectedZone === zone 
                ? "bg-[var(--text-primary)] text-[var(--bg-canvas)]" 
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--text-muted)]"
            }`}
          >
            {zone}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredPhotos.map(photo => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              key={photo.id}
              className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-sm group cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="relative aspect-[4/3] bg-black/5 overflow-hidden">
                <img 
                  src={photo.thumbnailUrl || photo.fileUrl} 
                  alt={photo.caption || photo.zone}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 opacity-60 group-hover:opacity-80 transition-opacity" />
                
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2.5 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--agem-gold)]" /> {photo.zone}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-medium text-sm line-clamp-2 leading-tight drop-shadow-md">
                    {photo.caption}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-white/70 text-xs font-medium">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(photo.takenAt)}</span>
                  </div>
                </div>

                {photo.annotations.length > 0 && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--agem-gold)] text-black flex items-center justify-center text-xs font-bold shadow-lg">
                    {photo.annotations.length}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Lightbox / Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 lg:p-8 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
            >
              <X className="w-6 h-6" />
            </button>

            <div 
              className="w-full max-w-6xl max-h-full flex flex-col lg:flex-row bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Image Container */}
              <div className="relative flex-1 bg-black min-h-[40vh] lg:min-h-[80vh] flex items-center justify-center overflow-hidden">
                <img 
                  src={selectedPhoto.fileUrl} 
                  alt={selectedPhoto.caption || "Photo"}
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Annotations pins */}
                {selectedPhoto.annotations.map(ann => (
                  <div 
                    key={ann.id}
                    className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-[var(--agem-gold)] border-2 border-white shadow-lg flex items-center justify-center group cursor-help transition-transform hover:scale-125 hover:z-10"
                    style={{ left: `${ann.posX}%`, top: `${ann.posY}%` }}
                  >
                    <div className="w-2 h-2 rounded-full bg-black" />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-white text-black rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all origin-bottom">
                      <p className="text-xs font-bold text-[var(--text-muted)] mb-1">{ann.authorName}</p>
                      <p className="text-sm font-medium leading-tight">{ann.content}</p>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar Info */}
              <div className="w-full lg:w-80 flex-shrink-0 border-l border-[var(--border-subtle)] flex flex-col bg-[var(--bg-card)] max-h-[40vh] lg:max-h-full overflow-y-auto">
                <div className="p-5 border-b border-[var(--border-subtle)]">
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                    {selectedPhoto.zone}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {formatDate(selectedPhoto.takenAt)}
                  </p>
                </div>
                
                <div className="p-5 space-y-6">
                  {selectedPhoto.caption && (
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Description</h4>
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                        {selectedPhoto.caption}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Auteur</h4>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{selectedPhoto.takenBy.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{selectedPhoto.takenBy.role.replace("_", " ")}</p>
                  </div>

                  {selectedPhoto.tags.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedPhoto.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-md text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1">
                            <Tag className="w-3 h-3" /> {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedPhoto.annotations.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        Annotations ({selectedPhoto.annotations.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedPhoto.annotations.map(ann => (
                          <div key={ann.id} className="p-3 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)] relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--agem-gold)]" />
                            <p className="text-xs font-bold text-[var(--text-muted)] mb-1 flex justify-between">
                              <span>{ann.authorName}</span>
                            </p>
                            <p className="text-sm text-[var(--text-primary)] leading-snug">{ann.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
