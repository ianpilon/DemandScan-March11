# Jobs To Be Done Primary Goal Analysis Results Design

## Overview
The JTBD Primary Goal Analysis Results page presents a comprehensive analysis of the customer's primary job to be done, extracted from interview transcripts. The design emphasizes clarity, evidence-based insights, and confidence scoring.

## UI Components

### 1. Primary Goal Card
The main card component displaying the core job to be done analysis.

#### Header Section
```jsx
<Card className="p-6">
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Primary Goal</h3>
    // Content sections...
  </div>
</Card>
```

#### Content Structure
- Goal Statement
- Confidence Score Badge
- Supporting Evidence
- Context Information

### 2. Goal Analysis Card

#### Analysis Components
```jsx
<div className="space-y-6">
  {/* Primary Analysis */}
  <Card>
    <CardHeader>
      <CardTitle>Goal Analysis</CardTitle>
    </CardHeader>
    <CardContent>
      // Analysis sections...
    </CardContent>
  </Card>
</div>
```

#### Analysis Sections
1. **Goal Clarity**
   - Clarity Score
   - Confidence Level
   - Supporting Evidence

2. **Goal Context**
   - Situational Factors
   - Environmental Conditions
   - Timing Considerations

3. **Success Criteria**
   - Measurable Outcomes
   - Expected Results
   - Timeline Expectations

### 3. Evidence Display

#### Evidence Card Structure
```jsx
<div className="bg-secondary p-4 rounded-lg">
  <div className="flex justify-between items-start mb-2">
    <h4 className="font-semibold">{evidence.title}</h4>
    <Badge variant={getConfidenceBadgeVariant(evidence.confidence)}>
      {evidence.confidence}% Confidence
    </Badge>
  </div>
  // Evidence content...
</div>
```

#### Evidence Elements
- Direct Quotes
- Context Description
- Relevance Score
- Source Reference

## Visual Styling

### Color System
```css
/* Primary Colors */
.confidence-high { @apply bg-green-500; }
.confidence-medium { @apply bg-yellow-500; }
.confidence-low { @apply bg-red-500; }

/* Background Colors */
.card-bg { @apply bg-card; }
.secondary-bg { @apply bg-secondary; }
```

### Typography Hierarchy
- **Headers**
  - Main Title: text-2xl, font-bold
  - Section Headers: text-lg, font-semibold
  - Subsection Headers: text-base, font-medium

- **Content Text**
  - Primary Text: text-base
  - Supporting Text: text-sm, text-muted-foreground
  - Evidence Quotes: text-sm, italic

### Layout Components
- **Card Structure**
  ```jsx
  <Card className="space-y-6">
    <CardHeader>
      <CardTitle />
      <CardDescription />
    </CardHeader>
    <CardContent />
  </Card>
  ```

### Interactive Elements
- **Confidence Badges**
  ```jsx
  <Badge variant={getConfidenceBadgeVariant(score)}>
    {score}% Confidence
  </Badge>
  ```

- **Evidence Panels**
  ```jsx
  <div className="bg-secondary hover:bg-secondary/80">
    // Evidence content...
  </div>
  ```

## Component Architecture

### Helper Components

#### 1. ConfidenceBadge
```jsx
const getConfidenceBadgeVariant = (score) => {
  if (score >= 80) return "success";
  if (score >= 60) return "warning";
  return "destructive";
};
```

#### 2. EvidencePanel
```jsx
const EvidencePanel = ({ evidence }) => (
  <div className="bg-secondary p-4 rounded-lg">
    <Quote text={evidence.quote} />
    <Context description={evidence.context} />
    <Relevance score={evidence.relevance} />
  </div>
);
```

### Data Structure
```typescript
interface PrimaryGoalAnalysis {
  statement: string;
  confidence: number;
  evidence: Evidence[];
  context: Context;
  successCriteria: SuccessCriteria[];
}

interface Evidence {
  quote: string;
  context: string;
  relevance: number;
  confidence: number;
}
```

## Best Practices

### 1. Information Architecture
- Clear hierarchy of information
- Progressive disclosure of details
- Logical grouping of related data
- Consistent layout patterns

### 2. Visual Feedback
- Clear confidence indicators
- Evidence highlighting
- Context emphasis
- Success criteria visualization

### 3. Accessibility
- Semantic HTML structure
- ARIA labels
- Color contrast compliance
- Keyboard navigation

### 4. Responsive Design
- Mobile-first approach
- Flexible layouts
- Adaptive typography
- Touch-friendly interactions

## Implementation Guidelines

### 1. Component Organization
- Modular structure
- Reusable components
- Clear component hierarchy
- Consistent naming

### 2. State Management
- Clear data flow
- Predictable updates
- Error handling
- Loading states

### 3. Performance
- Efficient rendering
- Optimized images
- Lazy loading
- Caching strategies

### 4. Error Handling
- Graceful fallbacks
- Clear error messages
- Recovery options
- Data validation

## Usage Examples

### 1. Basic Implementation
```jsx
<JTBDPrimaryGoalResults
  analysis={primaryGoalData}
  onEvidenceClick={handleEvidenceClick}
  showConfidence={true}
/>
```

### 2. With Custom Styling
```jsx
<JTBDPrimaryGoalResults
  analysis={primaryGoalData}
  className="custom-theme"
  cardStyle="elevated"
  badgeStyle="minimal"
/>
```

### 3. With Loading State
```jsx
<JTBDPrimaryGoalResults
  analysis={primaryGoalData}
  isLoading={loading}
  loadingFallback={<SkeletonLoader />}
/>
```

## Maintenance

### 1. Code Organization
- Clear file structure
- Consistent formatting
- Comprehensive comments
- Documentation updates

### 2. Testing Strategy
- Unit tests
- Integration tests
- Visual regression tests
- Accessibility tests

### 3. Performance Monitoring
- Load time tracking
- Render performance
- Memory usage
- Error tracking

### 4. Update Process
- Version control
- Change documentation
- Migration guides
- Deprecation notices
