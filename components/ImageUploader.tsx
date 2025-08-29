
import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  id: string;
  label: string;
  onImageUpload: (file: File) => void;
  file: File | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onImageUpload, file }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((selectedFile: File | null) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      onImageUpload(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [onImageUpload]);

  const onDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    inputRef.current?.click();
  }

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-xl font-semibold mb-4 text-slate-300">{label}</h3>
      <label
        htmlFor={id}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer 
          ${isDragging ? 'border-brand-secondary bg-brand-dark/50' : 'border-slate-600 hover:border-brand-primary bg-slate-800'}`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onInputChange}
        />
        {preview && file ? (
          <div className="w-full h-full relative p-2">
             <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-md" />
          </div>
        ) : (
          <div className="text-center text-slate-500">
            <UploadIcon className="mx-auto mb-2" />
            <p>Drag & drop or <span className="text-brand-primary font-semibold">click to upload</span></p>
          </div>
        )}
      </label>
      {file && <p className="text-sm text-slate-400 mt-2 truncate max-w-full px-2">{file.name}</p>}
    </div>
  );
};
