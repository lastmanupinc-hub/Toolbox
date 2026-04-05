# CRO Playbook — avery-pay-platform

> Conversion Rate Optimization playbook based on detected routes and architecture

## Core Conversion Events

| Event | Description | Priority |
|-------|------------|----------|
| First Install | User installs/clones for the first time | Critical |
| First Run | User runs the tool successfully | Critical |
| First Value | User generates useful output | High |
| Return Usage | User comes back within 7 days | High |
| Share/Recommend | User shares or recommends | Medium |
| Contribute | User opens issue or PR | Medium |

## Route Optimization Opportunities

Detected routes that are candidates for conversion optimization:

| Route | Method | CRO Action |
|-------|--------|-----------|
| `/` | GET | Monitor usage metrics |
| `/v1/payments` | POST | Track API adoption rate per endpoint |
| `/v1/payouts` | POST | Track API adoption rate per endpoint |
| `/v1/kyc/check` | POST | Track API adoption rate per endpoint |
| `/v1/providers/:name/connect` | POST | Track API adoption rate per endpoint |
| `/v1/webhooks/provider` | POST | Track API adoption rate per endpoint |
| `/v1/admin/metrics` | GET | Track API adoption rate per endpoint |
| `/healthz` | GET | Monitor usage metrics |
| `/v1/payments` | POST | Track API adoption rate per endpoint |
| `/v1/payouts` | POST | Track API adoption rate per endpoint |
| `/v1/kyc/check` | POST | Track API adoption rate per endpoint |
| `/v1/providers/:name/connect` | POST | Track API adoption rate per endpoint |
| `/v1/webhooks/provider` | POST | Track API adoption rate per endpoint |
| `/v1/admin/metrics` | GET | Track API adoption rate per endpoint |
| `/v1/payments` | POST | Track API adoption rate per endpoint |

## Optimization Experiments

### Experiment 1: README Quickstart

- **Hypothesis**: A 3-step quickstart will increase first-run conversion by 20%
- **Metric**: Clone-to-first-run time
- **Variants**:
  - A: Current README quickstart
  - B: Simplified 3-step version with copy-paste commands
- **Duration**: 2 weeks

### Experiment 2: Documentation Structure

- **Hypothesis**: Task-oriented docs will reduce support issues by 30%
- **Metric**: Issue creation rate for "how to" questions
- **Variants**:
  - A: Current documentation structure
  - B: Task-oriented guides ("How to X")
- **Duration**: 4 weeks

### Experiment 3: Onboarding Flow

- **Hypothesis**: Interactive onboarding will increase feature discovery by 40%
- **Metric**: Features used in first session
- **Variants**:
  - A: Static documentation
  - B: Interactive tutorial / playground
- **Duration**: 3 weeks

## Metrics to Track

| Metric | Source | Target |
|--------|--------|--------|
| Install rate | npm/registry analytics | +20% MoM |
| First-run success rate | Telemetry (opt-in) | > 90% |
| Time to first value | Telemetry (opt-in) | < 5 minutes |
| 7-day retention | Telemetry (opt-in) | > 40% |
| GitHub star rate | GitHub API | +10% MoM |
| Issue response time | GitHub API | < 24 hours |
| Documentation bounce rate | Analytics | < 40% |
