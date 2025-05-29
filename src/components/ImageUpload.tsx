import { useRef } from 'react'
import type { ChangeEvent } from 'react'

interface ImageUploadProps {
  onUpload: (file: File) => void
  isAnalyzing: boolean
}

const ImageUpload = ({ onUpload, isAnalyzing }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className="upload-container"
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