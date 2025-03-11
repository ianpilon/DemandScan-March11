# Needs Analysis Results Design

## Overview
The Needs Analysis Results page presents a comprehensive analysis of both immediate and latent needs identified from customer interviews. The design emphasizes clear categorization, evidence-based insights, and confidence scoring to help understand both explicit and implicit customer needs.

## UI Components

### 1. Main Analysis Card
Primary container displaying the complete needs analysis.

#### Header Section
```jsx
<Card>
  <CardHeader>
    <CardTitle>Needs Analysis</CardTitle>
    <CardDescription>
      Immediate and latent needs identified from the interview
    </CardDescription>
  </CardHeader>
  <CardContent>
    // Content sections...
  </CardContent>
</Card>
```

### 2. Immediate Needs Section

#### Structure
```jsx
<div>
  <h3 className="text-xl font-semibold mb-4">Immediate Needs</h3>
  <div className="space-y-4">
    {immediateNeeds.map(need => (
      <ImmediateNeedCard
        need={need.need}
        urgency={need.urgency}
        context={need.context}
        evidence={need.evidence}
      />
    ))}
  </div>
</div>
```

#### Need Card Component
```jsx
<div className="bg-secondary p-6 rounded-lg">
  <div className="flex justify-between items-start mb-3">
    <div>
      <h4 className="font-medium">{need}</h4>
      <UrgencyBadge level={urgency} />
    </div>
  </div>
  <ContextText text={context} />
  <EvidenceSection evidence={evidence} />
</div>
```

### 3. Latent Needs Section

#### Structure
```jsx
<div>
  <h3 className="text-xl font-semibold mb-4">Latent Needs</h3>
  <div className="space-y-4">
    {latentNeeds.map(need => (
      <LatentNeedCard
        need={need.need}
        confidence={need.confidence}
        rationale={need.rationale}
        evidence={need.evidence}
      />
    ))}
  </div>
</div>
```

### 4. Additional Insights Section

#### Structure
```jsx
<div>
  <h3 className="text-xl font-semibold mb-4">Additional Insights</h3>
  <div className="bg-secondary p-6 rounded-lg">
    <InsightText text={insights} />
  </div>
</div>
```

## Visual Design System

### 1. Color System
```css
/* Urgency Colors */
.urgency-critical { @apply bg-red-500 text-white; }
.urgency-high { @apply bg-orange-500 text-white; }
.urgency-medium { @apply bg-yellow-500 text-black; }
.urgency-low { @apply bg-blue-500 text-white; }

/* Confidence Colors */
.confidence-high { @apply bg-green-500 text-white; }
.confidence-medium { @apply bg-yellow-500 text-black; }
.confidence-low { @apply bg-red-500 text-white; }

/* Background Colors */
.bg-primary { @apply bg-card; }
.bg-secondary { @apply bg-secondary; }
```

### 2. Typography Scale
```css
/* Headers */
.header-main { @apply text-2xl font-bold; }
.header-section { @apply text-xl font-semibold; }
.header-card { @apply text-lg font-medium; }

/* Content */
.text-primary { @apply text-base; }
.text-secondary { @apply text-sm text-muted-foreground; }
.text-evidence { @apply text-sm italic; }
```

### 3. Spacing System
```css
/* Vertical Spacing */
.space-sections { @apply space-y-8; }
.space-cards { @apply space-y-4; }
.space-content { @apply space-y-2; }

/* Card Padding */
.padding-card { @apply p-6; }
.padding-content { @apply p-4; }
```

## Component Architecture

### 1. Data Structures
```typescript
interface NeedsAnalysis {
  immediateNeeds: ImmediateNeed[];
  latentNeeds: LatentNeed[];
  insights?: string;
}

interface ImmediateNeed {
  need: string;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  context?: string;
  evidence: string;
}

interface LatentNeed {
  need: string;
  confidence: number;
  rationale: string;
  evidence: string;
}
```

### 2. Helper Components

#### UrgencyBadge
```jsx
const UrgencyBadge = ({ level }) => {
  const variant = getUrgencyVariant(level);
  return (
    <Badge variant={variant} className="mt-1">
      {level} Urgency
    </Badge>
  );
};
```

#### ConfidenceBadge
```jsx
const ConfidenceBadge = ({ score }) => {
  const variant = getConfidenceBadgeVariant(score);
  return (
    <Badge variant={variant} className="mt-1">
      {score}% Confidence
    </Badge>
  );
};
```

## Implementation Guidelines

### 1. Responsive Design
- Mobile-first approach
- Flexible card layouts
- Collapsible sections
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
- Missing fields
- Loading states
- Error boundaries

## Best Practices

### 1. Data Organization
- Clear categorization
- Logical grouping
- Progressive disclosure
- Consistent structure

### 2. Visual Hierarchy
- Distinct sections
- Clear priorities
- Evidence emphasis
- Confidence indicators

### 3. Interactive Elements
- Expandable evidence
- Tooltip explanations
- Confidence details
- Context expansion

### 4. Content Display
- Clear need statements
- Supporting context
- Evidence quotes
- Confidence rationale

## Usage Examples

### 1. Basic Implementation
```jsx
<NeedsAnalysisResults
  analysis={needsData}
  onNeedClick={handleNeedClick}
  showConfidence={true}
/>
```

### 2. With Custom Styling
```jsx
<NeedsAnalysisResults
  analysis={needsData}
  className="custom-theme"
  cardStyle="elevated"
  badgeStyle="minimal"
/>
```

### 3. With Filtering
```jsx
<NeedsAnalysisResults
  analysis={needsData}
  filters={{
    minConfidence: 70,
    urgencyLevels: ['Critical', 'High'],
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

## Urgency Level Guide

### Understanding Urgency Levels
- **Critical**: Immediate action required
  - Blocking issues
  - Revenue impact
  - Customer satisfaction at risk
  - Compliance requirements

- **High**: Action needed soon
  - Important business processes affected
  - Significant efficiency loss
  - Customer experience impact
  - Growth limitations

- **Medium**: Action beneficial
  - Process improvements
  - Efficiency opportunities
  - Feature requests
  - Quality enhancements

- **Low**: Action optional
  - Nice-to-have features
  - Minor improvements
  - Future considerations
  - Alternative solutions exist
