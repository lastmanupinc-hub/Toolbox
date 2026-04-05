# Funnel Map — avery-pay-platform

> User acquisition funnel from awareness to advocacy

## 1. Awareness

**Goal**: Get the project in front of the target audience

### Touchpoints
- GitHub repository discovery (search, trending, explore)
- Technical blog posts and tutorials
- Social media mentions and threads
- Conference talks and meetup presentations
- Package registry listing (npm, PyPI, etc.)

### Metrics
- GitHub stars and forks
- Website/README page views
- Social media impressions

## 2. Interest

**Goal**: Convert awareness into active evaluation

### Touchpoints
- README quickstart section
- Documentation site / API reference
- Demo or playground environment
- Getting started guide

### Content Needs
- Quickstart showing core entry points: `src/index.ts`
- Architecture overview explaining design decisions
- Comparison table vs alternatives

### Metrics
- README read-through rate
- Documentation page views and time-on-page
- Clones and installs

## 3. Decision

**Goal**: Move from evaluation to first real usage

### Blockers to Address
- Clear installation instructions
- Minimum viable example that proves value in < 5 minutes
- Known limitations documented honestly
- Current known issues:
  - No CI/CD pipeline detected
  - No lockfile found — dependency versions may be inconsistent

### Metrics
- First install to first successful run time
- Drop-off rate during onboarding
- Issue creation rate (signal of engagement)

## 4. Activation

**Goal**: User completes a meaningful action and sees value

### Key Activation Moments
- Uses **go-backend/ (project_directory)** successfully for the first time
- Uses **frontend/ (project_directory)** successfully for the first time
- Uses **trust-fabric-frontend/ (project_directory)** successfully for the first time

### Metrics
- Feature usage depth (which features are used first)
- Return usage within 7 days
- Custom output generation (for generator tools)

## 5. Advocacy

**Goal**: Turn users into promoters

### Triggers
- User shares on social media
- User opens a PR or contributes
- User creates content (blog post, video, tutorial)
- User recommends to team/peers

### Metrics
- Contributor count
- User-generated content pieces
- Referral installs
- NPS score
