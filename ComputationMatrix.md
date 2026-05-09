# Computation Matrix: Schedly Agent System

## **1. Schedule State Computation Pipeline**

| Metric | Formula | Description | Example |
|--------|---------|-------------|---------|
| **total_task_hours** | `SUM(task.remaining_hours)` | Sum of all task durations | Tasks: [2h, 3h, 1.5h] = **6.5h** |
| **capacity_hours** | From `schedule_request.available_hours` | User's available time | User has **8 hours** available |
| **overload_hours** | `MAX(0, total_task_hours - capacity_hours)` | Overflow beyond capacity | 6.5h - 8h = **0h** (no overload) |
| **overloaded** | `overload_hours > 0` | Boolean flag | **False** if capacity sufficient |
| **fatigue_score** | Lookup from `fatigue_level` | Normalized fatigue metric | "high" → **0.5** |
| **normalized_energy** | Lookup from `energy_level` | Energy capacity | "high" → **0.9** |
| **effective_energy** | `MAX(0, normalized_energy - fatigue_score)` | Usable energy after fatigue | 0.9 - 0.5 = **0.4** |

---

## **2. Fatigue & Energy Mapping Tables**

### **Fatigue Level Mapping**
| Fatigue Level | Score | Impact |
|----------------|-------|--------|
| low | 0.1 | Minimal fatigue penalty |
| medium | 0.3 | Moderate fatigue impact |
| high | 0.5 | Significant fatigue impact |

### **Energy Level Mapping**
| Energy Level | Normalized Score | Capacity |
|--------------|------------------|----------|
| low | 0.3 | Minimal energy available |
| medium | 0.6 | Moderate energy available |
| high | 0.9 | High energy available |

### **Effective Energy Examples**
| Energy Level | Fatigue Level | Calculation | Effective Energy |
|--------------|----------------|-------------|------------------|
| high | low | 0.9 - 0.1 | **0.8** (optimal) |
| high | high | 0.9 - 0.5 | **0.4** (compromised) |
| medium | high | 0.6 - 0.5 | **0.1** (risky) |
| low | high | 0.3 - 0.5 | **0.0** (depleted) |

---

## **3. Critic's Grounding Rules & Mutations**

| Rule # | Condition | Risk Detected | Mutation Action | Example Reason |
|--------|-----------|---------------|-----------------|----------------|
| **1** | `fatigue_score > 0.7 AND action="proceed" AND energy_required="high"` | User will underperform/crash | **proceed → compress/delay** | "fatigue_score is 0.8, user lacks capacity for high-energy task" |
| **2** | `effective_energy <= 0.1 AND action="proceed" AND remaining_hours >= 3` | Insufficient sustained focus | **proceed → compress** | "effective_energy is 0.2, cannot maintain 3+ hour focus" |
| **3** | `overload_hours > 0 AND action="proceed" AND no compression in plan` | Plan ignores capacity breach | **proceed → compress** | "overload_hours is 2.5, plan doesn't address it" |
| **4** | `constraint_signal="Workload significantly exceeds capacity" AND action="proceed"` | Ignoring hard constraint | **proceed → delay/compress** | "Constraint signal explicitly warns overload" |
| **5** | `action="delay/drop" AND priority_level="high" AND severity="critical"` | Deferring critical task | **delay → compress** OR **drop → miss** | "Task priority is high, severity is critical—cannot drop" |

---

## **4. Plan Types & Strategic Stances**

| Plan Type | Strategy | Risk Tolerance | Key Actions | Use Case |
|-----------|----------|-----------------|-------------|----------|
| **Conservative** | Protect health first | Low | Delay, compress, drop non-critical | User is fatigued, low energy |
| **Balanced** | Mix productivity & health | Medium | Proceed where possible, compress when overloaded | Normal workday |
| **Aggressive** | Maximize output | High | Proceed aggressively, only delay hard blockers | High-priority deadline, user energized |

---

## **5. Valid Actions & Semantics**

| Action | Hours Adjustment | Rescheduling | Best For | Constraint |
|--------|------------------|--------------|----------|-----------|
| **proceed** | None (original) | None | Tasks within capacity | Must have sufficient energy |
| **compress** | Reduce to `new_hours` | Same day | Overloaded tasks | `new_hours < remaining_hours` |
| **delay** | None (original) | Later day/week | Non-urgent tasks | Cannot use if deadline critical |
| **drop** | Remove entirely | N/A | Low-priority tasks | Risk: task not completed |
| **miss** | Remove, no reschedule | N/A | Impossible tasks | Explicit acknowledgment of failure |
| **outsource** | Remove from user | Delegate | Learnable/delegable tasks | External resource availability |

---

## **6. Validation Checkpoint Rules**

| Validation Step | Check | Pass Condition | Fail Action |
|-----------------|-------|----------------|-------------|
| **Plan Completeness** | All 3 plan types present | {conservative, balanced, aggressive} exist | Flag missing plan type |
| **Task ID Validity** | Action references existing task | `task_id ∈ TASKS.ids` | Flag phantom task_id |
| **Compress Format** | Compress action has duration | `action="compress" → new_hours exists` | Flag missing new_hours |
| **Hours Validity** | New compressed hours valid | `0 < new_hours < remaining_hours` | Flag invalid range |
| **Mutation Consistency** | Critique matches plan structure | All mutations have corresponding tasks | Flag orphaned mutations |

---

## **7. Critique Output Structure**

| Field | Type | Content | Example |
|-------|------|---------|---------|
| **plan_type** | string | Plan being critiqued | "conservative" |
| **overall_critique** | string | 1-sentence verdict with metrics | "Plan delays all non-urgent tasks appropriately given fatigue_score=0.6" |
| **mutations** | array | List of action changes | `[{task_id: 5, original: "proceed", mutated: "compress", new_hours: 1.5, reason: "..."}]` |
| **unchanged** | array | Task IDs not mutated | `[1, 3, 8]` |

---

## **Key Insight: The Computation Flow**

```
USER STATE (fatigue, energy)
         ↓
    COMPUTE SCHEDULE STATE
         ↓
    fatigue_score, effective_energy
         ↓
AGENT 1 (Planner) generates 3 plans
         ↓
AGENT 2 (Critic) checks grounding rules
         ↓
    if rule fires → mutation
    if not → unchanged
         ↓
    MUTATED PLANS (6 total: 3 original + 3 critiqued)
```

---

## **Decision Matrix: When to Use Each Action**

| Scenario | Effective Energy | Overloaded | Recommendation | Action |
|----------|-----------------|-----------|-----------------|--------|
| High energy, no overload | **0.8+** | No | Execute all tasks | proceed |
| High energy, overloaded | **0.8+** | Yes | Compress non-critical | compress |
| Low energy, no overload | **0.1-0.4** | No | Proceed with care | proceed / compress |
| Low energy, overloaded | **0.1-0.4** | Yes | Defer or drop low-priority | delay / drop |
| Depleted (no energy) | **0.0** | Any | Miss or outsource | miss / outsource |

---

*This matrix enables efficient communication of reasoning, debugging of rule triggers, and transparent decision-making across the three-agent planning system.*
