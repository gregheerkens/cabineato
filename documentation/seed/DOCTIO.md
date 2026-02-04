# **DOCTIO**

*A Protocol for AI-Assisted Software Development*

## **Purpose**

DOCTIO defines a deterministic workflow for building software with AI assistance.
It constrains ambiguity through six sequential stages: Domain, Objects, Code Ethos, Tests, Implementation, Optimization.

Every agent working in this repository must follow DOCTIO unless explicitly instructed otherwise.



## **1. Domain (Design Doc)**

### **Definition**

The Domain describes **what this project is** and **what it is not**.

### **Requirements**

* Clear problem statement
* Project scope and non-goals
* Constraints (platform, tech, policy, performance, etc.)
* High-level architecture
* Unchanging assumptions

### **Agent Rules**

* Treat the Domain as authoritative.
* Reject or flag instructions that violate Domain constraints.
* Never introduce new project goals without explicit user direction.



## **2. Objects (Data Schema)**

### **Definition**

Objects are the canonical entities, models, endpoints, structures, and events used throughout the system.

### **Requirements**

* Data models with fields and types
* Relationships and cardinalities
* API endpoints and payload shapes
* Events, messages, and domain verbs
* State machines where applicable

### **Agent Rules**

* Do not invent new core objects without approval.
* Maintain consistent naming across the entire project.
* Treat Objects as binding contracts.



## **3. Code Ethos (Shape and Style)**

### **Definition**

The Code Ethos defines architectural boundaries, conventions, and style rules.

### **Requirements**

* Layered architecture (if applicable)
* SOLID constraints
* Dependency boundaries
* Error-handling policy
* Logging and observability rules
* Naming conventions
* File and folder structure
* Anti-patterns to avoid

### **Agent Rules**

* Always follow ethos rules unless explicitly overridden.
* Prefer clarity and determinism over cleverness.
* Validate structure against the Ethos during implementation and refactor passes.



## **4. Tests (Deterministic Behavior Specification)**

### **Definition**

Tests encode the system’s intended behavior before implementation.
They define correctness.

### **Requirements**

* Test cases for all functional requirements
* Failure/success criteria
* Edge cases and invariants
* Plain-language comments describing behavior (“what should happen and why”)
* No implementation assumptions baked into tests
* **ABA Triangulation for every test** (see addendum)



## **5. Implementation (Behavior From Intent)**

### **Definition**

Implementation is the code produced only after Domain, Objects, Ethos, and Tests are locked.

### **Requirements**

* Code that satisfies all tests
* Predictable, maintainable structure
* Minimal side effects
* Adherence to Ethos

### **Agent Rules**

* Implement only based on Tests + Domain + Objects + Ethos.
* Do not refactor during initial implementation.
* Ask for clarification when constraints collide.



## **6. Optimization (Refinement After Passing Tests)**

### **Definition**

Optimization is a post-implementation cleanup and refinement pass.

### **Requirements**

* Structural refactor for clarity and correctness
* Dependency cleanup
* Dead code removal
* Performance improvements where safe
* Maintain strict test-passing behavior
* Apply SOLID and architectural principles

### **Agent Rules**

* Do not change functional behavior.
* Re-run tests after each optimization pass.
* Document meaningful refactor decisions when possible.


---
---


## **DOCTIO Hierarchy**

When resolving conflicts, agents must follow this priority order:

1. **Domain**
2. **Objects**
3. **Code Ethos**
4. **Tests**
5. **Implementation**
6. **Optimization**

If two stages conflict, defer to the earlier one and request clarification.



## **Working Rules for AI Agents**

Agents operating in this repo must:

* Follow the DOCTIO stages in order
* Never skip ahead without user approval
* Ask for clarification when encountering contradictions
* Avoid scope expansion or feature invention
* Maintain consistency across all code and documentation
* Treat DOCTIO.md as a permanent baseline unless updated by the user



## **Usage**

Include DOCTIO.md at the project root.
Reference it in agent system prompts for tools like Cursor, GitHub Copilot, Anthropic, or OpenAI ecosystems.

This document governs:

* Project initialization
* Schema evolution
* Test generation
* Code generation and refactoring
* Ongoing agent behavior


---
---


## **Addenda: Operational Principles & Philosophy**

The following principles clarify the intended execution, scope, and philosophy of the DOCTIO protocol in a live development environment.

### **A. On Workflow Scope: The Task-Level Micro-Workflow**

> DOCTIO is not a project-level "waterfall" methodology. It is a **task-level micro-workflow** designed for rapid, session-based execution (e.g., within AI-native IDEs and editors).
>
> The expected cycle time for a single pass (all six stages) is measured in **minutes to low hours**, not weeks or months. The primary goal is to **"fail fast" at the specification level.** By front-loading intent (Stages 1-4), an implementation failure (Stage 5) provides immediate, precise feedback on specification flaws, rather than ambiguous code-level bugs.

### **B. On Contradictions: The Feedback Loop as a Feature**

> A failure in a later stage (e.g., **5. Implementation**) due to a contradiction with an earlier stage (e.g., **2. Objects**) is **not a process failure; it is the intended feedback mechanism.**
>
> This is the "test" of the specification's completeness. The agent is expected to halt and report the conflict (e.g., "Cannot satisfy Test 4.2 as Object 'User' from Stage 2 lacks a 'status' field"). This provides the human architect with an immediate, actionable error message to correct the specification (the earlier stage), rather than debugging flawed, "creative" output.

### **C. On State: Grounding via Durable Artifacts**

> To ensure determinism and combat AI "context drift" or "hallucination," the outputs of Stages 1-4 (Domain, Objects, Ethos, Tests) should be stored as **durable, version-controlled artifacts** (e.g., `.md` or `.json` files) within the project.
>
> AI agents must be instructed to treat these files as the authoritative source of truth *before* every task. This provides two critical benefits:
>
> 1.  **Grounding:** It anchors the AI to the canonical specification, overriding its internal "creative" state.
> 2.  **Deterministic Reset:** When an agent's context becomes polluted, the session can be terminated. A new agent instance, when directed at the same artifact files, will re-ground itself with no loss of determinism. These files act as the "firmware" for the agent.

### **D. On Evolution: The Change Order Process**

> Modifying an existing, DOCTIO-compliant codebase requires a formal "Change Order" process, which is distinct from initial generation.
>
> A Change Order must follow the DOCTIO hierarchy:
>
> 1.  The human architect modifies the relevant specification artifacts (e.g., updates `OBJECTS.md` to add a field or `TESTS.md` to change a behavior).
> 2.  The agent is then instructed to execute the change, *using the updated artifacts as the new source of truth*.
>
> This ensures that all code evolution remains specification-driven and maintains the deterministic link between intent (the artifacts) and implementation (the code).

### **E: On ABA Triangulation: Testing The Tests**

>To support deterministic, self-correcting agent behavior, every test must include **three anchored points** around the same behavior:
>
>1. **A — High Anchor**
>   A boundary or clear upper-limit case.
>2. **B — Expected Behavior**
>   The canonical, intended-case test.
>3. **A′ — Low Anchor**
>   A boundary or clear lower-limit case.
>
>This structure creates a defined “behavior corridor” within which the expected output must fall.

   #### **Purpose**

   >ABA triangulation provides:
   >
   >* A **ceiling** (A)
   >* A **floor** (A′)
   >* The **target** (B)
   >
   >This gives the agent:
   >
   >* Directionality: whether a deviation is “above” or “below” intended behavior
   >* Magnitude: how far the failure is from specification
   >* Certainty: whether the specification or the implementation is at fault
   >* Regression detection: if anchors fail, the behavior definition may be wrong
   >* Drift detection: if only B fails, the spec may require revision

   #### **Agent Rules (ABA-Specific)**

   >When a test fails:
   >
   >* Compare the failing output against A and A′.
   >* Determine whether the error is:
   >
   >  * **High-drift** (overshoot relative to A)
   >  * **Low-drift** (undershoot relative to A′)
   >  * **Spec inconsistency** (anchors pass, B does not)
   >  * **Global drift** (anchors and B all fail)
   >* Report the drift category plainly.
   >* Request clarification when the triangulation suggests spec-level revision.
   >* Do **not** "guess" intended behavior—defer to human authority.

   #### **Why It Matters**

   >ABA triangulation transforms tests from brittle, binary pass/fail checks into:
   >
   >* Behavioral gradients
   >* Deterministic correctness boundaries
   >* Self-debugging mechanisms for AI agents
   >
   >This allows agentic tooling to reason about failures rather than merely report them.
