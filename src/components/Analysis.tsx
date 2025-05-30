interface AnalysisResult {
  summary: string
  tools: string[]
  steps: string[]
}

interface AnalysisProps {
  result: AnalysisResult
}

const Analysis = ({ result }: AnalysisProps) => {
  return (
    <div className="analysis">
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