# Problem Awareness Matrix Analysis Results Design

## Overview
The Problem Awareness Matrix Analysis Results page presents a comprehensive assessment of the interviewee's understanding and awareness of their problems, challenges, and potential solutions. The design emphasizes clear visualization of awareness dimensions, evidence-based insights, and actionable recommendations.

## UI Components

### 1. Main Matrix Card
Primary container displaying the problem awareness analysis results.

#### Header Section
```jsx
<Card>
  <CardHeader>
    <CardTitle>Problem Awareness Matrix</CardTitle>
  </CardHeader>
  <CardContent>
    // Content sections...
  </CardContent>
</Card>
```

### 2. Problem Understanding Matrix

#### Matrix Item Structure
```jsx
<div className="bg-secondary p-6 rounded-lg">
  <div className="flex justify-between items-start mb-3">
    <h4 className="text-lg font-semibold">{dimension}</h4>
    <Badge variant={getScoreVariant(score)}>{score}%</Badge>
  </div>
  <p className="text-muted-foreground mb-3">{analysis}</p>
  <EvidenceList items={evidence} />
</div>
```

### 3. Dimension Analysis Section

#### Awareness Section Component
```jsx
<div className="bg-secondary p-6 rounded-lg">
  <div className="flex justify-between items-start mb-3">
    <h4 className="text-lg font-semibold">{dimension}</h4>
    <Badge variant={getScoreVariant(score)}>{score}%</Badge>
  </div>
  <StrengthsWeaknessesList 
    strengths={data.strengths}
    weaknesses={data.weaknesses}
  />
</div>
```

### 4. Analysis Summary Section

#### Structure
```jsx
<div className="mt-6 pt-6 border-t">
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Analysis Summary</h3>
    <SummaryText text={summary} />
    <OverallScore score={overallScore} />
    <LimitationsList items={limitations} />
  </div>
</div>
```

## Visual Design System

### 1. Color System
```css
/* Score Colors */
.score-high { @apply bg-green-500 text-white; }
.score-medium { @apply bg-yellow-500 text-black; }
.score-low { @apply bg-red-500 text-white; }

/* Background Colors */
.bg-primary { @apply bg-card; }
.bg-secondary { @apply bg-secondary; }
.bg-highlight { @apply bg-accent; }
```

### 2. Typography Scale
```css
/* Headers */
.header-main { @apply text-2xl font-bold; }
.header-section { @apply text-xl font-semibold; }
.header-subsection { @apply text-lg font-semibold; }

/* Content */
.text-primary { @apply text-base; }
.text-secondary { @apply text-sm text-muted-foreground; }
.text-evidence { @apply text-sm italic; }
```

### 3. Spacing System
```css
/* Vertical Spacing */
.space-sections { @apply space-y-8; }
.space-items { @apply space-y-4; }
.space-content { @apply space-y-2; }

/* Grid Layouts */
.grid-dimensions { @apply grid gap-4; }
.grid-scores { @apply grid grid-cols-1 gap-2; }
```

## Component Architecture

### 1. Data Structures
```typescript
interface ProblemAwarenessMatrix {
  matrix: MatrixItem[];
  dimensions: DimensionAnalysis;
  analysis: AnalysisSummary;
}

interface MatrixItem {
  dimension: string;
  score: number;
  analysis: string;
  evidence: string[];
}

interface DimensionAnalysis {
  problemRecognition: DimensionData;
  impactAwareness: DimensionData;
  solutionKnowledge: DimensionData;
}

interface DimensionData {
  score: number;
  strengths: string[];
  weaknesses: string[];
}
```

### 2. Helper Components

#### ScoreBadge
```jsx
const ScoreBadge = ({ score }) => {
  const variant = getScoreVariant(score);
  return (
    <Badge variant={variant}>
      {score}%
    </Badge>
  );
};
```

#### EvidenceList
```jsx
const EvidenceList = ({ items }) => (
  <div className="space-y-2">
    <h5 className="text-sm font-medium">Evidence:</h5>
    <ul className="list-disc pl-5 space-y-1">
      {items.map((item, index) => (
        <li key={index} className="text-sm text-muted-foreground">
          {item}
        </li>
      ))}
    </ul>
  </div>
);
```

## Implementation Guidelines

### 1. Responsive Design
- Mobile-first approach
- Stackable grid layouts
- Collapsible sections
- Accessible on all devices

### 2. Performance Optimization
- Efficient rendering
- Lazy loading
- Optimized state management
- Minimal re-renders

### 3. Accessibility Features
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

### 4. Error Handling
- Loading states
- Error boundaries
- Fallback content
- Data validation

## Best Practices

### 1. Data Organization
- Clear hierarchy
- Logical grouping
- Progressive disclosure
- Consistent structure

### 2. Visual Feedback
- Clear score indicators
- Evidence highlighting
- Dimension grouping
- Summary emphasis

### 3. Interactive Elements
- Expandable sections
- Tooltip explanations
- Score breakdowns
- Evidence details

### 4. Content Display
- Clear dimension labels
- Concise analysis
- Supporting evidence
- Actionable insights

## Usage Examples

### 1. Basic Implementation
```jsx
<ProblemAwarenessResults
  result={matrixData}
  onDimensionClick={handleDimensionClick}
  showScores={true}
/>
```

### 2. With Custom Styling
```jsx
<ProblemAwarenessResults
  result={matrixData}
  className="custom-theme"
  cardStyle="elevated"
  badgeStyle="minimal"
/>
```

### 3. With Filtering
```jsx
<ProblemAwarenessResults
  result={matrixData}
  filters={{
    minScore: 60,
    dimensions: ['problemRecognition', 'impactAwareness'],
    showEvidence: true
  }}
/>
```

## Maintenance Guidelines

### 1. Code Organization
- Modular structure
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

### Understanding the Scores
- **80-100%**: Deep understanding with clear articulation
  - Multiple clear, direct quotes
  - Consistent patterns
  - Strong emotional/practical motivation
  - Specific metrics/criteria

- **60-79%**: Basic understanding with some gaps
  - Some supporting quotes
  - General patterns
  - Implied motivation
  - General success criteria

- **0-59%**: Limited understanding with significant gaps
  - Limited/indirect references
  - Inconsistent desires
  - Unclear motivation
  - Vague/missing criteria
