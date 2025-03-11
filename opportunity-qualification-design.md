# Opportunity Qualification Results Design

## Overview
The Opportunity Qualification Results page presents a comprehensive assessment of sales opportunities based on three key dimensions: Problem Experience, Active Search, and Problem Fit. The design emphasizes clear scoring visualization, confidence metrics, and detailed analysis of each qualification dimension.

## UI Components

### 1. Main Analysis Card
Primary container displaying the complete qualification analysis.

#### Header Section
```jsx
<Card>
  <CardHeader>
    <CardTitle>Opportunity Qualification Analysis</CardTitle>
  </CardHeader>
  <CardContent>
    // Content sections...
  </CardContent>
</Card>
```

### 2. Overall Assessment Section

#### Structure
```jsx
<div>
  <h3 className="text-lg font-semibold mb-2">
    Overall Assessment: {assessment}
  </h3>
  <p className="text-sm text-muted-foreground">
    {summary}
  </p>
</div>
```

### 3. Qualification Scores Grid

#### Structure
```jsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {dimensions.map(dimension => (
    <QualificationScore
      title={dimension.title}
      score={dimension.score}
      confidence={dimension.confidence}
    />
  ))}
</div>
```

#### Score Component
```jsx
<div className="space-y-2">
  <h4 className="font-medium">{title}</h4>
  <div className="flex items-center gap-2">
    <span className={getScoreColorClass(score)}>
      {score}/5
    </span>
    <span className="text-sm text-muted-foreground">
      Confidence: {confidence}%
    </span>
  </div>
</div>
```

### 4. Detailed Analysis Section

#### Structure
```jsx
<div className="space-y-6">
  {dimensions.map(dimension => (
    <DimensionAnalysis
      title={dimension.title}
      analysis={dimension.analysis}
      evidence={dimension.evidence}
    />
  ))}
</div>
```

## Visual Design System

### 1. Color System
```css
/* Score Colors */
.score-high { @apply text-green-500; }
.score-medium { @apply text-orange-500; }
.score-low { @apply text-red-500; }

/* Background Colors */
.bg-primary { @apply bg-card; }
.bg-secondary { @apply bg-secondary; }
.bg-highlight { @apply bg-accent; }

/* Text Colors */
.text-primary { @apply text-foreground; }
.text-secondary { @apply text-muted-foreground; }
.text-highlight { @apply text-accent-foreground; }
```

### 2. Typography Scale
```css
/* Headers */
.header-main { @apply text-2xl font-bold; }
.header-section { @apply text-lg font-semibold; }
.header-dimension { @apply font-medium; }

/* Content */
.text-primary { @apply text-base; }
.text-secondary { @apply text-sm text-muted-foreground; }
.text-evidence { @apply text-sm italic; }
```

### 3. Spacing System
```css
/* Vertical Spacing */
.space-sections { @apply space-y-6; }
.space-items { @apply space-y-4; }
.space-content { @apply space-y-2; }

/* Grid Layouts */
.grid-scores { @apply grid grid-cols-1 md:grid-cols-3 gap-4; }
.grid-analysis { @apply grid grid-cols-1 gap-6; }
```

## Component Architecture

### 1. Data Structures
```typescript
interface OpportunityQualification {
  overallAssessment: 'Fully Qualified' | 'Partially Qualified' | 'Not Qualified';
  summary: string;
  scores: {
    problemExperience: DimensionScore;
    activeSearch: DimensionScore;
    problemFit: DimensionScore;
  };
  recommendations: string[];
  redFlags: string[];
}

interface DimensionScore {
  score: number;
  confidence: number;
  analysis: string;
  evidence: string[];
}
```

### 2. Helper Components

#### ScoreDisplay
```jsx
const ScoreDisplay = ({ score, confidence }) => {
  const colorClass = getScoreColorClass(score);
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xl font-bold ${colorClass}`}>
        {score}/5
      </span>
      <ConfidenceBadge score={confidence} />
    </div>
  );
};
```

#### EvidenceList
```jsx
const EvidenceList = ({ items }) => (
  <div className="space-y-1">
    {items.map((item, index) => (
      <div key={index} className="text-sm">
        <span className="font-medium">Evidence {index + 1}:</span>
        <p className="text-muted-foreground">{item}</p>
      </div>
    ))}
  </div>
);
```

## Implementation Guidelines

### 1. Responsive Design
- Mobile-first approach
- Stacked grid on small screens
- Flexible card layouts
- Touch-friendly elements

### 2. Performance Optimization
- Efficient rendering
- Lazy loading
- Minimal re-renders
- Optimized state management

### 3. Accessibility Features
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

### 4. Error Handling
- Invalid data structure
- Missing scores
- Loading states
- Error boundaries

## Best Practices

### 1. Data Organization
- Clear hierarchy
- Logical grouping
- Progressive disclosure
- Consistent structure

### 2. Visual Feedback
- Clear score indicators
- Evidence highlighting
- Confidence display
- Warning indicators

### 3. Interactive Elements
- Expandable evidence
- Tooltip explanations
- Score breakdowns
- Context expansion

### 4. Content Display
- Clear assessments
- Supporting evidence
- Confidence context
- Action items

## Usage Examples

### 1. Basic Implementation
```jsx
<OpportunityQualificationResults
  analysis={qualificationData}
  onScoreClick={handleScoreClick}
  showConfidence={true}
/>
```

### 2. With Custom Styling
```jsx
<OpportunityQualificationResults
  analysis={qualificationData}
  className="custom-theme"
  cardStyle="elevated"
  scoreStyle="minimal"
/>
```

### 3. With Filtering
```jsx
<OpportunityQualificationResults
  analysis={qualificationData}
  filters={{
    minScore: 3,
    minConfidence: 70,
    showEvidence: true
  }}
/>
```

## Maintenance Guidelines

### 1. Code Organization
- Modular components
- Clear documentation
- Consistent naming
- Type definitions

### 2. Testing Strategy
- Unit tests
- Integration tests
- Visual regression
- Accessibility tests

### 3. Performance Monitoring
- Load time tracking
- Interaction metrics
- Error logging
- Usage analytics

### 4. Update Process
- Version control
- Change documentation
- Migration guides
- Deprecation notices

## Score Interpretation Guide

### Understanding Scores
- **5/5**: Exceptional Match
  - Clear problem experience
  - Active solution search
  - Perfect problem-solution fit
  - High confidence indicators

- **4/5**: Strong Match
  - Significant problem impact
  - Defined search criteria
  - Good problem-solution fit
  - Multiple supporting indicators

- **3/5**: Moderate Match
  - Moderate problem impact
  - Early search phase
  - Potential solution fit
  - Some supporting indicators

- **2/5**: Weak Match
  - Limited problem impact
  - No active search
  - Unclear solution fit
  - Few supporting indicators

- **1/5**: Poor Match
  - No clear problem
  - No search intent
  - Misaligned solution
  - No supporting indicators
