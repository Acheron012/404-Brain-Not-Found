from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langsmith import traceable

import os, json, dotenv

dotenv.load_dotenv()

hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")
if not hf_token:
    raise ValueError("Missing HUGGINGFACEHUB_API_TOKEN in environment variables")


llm = HuggingFaceEndpoint(
    model="Qwen/Qwen2-7B-Instruct:featherless-ai",
    huggingfacehub_api_token=hf_token,
    temperature=0.5,
    max_new_tokens=1024,
)
llm = ChatHuggingFace(llm=llm)

parser = JsonOutputParser()


prompt = ChatPromptTemplate.from_template("""
You are a critical scheduling reviewer. Agent 1 has proposed 3 plans.
Your job is to review each plan against the user's actual state and constraints,
and only mutate actions where the numbers reveal a genuine risk.

You are constructive — not adversarial. If Agent 1 made a sound decision,
say so explicitly and leave it unchanged. Only intervene where the data
supports a real concern.

---

AGENT 1 PLANS:
{agent1_plans}

SCHEDULE STATE:
{state}

CONSTRAINTS:
{constraints}

---

GROUNDING RULES (use these to detect real risks, not assumptions):

1. fatigue_score > 0.7 AND action is "proceed" AND task energy_required is "high"
   → risk: user will likely underperform or crash mid-task

2. effective_energy < 0.5 AND action is "proceed" AND remaining_hours >= 3
   → risk: insufficient energy for sustained focus

3. overload_hours > 0 AND action is "proceed" AND no compression anywhere in the plan
   → risk: plan ignores capacity breach entirely

4. constraints signal is "Workload significantly exceeds capacity" AND action is "proceed"
   → risk: Agent 1 is ignoring a hard constraint signal

5. action is "delay" or "drop" AND task priority_level is "high" AND severity is "critical"
   → risk: Agent 1 is deferring something that cannot be deferred

Only trigger a mutation when one of these rules applies to the actual values
in the state and constraints. Cite the specific number in your reason.

---

MUTATION RULES:
- proceed → compress (provide new_hours less than remaining_hours) or delay
- delay → compress (if task is high priority and can be shortened instead)
- compress → adjust new_hours upward (if Agent 1's estimate is too optimistic)
- drop → miss (if task has consequences that make dropping too risky)
- Do NOT mutate a drop on a low-priority task — Agent 1 is right to drop it
- Do NOT mutate just to be different — only mutate where a rule fires

---

FOR EACH PLAN:
1. Go through each action one by one
2. Check if any grounding rule applies using the actual state/constraint values
3. If a rule fires: mutate and explain with the specific number
4. If no rule fires: mark the task as unchanged
5. Write one overall_critique sentence summarizing your verdict on the plan

---

OUTPUT FORMAT (structure only — use real task ids and real numbers from input):

{{
  "critiques": [
    {{
      "plan_type": "conservative",
      "overall_critique": "one sentence verdict referencing actual state values",
      "mutations": [
        {{
          "task_id": 99,
          "original_action": "proceed",
          "mutated_action": "compress",
          "new_hours": 0.0,
          "reason": "cite the specific metric that triggered this — e.g. fatigue_score is X"
        }}
      ],
      "unchanged": [88, 77]
    }},
    {{
      "plan_type": "balanced",
      "overall_critique": "one sentence verdict",
      "mutations": [],
      "unchanged": []
    }},
    {{
      "plan_type": "aggressive",
      "overall_critique": "one sentence verdict",
      "mutations": [],
      "unchanged": []
    }}
  ]
}}

REMINDER: 99, 88, 77 are placeholders. Use real task_ids from Agent 1's plans.
new_hours must be a real float less than the task's remaining_hours.
mutations can be an empty list if Agent 1's plan is sound for that plan type.
Return ONLY valid JSON.
""")


def _build_mutated_plans(agent1_plans: list, critiques: list) -> list:
    """
    Merges Agent 1's original plans with Agent 2's mutations.
    Returns 3 mutated plans — same structure as Agent 1's output
    so Layer 4 can simulate all 6 with the same interface.

    For each plan:
      - Start with Agent 1's actions as the base
      - Apply Agent 2's mutations on top (matched by task_id)
      - Unchanged tasks carry over as-is
    """
    # index agent1 plans by plan_type for fast lookup
    a1_by_type = {p["plan_type"]: p for p in agent1_plans}

    mutated_plans = []

    for critique in critiques:
        plan_type = critique["plan_type"]
        a1_plan = a1_by_type.get(plan_type)

        if not a1_plan:
            continue

        # index agent1 actions by task_id
        a1_actions = {a["task_id"]: dict(a) for a in a1_plan.get("actions", [])}

        # apply mutations on top
        mutation_map = {m["task_id"]: m for m in critique.get("mutations", [])}

        merged_actions = []
        for task_id, original in a1_actions.items():
            if task_id in mutation_map:
                m = mutation_map[task_id]
                action = {"task_id": task_id, "action": m["mutated_action"]}
                if "new_hours" in m:
                    action["new_hours"] = m["new_hours"]
                merged_actions.append(action)
            else:
                merged_actions.append(original)

        mutated_plans.append({
            "plan_type": f"{plan_type}_mutated",
            "stance": f"Agent 2 critique of {plan_type}: {critique['overall_critique']}",
            "actions": merged_actions,
            "mutation_count": len(mutation_map),
        })

    return mutated_plans


def _validate_critiques(result: dict, valid_task_ids: set) -> dict:
    """
    Ensures all 3 plan types are reviewed and no phantom task_ids appear.
    Attaches _validation report — does not raise.
    """
    required = {"conservative", "balanced", "aggressive"}
    found = {c["plan_type"] for c in result.get("critiques", [])}
    issues = []

    for missing in required - found:
        issues.append(f"Missing critique for plan type: {missing}")

    for critique in result.get("critiques", []):
        for mutation in critique.get("mutations", []):
            tid = mutation.get("task_id")
            if tid not in valid_task_ids:
                issues.append(
                    f"[{critique['plan_type']}] mutation references unknown task_id: {tid}"
                )
            if mutation.get("mutated_action") == "compress" and "new_hours" not in mutation:
                issues.append(
                    f"[{critique['plan_type']}] task {tid}: compress mutation missing new_hours"
                )

    result["_validation"] = {"ok": len(issues) == 0, "issues": issues}
    return result


@traceable(name="agent_2_critic", run_type="chain", tags=["agent", "critic", "layer3"])
def critique(tasks,state,constraints,agent1_output) -> dict:
    """
    Agent 2 — Devil's advocate / constructive critic.
    Reviews Agent 1's 3 plans against actual state and constraint values.
    Only mutates where a grounding rule fires on real numbers.

    Args:
        tasks:         for task_id validation
        state:         schedule_state from Layer 1/2
        constraints:   constraint from Layer 2
        agent1_output: full output from agent_1_planner.generate()

    Returns:
        dict with keys:
          critiques     — Agent 2's per-plan critique and mutations
          mutated_plans — 3 merged plans ready for Layer 4 simulation
          _validation   — { ok, issues }
    """
    chain = prompt | llm | parser

    result = chain.invoke({
        "agent1_plans": json.dumps(agent1_output.get("plans", []), indent=2),
        "state": json.dumps(state, indent=2),
        "constraints": json.dumps(constraints, indent=2),
    })


    valid_task_ids = {t["id"] for t in tasks}
    result = _validate_critiques(result, valid_task_ids)

    # build the 6th pipeline output: 3 mutated plans merged from A1 + A2
    result["mutated_plans"] = _build_mutated_plans(
        agent1_output.get("plans", []),
        result.get("critiques", []),
    )

    return result