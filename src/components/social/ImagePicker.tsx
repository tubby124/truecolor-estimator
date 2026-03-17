"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useToast, ToastContainer } from "@/components/ui/Toast";

type Tab = "upload" | "library" | "url";

interface UploadResponse {
  url: string;
  width: number;
  height: number;
  format: string;
}

interface LibraryImage {
  url: string;
  name: string;
  created_at: string;
}

interface ImagePickerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "upload", label: "Upload", icon: "↑" },
  { key: "library", label: "Library", icon: "▦" },
  { key: "url", label: "Paste URL", icon: "🔗" },
];

const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB

const ACCEPTED_RATIOS: { label: string; ratio: number; tolerance: number }[] = [
  { label: "1:1", ratio: 1, tolerance: 0.05 },
  { label: "4:5", ratio: 4 / 5, tolerance: 0.05 },
  { label: "1.91:1", ratio: 1.91, tolerance: 0.05 },
];

function checkAspectRatio(width: number, height: number): string | null {
  if (width <= 0 || height <= 0) return null;
  const ratio = width / height;
  const match = ACCEPTED_RATIOS.some(
    (ar) => Math.abs(ratio - ar.ratio) <= ar.tolerance
  );
  if (match) return null;
  return "Instagram may crop this image";
}

export function ImagePicker({
  value,
  onChange,
  maxImages = 10,
}: ImagePickerProps) {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [library, setLibrary] = useState<LibraryImage[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, showToast, dismissToast } = useToast();

  const atLimit = value.length >= maxImages;

  const addUrl = useCallback(
    (url: string) => {
      if (value.includes(url)) return;
      if (value.length >= maxImages) return;
      onChange([...value, url]);
    },
    [value, onChange, maxImages]
  );

  const removeUrl = useCallback(
    (url: string) => {
      onChange(value.filter((u) => u !== url));
      setWarnings((prev) => {
        const next = { ...prev };
        delete next[url];
        return next;
      });
    },
    [value, onChange]
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const remaining = maxImages - value.length;
      if (remaining <= 0) {
        showToast("Maximum images reached", "error");
        return;
      }

      const toUpload = files.slice(0, remaining);
      const oversized = toUpload.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversized.length > 0) {
        showToast(
          `${oversized.length} file(s) exceed 30MB limit`,
          "error"
        );
        return;
      }

      setUploading(true);
      setUploadCount(0);
      setUploadTotal(toUpload.length);

      const newUrls: string[] = [];
      const newWarnings: Record<string, string> = {};

      for (let i = 0; i < toUpload.length; i++) {
        setUploadCount(i + 1);
        const file = toUpload[i];
        const form = new FormData();
        form.append("file", file);

        try {
          const res = await fetch("/api/staff/social/upload", {
            method: "POST",
            body: form,
          });

          if (!res.ok) {
            const errBody = await res.text();
            showToast(`Upload failed: ${errBody || res.statusText}`, "error");
            continue;
          }

          const data: UploadResponse = await res.json();
          newUrls.push(data.url);

          const warning = checkAspectRatio(data.width, data.height);
          if (warning) {
            newWarnings[data.url] = warning;
          }
        } catch {
          showToast(`Failed to upload ${file.name}`, "error");
        }
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
        setWarnings((prev) => ({ ...prev, ...newWarnings }));
        showToast(`${newUrls.length} image(s) uploaded`, "success");
      }

      setUploading(false);
    },
    [value, onChange, maxImages, showToast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (atLimit) return;
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length > 0) uploadFiles(files);
    },
    [atLimit, uploadFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const files = Array.from(e.target.files);
      if (files.length > 0) uploadFiles(files);
      e.target.value = "";
    },
    [uploadFiles]
  );

  useEffect(() => {
    if (activeTab === "library" && !libraryLoaded) {
      setLibraryLoading(true);
      fetch("/api/staff/social/images")
        .then((res) => res.json())
        .then((data: { images: LibraryImage[] }) => {
          setLibrary(data.images);
          setLibraryLoaded(true);
        })
        .catch(() => {
          showToast("Failed to load image library", "error");
        })
        .finally(() => setLibraryLoading(false));
    }
  }, [activeTab, libraryLoaded, showToast]);

  const handlePasteAdd = useCallback(() => {
    const trimmed = pasteUrl.trim();
    if (!trimmed) return;
    try {
      new URL(trimmed);
    } catch {
      showToast("Invalid URL", "error");
      return;
    }
    if (atLimit) {
      showToast("Maximum images reached", "error");
      return;
    }
    addUrl(trimmed);
    setPasteUrl("");
    showToast("Image added", "success");
  }, [pasteUrl, atLimit, addUrl, showToast]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "text-[#e63020] border-b-2 border-[#e63020] bg-red-50/30"
                : "text-gray-500 hover:text-[#1c1712] hover:bg-gray-50"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 min-h-[240px]">
        <AnimatePresence mode="wait">
          {/* Upload Tab */}
          {activeTab === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!atLimit) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => {
                  if (!atLimit && !uploading) fileInputRef.current?.click();
                }}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  atLimit
                    ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                    : dragging
                    ? "border-[#e63020] bg-red-50/50"
                    : "border-gray-300 hover:border-[#e63020] hover:bg-red-50/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={atLimit || uploading}
                />

                {uploading ? (
                  <div className="space-y-2">
                    <div className="w-8 h-8 border-2 border-[#e63020] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-[#1c1712] font-medium">
                      Uploading {uploadCount}/{uploadTotal}...
                    </p>
                  </div>
                ) : atLimit ? (
                  <p className="text-sm text-gray-400">
                    Maximum {maxImages} images reached
                  </p>
                ) : (
                  <>
                    <div className="text-3xl text-gray-300 mb-2">↑</div>
                    <p className="text-sm text-[#1c1712] font-medium">
                      Drag & drop images here
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      or click to browse — max 30MB per file
                    </p>
                  </>
                )}
              </div>

              {/* Aspect ratio warnings */}
              {Object.entries(warnings).length > 0 && (
                <div className="mt-3 space-y-1">
                  {Object.entries(warnings).map(([url, warning]) => (
                    <div
                      key={url}
                      className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5"
                    >
                      <span>⚠</span>
                      <span className="truncate max-w-[200px]">
                        {url.split("/").pop()}
                      </span>
                      <span>— {warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Library Tab */}
          {activeTab === "library" && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {libraryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#e63020] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : library.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-12">
                  No images in library
                </p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[320px] overflow-y-auto">
                  {library.map((img) => {
                    const selected = value.includes(img.url);
                    return (
                      <button
                        key={img.url}
                        onClick={() => {
                          if (selected) {
                            removeUrl(img.url);
                          } else if (!atLimit) {
                            addUrl(img.url);
                          } else {
                            showToast("Maximum images reached", "error");
                          }
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selected
                            ? "border-blue-500 ring-2 ring-blue-300"
                            : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        {selected && (
                          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              ✓
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* Paste URL Tab */}
          {activeTab === "url" && (
            <motion.div
              key="url"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex gap-2">
                <input
                  type="url"
                  value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handlePasteAdd();
                  }}
                  placeholder="https://example.com/image.jpg"
                  disabled={atLimit}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg text-[#1c1712] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e63020]/30 focus:border-[#e63020] disabled:bg-gray-50 disabled:text-gray-400"
                />
                <button
                  onClick={handlePasteAdd}
                  disabled={atLimit || !pasteUrl.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#e63020] rounded-lg hover:bg-[#c9281b] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
              {atLimit && (
                <p className="text-xs text-gray-400 mt-2">
                  Maximum {maxImages} images reached
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Section — Selected Images */}
      <div className="border-t border-gray-200 p-4 bg-gray-50/50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500">
            {value.length}/{maxImages} images selected
          </p>
          {value.length > 0 && (
            <button
              onClick={() => {
                onChange([]);
                setWarnings({});
              }}
              className="text-xs text-gray-400 hover:text-[#e63020] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {value.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <AnimatePresence>
              {value.map((url) => (
                <motion.div
                  key={url}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 group"
                >
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeUrl(url)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                  {warnings[url] && (
                    <div className="absolute bottom-0.5 left-0.5 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px]">
                      !
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No images selected</p>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
