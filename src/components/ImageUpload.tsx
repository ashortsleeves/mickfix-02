import { useRef } from 'react'
import type { ChangeEvent } from 'react'

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isAnalyzing: boolean;
  isAdditional: boolean;
}

const ImageUpload = ({ onImageSelect, isAnalyzing, isAdditional }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      onImageSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleClick = () => {
    if (!isAnalyzing) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div
      className={`upload-container ${isAdditional ? 'additional' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      {isAnalyzing ? (
        <div className="analyzing">
          <div className="spinner"></div>
          <p>Analyzing...</p>
        </div>
      ) : (
        <div className="upload-prompt">
          <div className="upload-icon">{isAdditional ? '➕' : '📸'}</div>
          <p>{isAdditional ? 'Add another image' : 'Click or drag an image here'}</p>
          {!isAdditional && (
            <p className="upload-subtitle">Supported formats: JPG, PNG</p>
          )}
        </div>
      )}
    </div>
  )
}

export default ImageUpload 