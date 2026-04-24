'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  type: 'banner' | 'logo';
  accept?: string;
}

export default function ImageUpload({
  value,
  onChange,
  label,
  type,
  accept = 'image/*',
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isBanner = type === 'banner';
  const aspectRatio = isBanner ? '21/9' : '1/1';
  const maxSizeMB = 5;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError('');

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await processFile(file);
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsLoading(true);
    try {
      // Create preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      onChange(previewUrl);

      // Upload to server
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlInput = (url: string) => {
    onChange(url);
  };

  const handleRemove = () => {
    onChange('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="iu-container">
      <label className="iu-label">
        {label}
        {isBanner && <span className="iu-hint">Recommended: 1920x800px</span>}
        {!isBanner && <span className="iu-hint">Recommended: 512x512px</span>}
      </label>

      {!value ? (
        <div
          className={`iu-dropzone ${isDragging ? 'iu-dropzone-active' : ''} ${isBanner ? 'iu-dropzone-banner' : 'iu-dropzone-logo'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="iu-input-hidden"
          />

          <div className="iu-dropzone-content">
            <div className="iu-dropzone-icon">
              <Upload size={24} />
            </div>
            <p className="iu-dropzone-text">
              Drop your image here or <span className="iu-dropzone-link">browse</span>
            </p>
            <p className="iu-dropzone-hint">PNG, JPG, GIF up to {maxSizeMB}MB</p>
          </div>

          {isLoading && (
            <div className="iu-loading">
              <div className="iu-spinner" />
            </div>
          )}
        </div>
      ) : (
        <div className={`iu-preview ${isBanner ? 'iu-preview-banner' : 'iu-preview-logo'}`}>
          <div className="iu-preview-image" style={{ aspectRatio }}>
            <img src={value} alt={label} />
            <div className="iu-preview-overlay">
              <button
                type="button"
                className="iu-preview-btn"
                onClick={handleRemove}
              >
                <X size={18} />
              </button>
              <button
                type="button"
                className="iu-preview-btn"
                onClick={() => inputRef.current?.click()}
              >
                <ImageIcon size={18} />
              </button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="iu-input-hidden"
          />
        </div>
      )}

      <div className="iu-url-input">
        <input
          type="text"
          className="org-input"
          placeholder="Or paste image URL..."
          value={value.startsWith('blob:') ? '' : value}
          onChange={(e) => handleUrlInput(e.target.value)}
        />
      </div>

      {error && <p className="iu-error">{error}</p>}
    </div>
  );
}
