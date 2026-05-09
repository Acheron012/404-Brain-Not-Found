from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langsmith import traceable

import os, dotenv

# Load environment variables
dotenv.load_dotenv()

import json

# Get token safely
hf_token = os.getenv("HUGGINGFACEHUB_API_TOKEN")

if not hf_token:
    raise ValueError("Missing HUGGINGFACEHUB_API_TOKEN in environment variables")


# Initialize HuggingFace endpoint
llm = HuggingFaceEndpoint(
    model="Qwen/Qwen2-7B-Instruct:featherless-ai",
    huggingfacehub_api_token=hf_token,
    temperature=0.6,
    max_new_tokens=1024
)


llm = ChatHuggingFace(llm=llm)


# Define output parser (forces JSON)
parser = JsonOutputParser()


# Prompt Template
prompt = ChatPromptTemplate.from_template("""
You are a scheduling AI. Given the user's tasks, state, and constraints,
generate exactly 3 plans: conservative, balanced, and aggressive.

Each plan reflects a different risk tolerance:
- conservative: protect health, delay/compress/drop non-critical tasks
- balanced: mix productivity and health, light compression allowed
- aggressive: maximize output, accept higher fatigue risk

---

TASKS:
{tasks}

SCHEDULE STATE:
{state}

CONSTRAINTS:
{constraints}

---

REASONING STEP:
Before writing any plan, answer these internally:
1. What is the total hours across all tasks?
2. How does that compare to capacity_hours in state?
3. Which tasks have the highest priority_level or energy_required?
4. Given fatigue_score and effective_energy, what can the user realistically do?

Use those answers to drive DIFFERENT decisions across the 3 plans.

---

PLAN LOGIC:
- conservative: assume the user will tire faster than expected. Protect them.
  Delay or compress anything that isn't urgent. Drop low-priority tasks.
- balanced: trust the state data at face value. Compress where overloaded,
  proceed where capacity allows.
- aggressive: push through. Only delay tasks with hard blockers.
  Accept fatigue risk for high-priority tasks.

The 3 plans MUST differ meaningfully. If two plans have the same action
for the same task, ask yourself why — usually one of them is wrong.

---

VALID ACTIONS:
- proceed        → no change, task runs as-is
- compress       → reduce hours, MUST include new_hours (float, less than remaining_hours)
- delay          → push to another day
- drop           → remove from schedule entirely
- miss           → acknowledge it won't happen, no rescheduling
- outsource      → delegate externally

---

OUTPUT FORMAT (structure only — do not copy these values):

{{
  "reasoning": "your actual analysis referencing the real task ids and hours",
  "plans": [
    {{
      "plan_type": "conservative",
      "stance": "one sentence on why this protects the user given their current state",
      "actions": [
        {{"task_id": 99, "action": "delay"}},
        {{"task_id": 88, "action": "compress", "new_hours": 0.0}}
      ]
    }},
    {{
      "plan_type": "balanced",
      "stance": "one sentence",
      "actions": []
    }},
    {{
      "plan_type": "aggressive",
      "stance": "one sentence",
      "actions": []
    }}
  ]
}}

REMINDER: task_id 99 and 88 above are placeholders. Use the real task ids
from the TASKS input. new_hours must be less than the task's remaining_hours.
Return ONLY valid JSON.""")

def _validate_plans(result: dict, valid_task_ids: set) -> dict:
    """
    Post-generation guard. Does not raise — returns a _validation
    report so Layer 4 / Agent 3 can decide how to handle issues.
    """
    required = {"conservative", "balanced", "aggressive"}
    found = {p["plan_type"] for p in result.get("plans", [])}
    issues = []

    for missing in required - found:
        issues.append(f"Missing plan type: {missing}")

    for plan in result.get("plans", []):
        for action in plan.get("actions", []):
            tid = action.get("task_id")
            if tid not in valid_task_ids:
                issues.append(
                    f"[{plan['plan_type']}] unknown task_id: {tid}"
                )
            if action.get("action") == "compress" and "new_hours" not in action:
                issues.append(
                    f"[{plan['plan_type']}] task {tid}: compress missing new_hours"
                )

    result["_validation"] = {"ok": len(issues) == 0, "issues": issues}
    return result

# Agent function
@traceable(name="agent_1_planner", run_type="chain", tags=["agent", "planner", "layer3"])
def generate(tasks, state, constraints) -> dict:
  """
    Agent 1 — Plan generator.
    Single LLM call → 3 plans (conservative / balanced / aggressive).

    Args:
        tasks:       list of task dicts (must have 'id' key)
        state:       schedule_state dict from Layer 1/2
        constraints: constraint dict from Layer 2

    Returns:
        dict: { reasoning, plans: [...], _validation: { ok, issues } }
    """
  chain = prompt | llm | parser

  response = chain.invoke({
        "tasks": json.dumps(tasks, indent=2),
        "state": json.dumps(state, indent=2),
        "constraints": json.dumps(constraints, indent=2)
    })
  
  valid_task_ids = {t["id"] for t in tasks}
  return _validate_plans(response, valid_task_ids)