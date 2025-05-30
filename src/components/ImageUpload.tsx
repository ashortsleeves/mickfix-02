import { useRef } from 'react'
import type { ChangeEvent } from 'react'

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isAnalyzing: boolean;
  selectedImage: string | null;
}

const ImageUpload = ({ onImageSelect, isAnalyzing, selectedImage }: ImageUploadProps) => {
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
      className={`upload-container ${selectedImage ? 'has-image' : ''}`}
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
          <p>Analyzing your photo...</p>
        </div>
      ) : selectedImage ? (
        <div className="image-preview">
          <img src={selectedImage} alt="Selected repair issue" className="preview-image" />
          <p className="change-image-text">Click or drag to change image</p>
        </div>
      ) : (
        <div className="upload-prompt">
          <div className="upload-icon">📸</div>
          <p>Click or drag an image here</p>
          <p className="upload-subtitle">Supported formats: JPG, PNG</p>
        </div>
      )}
    </div>
  )
}

export default ImageUpload 