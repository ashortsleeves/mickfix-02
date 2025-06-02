import './Analysis.css'
import FollowUpQuestion from './FollowUpQuestion';

interface AnalysisResult {
  summary: string
  tools: string[]
  steps: string[]
  safetyWarnings: {
    hazardousMaterials: string[]
    ageRelated: boolean
    generalWarnings: string[]
  }
  imageDescriptions: string[]
}

interface AnalysisProps {
  result: AnalysisResult
  onFollowUpQuestion: (question: string) => void
  isAnalyzing: boolean
}

const Analysis = ({ result, onFollowUpQuestion, isAnalyzing }: AnalysisProps) => {
  // Ensure all properties have default values
  const {
    summary = '',
    tools = [],
    steps = [],
    // @ts-ignore - Required for follow-up questions but not used in UI
    imageDescriptions = [],
    safetyWarnings = {
      hazardousMaterials: [],
      ageRelated: false,
      generalWarnings: []
    }
  } = result || {};

  return (
    <div className="analysis-container">
      {safetyWarnings && (
        (safetyWarnings.hazardousMaterials?.length > 0 || 
        safetyWarnings.ageRelated || 
        safetyWarnings.generalWarnings?.length > 0) && (
        <div className="safety-warning">
          <div className="warning-content">
            <div className="warning-header">
              <div className="warning-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="warning-body">
                <h3>Safety Warnings</h3>
                <div className="warning-details">
                  {safetyWarnings.ageRelated && (
                    <div className="age-warning">
                      <p>
                        ⚠️ This appears to be a pre-1990 home. Older homes may contain hazardous materials such as lead paint and asbestos. Professional inspection is recommended before proceeding with repairs.
                      </p>
                    </div>
                  )}
                  {safetyWarnings.hazardousMaterials?.length > 0 && (
                    <div className="hazard-list">
                      <p className="hazard-title">Potential hazardous materials detected:</p>
                      <ul>
                        {safetyWarnings.hazardousMaterials.map((material, index) => (
                          <li key={index}>{material}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {safetyWarnings.generalWarnings?.length > 0 && (
                    <div className="general-warnings">
                      <p className="warning-title">Additional safety considerations:</p>
                      <ul>
                        {safetyWarnings.generalWarnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="professional-warning">
                    <p>
                      If hazardous materials are suspected, consult with certified professionals before proceeding with any repairs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="analysis-results">
        <h2>Analysis Results</h2>
        <div className="analysis-section">
          <h3>Summary</h3>
          <p>{summary}</p>
        </div>
        
        <div className="analysis-section">
          <h3>Required Tools</h3>
          {Array.isArray(tools) && tools.length > 0 ? (
            <ul>
              {tools.map((tool, index) => (
                <li key={index}>{tool}</li>
              ))}
            </ul>
          ) : (
            <p>No additional tools required.</p>
          )}
        </div>
        
        <div className="analysis-section">
          <h3>Repair Steps</h3>
          {Array.isArray(steps) && steps.length > 0 ? (
            <ol>
              {steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          ) : (
            <p>No specific steps provided.</p>
          )}
        </div>

        <FollowUpQuestion
          isAnalyzing={isAnalyzing}
          onSubmit={onFollowUpQuestion}
        />
      </div>
    </div>
  )
}

export default Analysis 