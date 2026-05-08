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


# 🔷 Initialize HuggingFace endpoint
llm = HuggingFaceEndpoint(
    model="Qwen/Qwen2-7B-Instruct:featherless-ai",
    huggingfacehub_api_token=hf_token,
    temperature=0.3,
    max_new_tokens=512
)


llm = ChatHuggingFace(llm=llm)


# 🔷 Define output parser (forces JSON)
parser = JsonOutputParser()


# 🔷 Prompt Template
prompt = ChatPromptTemplate.from_template("""
You are a conservative planning agent.

Your job is to create a safe, realistic schedule that prioritizes:
- user health
- sustainable workload
- energy preservation over productivity

---

INPUT:

Tasks:
{{tasks}}

Schedule State:
{{state}}

Constraints:
{{constraints}}

---

STEP 1 — ANALYSIS (THINKING):
Carefully analyze:
- workload pressure
- fatigue risk
- energy constraints
- which tasks are high vs low priority

Explain briefly why certain tasks should be delayed, compressed, or dropped.

---

STEP 2 — DECISION:
Create a conservative plan using ONLY these actions:
- delay
- compress
- miss
- drop
- outsource
- proceed as planned

Rules:
- Only use valid task_id from input
- Never invent tasks
- compress MUST include new_hours
- prioritize reducing overload first

---

OUTPUT FORMAT:

Return ONLY valid JSON:

{{
  "reasoning": "short explanation of overall scheduling decisions",
  "plans": [
    {{
      "plan_type": "conservative",
      "actions": [
        {{
          "task_id": 1,
          "action": "delay"
        }},
        {{
          "task_id": 2,
          "action": "compress",
          "new_hours": 1.5
        }}
      ]
    }}
  ]
}}""")


# 🔷 Agent function
@traceable(name="conservative_planner", run_type="chain", tags=["agent", "conservative"])
def generate(tasks, state, constraints):
  chain = prompt | llm | parser

  response = chain.invoke({
        "tasks": json.dumps(tasks, indent=2),
        "state": json.dumps(state, indent=2),
        "constraints": json.dumps(constraints, indent=2)
    })
  
  return response