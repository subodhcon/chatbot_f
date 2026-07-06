"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { botService } from "@/services/bot";

export interface BotFormData {
  name: string;
  avatar_url: string | null;
  is_active: boolean;
}

interface BotFormProps {
  initialValues?: BotFormData;
  onSubmit: (data: BotFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}

export default function BotForm({
  initialValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: BotFormProps) {
  const [name, setName] = useState(initialValues?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(initialValues?.avatar_url || "");
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true);

  // Uploading states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Errors state
  const [nameError, setNameError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial values if they change (e.g. edit dialog opens with different bot)
  useEffect(() => {
    if (initialValues) {
      const timer = setTimeout(() => {
        setName(initialValues.name);
        setAvatarUrl(initialValues.avatar_url || "");
        setIsActive(initialValues.is_active);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [initialValues]);

  // Handle Name validation on change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!val.trim()) {
      setNameError("Bot name is required.");
    } else if (val.length > 150) {
      setNameError("Bot name must be under 150 characters.");
    } else {
      setNameError(null);
    }
  };

  // Process and validate image files and upload
  const validateAndProcessFile = async (file: File) => {
    setAvatarError(null);

    // Validate type: strictly PNG and JPG
    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setAvatarError("Invalid file type. Please upload a PNG or JPG/JPEG image.");
      return;
    }

    // Validate size (2MB limit)
    const maxSizeInBytes = 2 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setAvatarError("File size exceeds 2MB limit. Please upload a smaller image.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await botService.uploadAvatar(file, (pct) => {
        setUploadProgress(pct);
      });

      if (res.success && res.data?.avatar_url) {
        setAvatarUrl(res.data.avatar_url);
        setAvatarError(null);
      } else {
        setAvatarError(res.error?.message || "Failed to upload avatar image.");
      }
    } catch {
      setAvatarError("An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndProcessFile(files[0]);
    }
  };

  const removeAvatar = () => {
    setAvatarUrl("");
    setAvatarError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Final checks
    if (!name.trim()) {
      setNameError("Bot name is required.");
      return;
    }

    if (nameError || avatarError) {
      return;
    }

    onSubmit({
      name: name.trim(),
      avatar_url: avatarUrl.trim() || null,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
      {/* Bot Name Input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Bot Name *
        </label>
        <Input
          type="text"
          required
          placeholder="e.g. Support Assistant"
          value={name}
          onChange={handleNameChange}
          className={nameError ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {nameError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {nameError}
          </p>
        )}
      </div>

      {/* Custom Avatar Upload Zone */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Avatar Upload
        </label>

        {avatarUrl ? (
          // Preview state
          <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
            <div className="relative h-16 w-16 shrink-0 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={removeAvatar}
                disabled={isUploading}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-bl p-1 hover:bg-red-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate">
                Avatar Image uploaded
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                PNG or JPG up to 2MB
              </p>
            </div>
          </div>
        ) : (
          // Upload Area state
          <div className="space-y-2">
            <div
              onDragOver={isUploading ? undefined : handleDragOver}
              onDrop={isUploading ? undefined : handleDrop}
              onClick={isUploading ? undefined : () => fileInputRef.current?.click()}
              className={`border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center transition bg-slate-50/20 dark:bg-slate-900/10 flex flex-col items-center justify-center gap-2 group ${
                isUploading
                  ? "cursor-not-allowed opacity-60"
                  : "hover:border-indigo-500 dark:hover:border-indigo-500/50 cursor-pointer"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png"
                disabled={isUploading}
                className="hidden"
              />
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              ) : (
                <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition duration-300" />
              )}
              <p className="text-sm font-semibold text-slate-750 dark:text-slate-300">
                {isUploading ? "Uploading avatar..." : "Drag & drop or click to upload"}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                PNG or JPG (max 2MB)
              </p>
            </div>

            {/* Real-time upload progress bar */}
            {isUploading && uploadProgress !== null && (
              <div className="w-full mt-2 p-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/30 dark:bg-slate-900/20">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Uploading to server...</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-850 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {avatarError && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {avatarError}
          </p>
        )}
      </div>

      {/* Is Active Checkbox */}
      <div className="flex items-center gap-3 py-1">
        <input
          type="checkbox"
          id="bot-form-is-active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          disabled={isUploading}
          className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 accent-indigo-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <label
          htmlFor="bot-form-is-active"
          className="text-sm font-medium text-slate-750 dark:text-slate-300 cursor-pointer select-none"
        >
          Bot is active and ready for deployment
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-900 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading || isUploading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || isUploading || !name.trim() || !!nameError || !!avatarError}
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {(isLoading || isUploading) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
