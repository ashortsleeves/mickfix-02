interface AnalysisResult {
  summary: string
  tools: string[]
  steps: string[]
}

interface AnalysisProps {
  result: AnalysisResult
  imageUrl: string | null
}

const Analysis = ({ result, imageUrl }: AnalysisProps) => {
  return (
    <div className="analysis">
      {imageUrl && (
        <section className="uploaded-image">
          <h2>Uploaded Image</h2>
          <img src={imageUrl} alt="Uploaded repair issue" style={{ maxWidth: '100%', borderRadius: '8px' }} />
        </section>
      )}

      <section className="summary">
        <h2>Analysis Summary</h2>
        <p>{result.summary}</p>
      </section>

      <section className="tools">
        <h2>Recommended Tools</h2>
        <ul>
          {result.tools.map((tool, index) => (
            <li key={index}>{tool}</li>
          ))}
        </ul>
      </section>

      <section className="steps">
        <h2>Step-by-Step Guide</h2>
        <ol>
          {result.steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>
    </div>
  )
}

export default Analysis 