# Simulation Matrix: Layer 4 Plan Scorer

## **1. Action Impact on Effective Hours**

| Action | Hours Added | Fatigue Contribution | High Energy Risk | Notes |
|--------|------------|----------------------|------------------|-------|
| **proceed** | `task.remaining_hours` (full) | Yes, if high energy + fatigue > 0.6 | +1 if conditions met | Full commitment |
| **compress** | `action.new_hours` (reduced) | Yes, if high energy + fatigue > 0.6 | +1 if conditions met | User-specified reduction |
| **delay** | `0` | No | 0 | Deferred to later |
| **drop** | `0` | No | 0 | Removed entirely |
| **miss** | `0` | No | 0 | Explicit non-completion |
| **outsource** | `0` | No | 0 | Delegated externally |

---

## **2. Energy Drain Calculation**

| Effective Energy | Energy Drain Factor | Interpretation |
|------------------|-------------------|-----------------|
| 0.9 (high) | `1 - 0.9` = **0.1** | 10% fatigue per hour worked (best) |
| 0.6 (medium) | `1 - 0.6` = **0.4** | 40% fatigue per hour worked |
| 0.3 (low) | `1 - 0.3` = **0.7** | 70% fatigue per hour worked |
| 0.0 (depleted) | `1 - 0.0` = **1.0** | 100% fatigue per hour worked (worst) |

**Insight:** Higher effective_energy → lower drain factor → slower fatigue accumulation (inverse relationship)

---

## **3. High Energy Risk Detection**

| Condition | Risk Flag | When Triggered | Impact on Stability |
|-----------|-----------|-----------------|------------------|
| `energy_required == "high"` | False | Task requires low/medium energy | No stability penalty |
| `fatigue_score <= 0.6` | False | User has adequate fatigue headroom | No stability penalty |
| `energy_required == "high" AND fatigue_score > 0.6` | **True** (+1 to counter) | High energy + User fatigued | Reduced stability |
| Multiple high-risk actions | **Multiple +1** | Multiple risky combinations | Cumulative stability loss |

---

## **4. Core Metrics Computation**

| Metric | Formula | Range | Weight | Interpretation |
|--------|---------|-------|--------|-----------------|
| **completion_rate** | `MIN(effective_hours / total_task_hours, 1.0)` | [0, 1] | 35% | Productivity: How much work gets done |
| **fatigue_end** | `MIN(fatigue_score + (effective_hours × energy_drain_factor / capacity_hours), 1.0)` | [0, 1] | 30% (inverted) | Health: User's fatigue level by day's end |
| **overload_delta** | `(capacity_hours - effective_hours) / capacity_hours` | [-1, 1] | 20% | Capacity: Breathing room or pressure |
| **stability** | `1 - (high_energy_risk / total_actions)` | [0, 1] | 15% | Resilience: Protection against risky combos |

---

## **5. Composite Score Calculation**

```
SCORE = (completion_rate × 0.35) 
      + ((1 - fatigue_end) × 0.30)
      + (overload_delta × 0.20)
      + (stability × 0.15)

Range: [0, 1] where 1.0 = perfect plan
```

### **Weighting Strategy**
- **35% Productivity** — Most important: get things done
- **30% Health** — Critical: prevent burnout (inverted: higher is better)
- **20% Capacity** — Important: maintain breathing room
- **15% Stability** — Protective: avoid risky high-energy combos

---

## **6. Scoring Scenarios (Recalculated with Correct Formula)**

| Scenario | Completion | Fatigue End | Overload Delta | Stability | Score | Verdict |
|----------|-----------|------------|----------------|-----------|-------|---------|
| **Aggressive Success** | 0.95 | 0.49 | 0.05 | 0.70 | `(0.95×0.35) + (0.51×0.30) + (0.05×0.20) + (0.70×0.15)` = **0.602** | High output, moderate fatigue |
| **Conservative Safe** | 0.60 | 0.42 | 0.65 | 0.98 | `(0.60×0.35) + (0.58×0.30) + (0.65×0.20) + (0.98×0.15)` = **0.661** | Protected health, breathing room |
| **Balanced Optimal** | 0.80 | 0.67 | 0.20 | 0.82 | `(0.80×0.35) + (0.33×0.30) + (0.20×0.20) + (0.82×0.15)` = **0.542** | Good balance, some pressure |
| **Risky Overload** | 0.90 | 1.00 | 0.10 | 0.40 | `(0.90×0.35) + (0.00×0.30) + (0.10×0.20) + (0.40×0.15)` = **0.395** | Burnout risk, unsustainable |
| **Mild Underload** | 0.40 | 0.28 | 0.60 | 1.00 | `(0.40×0.35) + (0.72×0.30) + (0.60×0.20) + (1.00×0.15)` = **0.626** | Low output, user protected |

---

## **7. Overload Delta Interpretation**

| Overload Delta | Value Range | Meaning | Pressure Level |
|----------------|-------------|---------|-----------------|
| **Positive (+)** | 0 to 1 | `capacity > effective_hours` | ✅ Breathing room exists |
| **Zero (0)** | Exactly 0 | `capacity = effective_hours` | ⚪ Perfect fit, no slack |
| **Negative (-)** | -1 to 0 | `capacity < effective_hours` | ⚠️ Overload/pressure |

### **Examples**
| Capacity | Effective Hours | Delta | Interpretation |
|----------|-----------------|-------|-----------------|
| 8 hours | 6 hours | `(8-6)/8` = **+0.25** | 25% of capacity remains |
| 8 hours | 8 hours | `(8-8)/8` = **0.0** | At full capacity |
| 8 hours | 10 hours | `(8-10)/8` = **-0.25** | 25% overloaded |

---

## **8. Fatigue End Calculation Flow**

```
EXAMPLE: Conservative plan with moderate user state

START STATE:
  fatigue_score = 0.3 (user moderately fatigued)
  effective_energy = 0.6 (medium energy available)
  total_task_hours = 8 (tasks total 8 hours)
  capacity_hours = 8 (user available 8 hours)

PLAN EXECUTION:
  effective_hours = 5 (plan only commits 5 of 8 available hours)

CALCULATION:
  energy_drain_factor = 1 - effective_energy = 1 - 0.6 = 0.4
  
  fatigue_increment = (effective_hours × energy_drain_factor) / capacity_hours
  fatigue_increment = (5 × 0.4) / 8 = 2.0 / 8 = 0.25
  
  fatigue_end = MIN(fatigue_score + fatigue_increment, 1.0)
  fatigue_end = MIN(0.3 + 0.25, 1.0) = MIN(0.55, 1.0) = 0.55

RESULT: User ends day at 0.55 fatigue (moderately tired, but manageable)
```

---

## **9. Stability Risk Assessment**

| Total Actions | High-Risk Actions | Stability | Risk Level |
|----------------|-----------------|-----------|-----------|
| 5 | 0 | `1 - 0/5` = **1.0** | ✅ Safe |
| 5 | 1 | `1 - 1/5` = **0.8** | ⚠️ Minor risk |
| 5 | 2 | `1 - 2/5` = **0.6** | ⚠️ Moderate risk |
| 5 | 3 | `1 - 3/5` = **0.4** | ⚠️ High risk |
| 5 | 5 | `1 - 5/5` = **0.0** | 🔴 Critical risk |

---

## **10. Plan Comparison Matrix**

| Plan Type | Strategy | Expected Completion | Expected Fatigue | Expected Stability | Typical Score Range |
|-----------|----------|---------------------|------------------|------------------|------------------|
| **Conservative** | Protect health | 50-65% | 20-40% | 0.90+ | **0.55-0.70** |
| **Balanced** | Mix health & output | 70-85% | 45-65% | 0.70-0.85 | **0.60-0.75** |
| **Aggressive** | Maximize output | 85-95% | 70-90% | 0.50-0.70 | **0.55-0.70** |
| **Conservative Mutated** | Health + Critique | 45-60% | 25-45% | 0.95+ | **0.50-0.65** |
| **Balanced Mutated** | Output + Critique | 65-80% | 50-70% | 0.75-0.90 | **0.55-0.70** |
| **Aggressive Mutated** | Output + Safety catch | 80-90% | 65-85% | 0.60-0.80 | **0.60-0.75** |

---

## **11. What Makes a "Best Plan"**

The **best plan** is selected via:
```python
best = max(results, key=lambda r: r["score"])
```

**Selection Criteria:**
- ✅ Highest composite score wins
- ✅ Balances all 4 metrics per weightings (35-30-20-15)
- ✅ Typically: high completion + moderate fatigue + positive overload delta + stability
- ⚠️ Not always the most aggressive (may have highest fatigue penalty)
- ⚠️ Not always the most conservative (may have low completion)

---

## **12. Simulation Output Structure**

```json
{
  "results": [
    {
      "plan_type": "conservative",
      "score": 0.687,
      "metrics": {
        "completion": 0.60,
        "fatigue": 0.35,
        "overload": 0.85,
        "stability": 0.95
      },
      "summary": "Protects user health by deferring low-priority tasks; fatigue ends at 0.35 with 85% capacity buffer.",
      "actions": [ /* plan's action array */ ]
    },
    ...
  ],
  "benchmark": {
    "wall_time_seconds": 1.234,
    "plans_simulated": 6
  },
  "best_plan": "conservative"
}
```

---

## **13. Parallel Execution (AMD Showcase)**

| Aspect | Value | Impact |
|--------|-------|--------|
| **Plans Simulated** | 6 (3 original + 3 mutated) | Full coverage |
| **Execution Mode** | `asyncio.gather()` | All 6 LLM calls run in parallel |
| **Bottleneck** | Slowest LLM response | Sequential scoring impossible without parallelization |
| **Benchmark Metric** | `wall_time_seconds` | Total time to complete all 6 plans |
| **Scalability** | Linear to LLM latency | Adding more plans = minimal latency overhead |

**Typical wall_time on GPU:** 1-3 seconds for 6 plans

---

## **Key Insights**

1. **Completion rate** drives the score the most (35%), making output critical
2. **Fatigue health** is nearly as important (30%), preventing burnout
3. **Overload delta** prevents planning into impossible schedules (20%)
4. **Stability** acts as a safety valve for risky high-energy combos (15%)
5. **Optimal scores** (0.65-0.75) come from **balanced plans** that don't over-commit
6. **Parallel simulation** (Layer 4) is AMD-optimized for 6-plan throughput

---
