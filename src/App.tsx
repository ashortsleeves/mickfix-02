import { useState } from 'react'
import './App.css'
import ImageUpload from './components/ImageUpload'
import Analysis from './components/Analysis'
import Header from './components/Header'
import DescriptionInput from './components/DescriptionInput'

interface AnalysisResult {
  summary: string;
  tools: string[];
  steps: string[];
  safetyWarnings: {
    hazardousMaterials: string[];
    ageRelated: boolean;
    generalWarnings: string[];
  };
}

interface ImageData {
  url: string;
  file: File;
}

// Function to compress image
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions (max 800px width/height while maintaining aspect ratio)
        let width = img.width;
        let height = img.height;
        const maxSize = 800;
        
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 0.8 quality
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
  });
};

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<ImageData[]>([])
  const [description, setDescription] = useState('')

  const handleImageSelect = async (file: File) => {
    try {
      const compressedImage = await compressImage(file);
      setImages(prev => [...prev, { url: compressedImage, file }]);
      setError(null);
      setAnalysisResult(null);
    } catch (error) {
      console.error('Error handling image:', error);
      setError('Failed to process image. Please try again.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: images.map(img => img.url),
          description: description.trim() || undefined
        })
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Response was not JSON:', text);
          throw new Error(`Server error: ${text}`);
        }
      }

      if (!response.ok) {
        throw new Error(
          `API Error: ${data.error || data.details || response.statusText}`
        );
      }

      if (!data.summary || !data.tools || !data.steps) {
        throw new Error('Invalid response format from API');
      }

      setAnalysisResult(data);
    } catch (error) {
      console.error('Error analyzing image:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app">
      <Header />
      <main>
        <div className="upload-section">
          <div className="images-grid">
            {images.map((image, index) => (
              <div key={index} className="image-container">
                <img 
                  src={image.url} 
                  alt={`Repair issue ${index + 1}`} 
                  className="preview-image"
                />
                <button 
                  className="remove-image-button"
                  onClick={() => handleRemoveImage(index)}
                  disabled={isAnalyzing}
                >
                  ✕
                </button>
              </div>
            ))}
            <ImageUpload 
              onImageSelect={handleImageSelect}
              isAnalyzing={isAnalyzing}
              isAdditional={images.length > 0}
            />
          </div>
          {images.length > 0 && (
            <>
              <DescriptionInput
                description={description}
                onChange={setDescription}
                isAnalyzing={isAnalyzing}
              />
              <button 
                className="analyze-button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Repair'}
              </button>
            </>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}
        {analysisResult && <Analysis result={analysisResult} />}
      </main>
    </div>
  )
}

export default App
