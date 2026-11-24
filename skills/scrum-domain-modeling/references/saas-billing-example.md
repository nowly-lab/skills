# SaaS Billing Example

Use this when the user asks about building SaaS billing, subscriptions, plans, payment, usage, invoicing, entitlement, or account lifecycle systems.

## First Pass Domain Events

Candidate events:

- Account created
- Trial started
- Plan selected
- Subscription activated
- Payment method added
- Usage recorded
- Usage limit reached
- Invoice generated
- Payment authorized
- Payment failed
- Subscription renewed
- Subscription canceled
- Access entitlement granted
- Access entitlement revoked
- Refund issued
- Tax calculation completed

## Candidate Commands

- Create account
- Start trial
- Select plan
- Activate subscription
- Add payment method
- Record usage
- Generate invoice
- Charge payment method
- Retry failed payment
- Cancel subscription
- Change plan
- Grant entitlement
- Revoke entitlement

## Likely Bounded Contexts

- **Billing**: invoice, charge, payment status, refunds.
- **Subscription**: plans, renewals, cancellations, trial lifecycle.
- **Entitlement**: access rights derived from subscription/payment state.
- **Usage Metering**: usage events, quotas, aggregation, limit checks.
- **Tax/Compliance**: tax rules, invoice legal requirements, jurisdiction data.
- **Customer Account**: organization/user identity and billing contacts.

Do not merge these contexts only because one database table would be convenient. First ask whether each context has distinct language, rules, experts, external systems, or change cadence.

## People To Involve

- Product owner
- Domain expert for pricing/packaging
- Finance/accounting owner
- Customer support or success owner
- Security/compliance owner
- Engineering owner for identity/account system
- Engineering owner for payment provider integration
- Data/analytics owner for usage and revenue metrics
- Sales/revenue stakeholder for discounts, contracts, and enterprise exceptions

## Scrum Event Plan Example

### Backlog Refinement

Questions:

- What starts a subscription: checkout completion, signed contract, admin approval, or payment success?
- What is the difference between account, customer, tenant, organization, subscription, plan, and entitlement?
- Which events must be auditable?
- Which failures are recoverable: failed payment, payment provider outage, tax service outage, metering delay?
- Which context owns plan changes and proration?
- Which downstream teams consume billing events?

Documents:

- Glossary
- Event and command map
- Context map
- Open questions log

### Sprint Planning

Pick one thin workflow, such as `Activate subscription after successful checkout`.

Define:

- Command: activate subscription
- Inputs: checkout session, customer account, selected plan, payment result
- Dependencies: payment provider, plan catalog, tax/compliance rules, entitlement service
- Output events: subscription activated, entitlement granted, billing account updated
- Invalid paths: payment failed, plan unavailable, customer not verified
- Side effects: confirmation email, audit log, analytics event

Tasks:

- Expert interview for lifecycle and terminology
- Workflow model update
- Context contract sketch
- Acceptance examples
- Implementation spike only if payment provider behavior is unknown

### Daily Scrum

Ask:

- Is payment success enough to activate subscription?
- Did any term change: plan, product, subscription, entitlement?
- Is entitlement synchronous or event-driven?
- Which document needs update from yesterday's expert answer?

### Sprint Review

Validate scenarios:

- New self-serve customer activates paid plan.
- Payment fails during activation.
- Enterprise customer has invoice billing instead of card payment.
- Subscription activation grants only the entitlements included in the selected plan.

### Retrospective

Ask:

- Did finance/support join early enough?
- Did implementation start before lifecycle states were settled?
- Did contracts between billing, subscription, and entitlement remain clear?
