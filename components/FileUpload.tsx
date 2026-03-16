'use client'

import { useState, useRef, useCallback } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  label?: string
}

export default function FileUpload({
  onFileSelect,
  accept = '.pdf,.txt,.tex',
  label = 'Upload your resume',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      setSelectedFile(file)
      onFileSelect(file)
    },
    [onFileSelect]
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label} <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
      </label>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className="relative flex flex-col items-center justify-center gap-2 rounded-xl cursor-pointer transition-all"
        style={{
          minHeight: '100px',
          border: `1.5px dashed ${isDragging ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: isDragging ? 'var(--accent-muted)' : 'var(--bg-tertiary)',
          padding: '24px',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={onInputChange}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--success-dim)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 4" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {selectedFile.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatSize(selectedFile.size)} · Click to change
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--bg-card)' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 10V3M5 6l3-3 3 3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Drop your resume here, or <span style={{ color: 'var(--accent-bright)' }}>browse</span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                PDF, TXT, or LaTeX
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
