import React from 'react';

interface DescriptionInputProps {
  description: string;
  onChange: (description: string) => void;
  isAnalyzing: boolean;
}

const DescriptionInput: React.FC<DescriptionInputProps> = ({
  description,
  onChange,
  isAnalyzing
}) => {
  return (
    <div className="description-input">
      <textarea
        placeholder="Describe the repair issue or what you already know about it... (optional)"
        value={description}
        onChange={(e) => onChange(e.target.value)}
        disabled={isAnalyzing}
        rows={4}
        className="description-textarea"
      />
    </div>
  );
};

export default DescriptionInput; 