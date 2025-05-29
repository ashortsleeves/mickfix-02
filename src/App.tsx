import { useState } from 'react'
import './App.css'
import ImageUpload from './components/ImageUpload'
import Analysis from './components/Analysis'
import Header from './components/Header'

interface AnalysisResult {
  summary: string;
  tools: string[];
  steps: string[];
}

interface ErrorResponse {
  error: string;
  details?: string;
  type?: string;
}

function App() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = async (file: File) => {
    setIsAnalyzing(true)
    setError(null)
    
    try {
      // Convert the image to base64
      const reader = new FileReader()
      reader.readAsDataURL(file)
      
      reader.onload = async () => {
        const base64Image = reader.result as string
        
        try {
          const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Image
            })
          })

          const data = await response.json()

          if (!response.ok) {
            const errorData = data as ErrorResponse
            throw new Error(
              `API Error: ${errorData.error}${errorData.details ? ` - ${errorData.details}` : ''}`
            )
          }

          setAnalysisResult(data)
        } catch (error) {
          console.error('Error analyzing image:', error)
          setError(error instanceof Error ? error.message : 'Failed to analyze image. Please try again.')
        } finally {
          setIsAnalyzing(false)
        }
      }

      reader.onerror = () => {
        setError('Failed to read image file. Please try again.')
        setIsAnalyzing(false)
      }
    } catch (error) {
      console.error('Error handling image:', error)
      setError('Failed to process image. Please try again.')
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="app">
      <Header />
      <main>
        <ImageUpload onUpload={handleImageUpload} isAnalyzing={isAnalyzing} />
        {error && <div className="error-message">{error}</div>}
        {analysisResult && <Analysis result={analysisResult} />}
      </main>
    </div>
  )
}

export default App
