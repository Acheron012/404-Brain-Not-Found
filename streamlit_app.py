import streamlit as st
import requests
from datetime import datetime, timedelta


API_BASE = "https://404-brain-not-found-production-6081.up.railway.app"

st.set_page_config(
    page_title="Schedly — 404 Brain Not Found",
    page_icon="🧠",
    layout="wide",
)
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Syne', sans-serif;
}
code, pre, .mono { font-family: 'Space Mono', monospace; }

.stApp { background: #0e1a13; color: #e8f5e9; }

h1, h2, h3 { font-family: 'Syne', sans-serif; font-weight: 800; }

.hero {
    background: linear-gradient(135deg, #1a2f20 0%, #0e1a13 60%, #0a2218 100%);
    border: 1px solid #2d5a3d;
    border-radius: 16px;
    padding: 2.5rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
}
.hero::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, #1d9e7520 0%, transparent 70%);
    pointer-events: none;
}
.hero h1 {
    font-size: 2.8rem;
    color: #7dffb3;
    margin: 0;
    line-height: 1.1;
}
.hero p { color: #a8d5b5; font-size: 1.05rem; margin-top: 0.5rem; }

.metric-card {
    background: #1a2f20;
    border: 1px solid #2d5a3d;
    border-radius: 12px;
    padding: 1.2rem;
    text-align: center;
}
.metric-value {
    font-size: 2rem;
    font-weight: 800;
    color: #7dffb3;
    font-family: 'Space Mono', monospace;
}
.metric-label { font-size: 0.75rem; color: #6b9e7a; text-transform: uppercase; letter-spacing: 0.1em; }

.plan-card {
    background: #1a2f20;
    border: 1px solid #2d5a3d;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1rem;
}
.plan-card.winner {
    border-color: #1d9e75;
    border-width: 2px;
    background: #152b1e;
}
.plan-type {
    font-family: 'Space Mono', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    padding: 0.3rem 0.8rem;
    border-radius: 100px;
    display: inline-block;
    margin-bottom: 0.8rem;
}
.badge-conservative { background: #1d3d28; color: #7dffb3; }
.badge-balanced { background: #1e2d4a; color: #7db8ff; }
.badge-aggressive { background: #3d1d1d; color: #ff7d7d; }
.badge-winner { background: #1d9e75; color: #fff; }

.reasoning-box {
    background: #112218;
    border-left: 3px solid #1d9e75;
    border-radius: 0 8px 8px 0;
    padding: 1rem 1.2rem;
    color: #a8d5b5;
    font-size: 0.9rem;
    line-height: 1.7;
    margin: 1rem 0;
}

.task-row {
    background: #1a2f20;
    border: 1px solid #2d5a3d;
    border-radius: 10px;
    padding: 1rem 1.2rem;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.action-badge {
    font-family: 'Space Mono', monospace;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.25rem 0.6rem;
    border-radius: 6px;
}
.action-proceed { background: #1e2d4a; color: #7db8ff; }
.action-compress { background: #1d3d28; color: #7dffb3; }
.action-delay { background: #3d2e1d; color: #ffc97d; }
.action-drop { background: #3d1d1d; color: #ff7d7d; }

.benchmark-box {
    background: #0a1f14;
    border: 1px solid #1d9e75;
    border-radius: 10px;
    padding: 1rem 1.5rem;
    font-family: 'Space Mono', monospace;
    font-size: 0.85rem;
    color: #7dffb3;
}

.step-header {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #1d9e75;
    margin-bottom: 0.3rem;
    font-family: 'Space Mono', monospace;
}

.section-divider {
    border: none;
    border-top: 1px solid #2d5a3d;
    margin: 2rem 0;
}

/* Streamlit overrides */
.stButton > button {
    background: #1d9e75 !important;
    color: #fff !important;
    border: none !important;
    font-family: 'Syne', sans-serif !important;
    font-weight: 700 !important;
    border-radius: 8px !important;
    padding: 0.6rem 1.5rem !important;
}
.stButton > button:hover {
    background: #17805e !important;
}
.stTextInput > div > div > input,
.stNumberInput > div > div > input,
.stSelectbox > div > div {
    background: #1a2f20 !important;
    border: 1px solid #2d5a3d !important;
    color: #e8f5e9 !important;
    border-radius: 8px !important;
}
.stSlider > div > div > div { background: #1d9e75 !important; }
label { color: #a8d5b5 !important; }
.stTab [data-baseweb="tab"] { color: #6b9e7a !important; }
.stTab [aria-selected="true"] { color: #7dffb3 !important; border-bottom-color: #1d9e75 !important; }
</style>
""", unsafe_allow_html=True)

# ── Hero ──────────────────────────────────────────────────────────────────────
st.markdown("""
<div class="hero">
    <h1>🧠 Schedly</h1>
    <p>Multi-agent AI schedule optimizer · Powered by AMD MI300X GPU · 404 Brain Not Found</p>
</div>
""", unsafe_allow_html=True)

# ── Session state ─────────────────────────────────────────────────────────────
if "user_id" not in st.session_state:
    st.session_state.user_id = None
if "tasks" not in st.session_state:
    st.session_state.tasks = []
if "plan_result" not in st.session_state:
    st.session_state.plan_result = None


def pct(value: float, invert: bool = False) -> str:
    v = 1 - value if invert else value
    return f"{round(min(max(v, 0), 1) * 100)}%"


def action_badge(action: str, new_hours=None) -> str:
    label = f"compress → {new_hours}h" if action == "compress" and new_hours else action
    cls = {
        "proceed": "action-proceed",
        "compress": "action-compress",
        "delay": "action-delay",
        "drop": "action-drop",
    }.get(action, "action-proceed")
    return f'<span class="action-badge {cls}">{label}</span>'


# ══════════════════════════════════════════════════════════════════════════════
# STEP 1 — USER STATE
# ══════════════════════════════════════════════════════════════════════════════
st.markdown('<div class="step-header">Step 1 — Your current state</div>', unsafe_allow_html=True)

col1, col2, col3 = st.columns(3)
with col1:
    energy = st.select_slider("⚡ Energy Level", options=["low", "medium", "high"], value="high")
with col2:
    fatigue = st.select_slider("😴 Fatigue Level", options=["low", "medium", "high"], value="low")
with col3:
    sleep_hours = st.number_input("💤 Sleep Hours", min_value=0, max_value=24, value=8)

available_hours = st.slider("🕐 Available Hours Today", min_value=1, max_value=24, value=8)

if st.button("Save User State"):
    with st.spinner("Saving..."):
        resp = requests.post(f"{API_BASE}/api/user-states/", json={
            "energy_level": energy,
            "fatigue_level": fatigue,
            "sleep_hours": sleep_hours,
        })
        if resp.status_code == 201:
            st.session_state.user_id = resp.json()["id"]
            st.session_state.tasks = []
            st.session_state.plan_result = None
            st.success(f"✅ User state saved (ID: {st.session_state.user_id})")
        else:
            st.error(f"Failed: {resp.text}")

# ══════════════════════════════════════════════════════════════════════════════
# STEP 2 — TASKS
# ══════════════════════════════════════════════════════════════════════════════
if st.session_state.user_id:
    st.markdown('<hr class="section-divider">', unsafe_allow_html=True)
    st.markdown('<div class="step-header">Step 2 — Add your tasks</div>', unsafe_allow_html=True)

    with st.expander("➕ Add a task", expanded=len(st.session_state.tasks) == 0):
        tc1, tc2 = st.columns(2)
        with tc1:
            title = st.text_input("Task Title", placeholder="e.g. Write project report")
            body = st.text_area("Description (optional)", placeholder="Details about this task...")
            remaining_hours = st.number_input("Estimated Hours", min_value=0.5, max_value=24.0, value=2.0, step=0.5)
        with tc2:
            priority = st.selectbox("Priority", ["high", "medium", "low"])
            energy_req = st.selectbox("Energy Required", ["high", "medium", "low"])
            level = st.selectbox("Difficulty", ["hard", "medium", "easy"])
            deadline_days = st.number_input("Deadline (days from now)", min_value=1, max_value=30, value=2)

        if st.button("Add Task"):
            if not title:
                st.warning("Please enter a task title.")
            else:
                now = datetime.utcnow()
                deadline = now + timedelta(days=int(deadline_days))
                with st.spinner("Adding task..."):
                    resp = requests.post(f"{API_BASE}/api/tasks/", json={
                        "user": st.session_state.user_id,
                        "title": title,
                        "body": body,
                        "remaining_hours": remaining_hours,
                        "priority_level": priority,
                        "energy_required": energy_req,
                        "status": "not_yet_started",
                        "level": level,
                        "start_date": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "deadline": deadline.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    })
                    if resp.status_code == 201:
                        task = resp.json()
                        st.session_state.tasks.append(task)
                        st.success(f"✅ Task added: {title}")
                    else:
                        st.error(f"Failed: {resp.text}")

    if st.session_state.tasks:
        st.markdown(f"**{len(st.session_state.tasks)} task(s) queued:**")
        for t in st.session_state.tasks:
            st.markdown(
                f'<div class="task-row">'
                f'<span style="color:#e8f5e9;font-weight:600">{t["title"]}</span>'
                f'<span style="color:#6b9e7a;font-family:monospace;font-size:0.85rem">'
                f'{t["remaining_hours"]}h · {t["priority_level"]} priority · due in {t.get("deadline","")[:10]}'
                f'</span></div>',
                unsafe_allow_html=True,
            )

# ══════════════════════════════════════════════════════════════════════════════
# STEP 3 — GENERATE PLAN
# ══════════════════════════════════════════════════════════════════════════════
if st.session_state.user_id and st.session_state.tasks:
    st.markdown('<hr class="section-divider">', unsafe_allow_html=True)
    st.markdown('<div class="step-header">Step 3 — Run the AI planning pipeline</div>', unsafe_allow_html=True)

    st.markdown("""
    <div class="reasoning-box">
    🤖 <strong>3-agent pipeline:</strong>
    Agent 1 generates Conservative / Balanced / Aggressive plans →
    Agent 2 critiques and mutates them →
    Layer 4 simulates all 6 plans in parallel on AMD MI300X →
    Agent 3 picks the winner.
    </div>
    """, unsafe_allow_html=True)

    if st.button("🚀 Generate Plan"):
        with st.spinner("Running multi-agent pipeline... (this may take uo to 3 minutes on first run)"):
            resp = requests.post(f"{API_BASE}/api/schedule-requests/generate_plan/", json={
                "user": st.session_state.user_id,
                "available_hours": available_hours,
            }, timeout=300)
            if resp.status_code == 201:
                st.session_state.plan_result = resp.json()
                st.success("✅ Plan generated!")
            else:
                st.error(f"Pipeline failed: {resp.text}")

# ══════════════════════════════════════════════════════════════════════════════
# RESULTS
# ══════════════════════════════════════════════════════════════════════════════
if st.session_state.plan_result:
    result = st.session_state.plan_result
    decision = result.get("decision", {})
    debug = result.get("debug", {})
    simulations = debug.get("layer4", {}).get("all_simulations", [])
    benchmark = debug.get("layer4", {}).get("benchmark", {})
    agent1 = debug.get("agent1", {})
    agent2 = debug.get("agent2", {})

    st.markdown('<hr class="section-divider">', unsafe_allow_html=True)
    st.markdown("## 🏆 Planning Results")

    # ── AMD Benchmark ────────────────────────────────────────────────────────
    if benchmark:
        st.markdown(
            f'<div class="benchmark-box">'
            f'⚡ AMD MI300X · {benchmark.get("plans_simulated", 6)} plans simulated in parallel · '
            f'<strong>{benchmark.get("wall_time_seconds", "—")}s</strong> wall time'
            f'</div>',
            unsafe_allow_html=True,
        )
        st.markdown("")

    tab1, tab2, tab3, tab4 = st.tabs(["🎯 Recommendation", "🤖 Agent 1", "🔬 Agent 2", "📊 Simulation"])

    # ── Tab 1: Recommendation ────────────────────────────────────────────────
    with tab1:
        selected = decision.get("selected_plan", "—")
        score = decision.get("score", 0)
        metrics = decision.get("metrics", {})
        reasoning = decision.get("reasoning", "")

        col_a, col_b = st.columns([2, 1])
        with col_a:
            badge_cls = (
                "badge-conservative" if "conservative" in selected
                else "badge-balanced" if "balanced" in selected
                else "badge-aggressive"
            )
            st.markdown(
                f'<span class="plan-type badge-winner">✓ Recommended</span> '
                f'<span class="plan-type {badge_cls}">{selected}</span>',
                unsafe_allow_html=True,
            )
            st.markdown(f"### {selected}")
        with col_b:
            st.markdown(
                f'<div class="metric-card">'
                f'<div class="metric-label">Composite Score</div>'
                f'<div class="metric-value">{score:.3f}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

        if reasoning:
            st.markdown(f'<div class="reasoning-box">{reasoning}</div>', unsafe_allow_html=True)

        # metrics
        m1, m2, m3, m4 = st.columns(4)
        for col, label, val, invert in [
            (m1, "Completion", metrics.get("completion", 0), False),
            (m2, "Fatigue End", metrics.get("fatigue", 0), True),
            (m3, "Overload Relief", metrics.get("overload", 0), False),
            (m4, "Stability", metrics.get("stability", 0), False),
        ]:
            with col:
                st.markdown(
                    f'<div class="metric-card">'
                    f'<div class="metric-label">{label}</div>'
                    f'<div class="metric-value">{pct(val, invert)}</div>'
                    f'</div>',
                    unsafe_allow_html=True,
                )
                st.progress(min(max((1 - val if invert else val), 0), 1))

        # task actions for winning plan
        winning_sim = next((s for s in simulations if s["plan_type"] == selected), None)
        if winning_sim:
            st.markdown("#### Task Actions")
            task_lookup = {str(t["id"]): t["title"] for t in st.session_state.tasks}
            for action in winning_sim["actions"]:
                tid = str(action["task_id"])
                name = task_lookup.get(tid, f"Task {tid}")
                badge = action_badge(action["action"], action.get("new_hours"))
                st.markdown(
                    f'<div class="task-row">'
                    f'<span style="color:#e8f5e9;font-weight:600">{name}</span>'
                    f'{badge}</div>',
                    unsafe_allow_html=True,
                )
            st.markdown(
                f'<div class="reasoning-box" style="margin-top:1rem">{winning_sim["summary"]}</div>',
                unsafe_allow_html=True,
            )

    # ── Tab 2: Agent 1 ───────────────────────────────────────────────────────
    with tab2:
        st.markdown("#### Agent 1 — Plan Generator")
        st.markdown(
            f'<div class="reasoning-box">{agent1.get("reasoning", "No reasoning returned.")}</div>',
            unsafe_allow_html=True,
        )
        plans = agent1.get("plans", [])
        cols = st.columns(len(plans)) if plans else []
        task_lookup = {str(t["id"]): t["title"] for t in st.session_state.tasks}
        for i, plan in enumerate(plans):
            pt = plan["plan_type"]
            badge_cls = (
                "badge-conservative" if pt == "conservative"
                else "badge-balanced" if pt == "balanced"
                else "badge-aggressive"
            )
            with cols[i]:
                st.markdown(
                    f'<div class="plan-card{"  winner" if pt == decision.get("selected_plan") else ""}">'
                    f'<span class="plan-type {badge_cls}">{pt}</span>'
                    f'<div style="color:#a8d5b5;font-size:0.85rem;margin-bottom:0.8rem">{plan.get("stance","")}</div>'
                    f'<div style="font-family:monospace;font-size:1.4rem;color:#7dffb3;font-weight:700">{plan.get("score", 0):.3f}</div>'
                    f'<div style="color:#6b9e7a;font-size:0.7rem;margin-bottom:0.8rem">score</div>',
                    unsafe_allow_html=True,
                )
                for action in plan.get("actions", []):
                    tid = str(action["task_id"])
                    name = task_lookup.get(tid, f"Task {tid}")
                    badge = action_badge(action["action"], action.get("new_hours"))
                    st.markdown(
                        f'<div style="display:flex;justify-content:space-between;align-items:center;'
                        f'padding:0.4rem 0;border-bottom:1px solid #2d5a3d;font-size:0.85rem">'
                        f'<span style="color:#e8f5e9">{name}</span>{badge}</div>',
                        unsafe_allow_html=True,
                    )
                st.markdown('</div>', unsafe_allow_html=True)

    # ── Tab 3: Agent 2 ───────────────────────────────────────────────────────
    with tab3:
        st.markdown("#### Agent 2 — Constructive Critic")
        st.markdown('<p style="color:#6b9e7a;font-size:0.85rem">Only changed actions where real risk was detected.</p>', unsafe_allow_html=True)
        critiques = agent2.get("critiques", [])
        mutated = agent2.get("mutated_plans", [])
        task_lookup = {str(t["id"]): t["title"] for t in st.session_state.tasks}

        for critique in critiques:
            pt = critique["plan_type"]
            mutations = critique.get("mutations", [])
            mut_plan = next((m for m in mutated if m["plan_type"] == f"{pt}_mutated"), None)
            badge_cls = (
                "badge-conservative" if pt == "conservative"
                else "badge-balanced" if pt == "balanced"
                else "badge-aggressive"
            )
            with st.expander(f"{pt.upper()} — {len(mutations)} mutation(s)", expanded=False):
                st.markdown(
                    f'<div class="reasoning-box">{critique.get("overall_critique","")}</div>',
                    unsafe_allow_html=True,
                )
                if mutations:
                    st.markdown("**Mutations:**")
                    for m in mutations:
                        tid = str(m["task_id"])
                        name = task_lookup.get(tid, f"Task {tid}")
                        st.markdown(
                            f'<div class="task-row" style="flex-direction:column;align-items:flex-start">'
                            f'<div style="display:flex;justify-content:space-between;width:100%">'
                            f'<strong style="color:#e8f5e9">{name}</strong>'
                            f'{action_badge(m["mutated_action"], m.get("new_hours"))}</div>'
                            f'<div style="color:#6b9e7a;font-size:0.8rem;margin-top:0.3rem">{m.get("reason","")}</div>'
                            f'</div>',
                            unsafe_allow_html=True,
                        )
                else:
                    st.markdown('<span style="color:#1d9e75">✓ No mutations — plan confirmed as-is.</span>', unsafe_allow_html=True)

    # ── Tab 4: Simulation ────────────────────────────────────────────────────
    with tab4:
        st.markdown("#### Layer 4 — Parallel Simulation Results")
        if benchmark:
            st.markdown(
                f'<div class="benchmark-box" style="margin-bottom:1rem">'
                f'AMD MI300X · {benchmark.get("plans_simulated")} plans · '
                f'{benchmark.get("wall_time_seconds")}s · math best: <strong>{debug.get("layer4",{}).get("math_best","—")}</strong>'
                f'</div>',
                unsafe_allow_html=True,
            )

        for sim in sorted(simulations, key=lambda x: x["score"], reverse=True):
            pt = sim["plan_type"]
            is_winner = pt == decision.get("selected_plan")
            badge_cls = (
                "badge-conservative" if "conservative" in pt
                else "badge-balanced" if "balanced" in pt
                else "badge-aggressive"
            )
            st.markdown(
                f'<div class="plan-card{"  winner" if is_winner else ""}">'
                f'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem">'
                f'<span class="plan-type {badge_cls}">{pt}</span>'
                f'{"<span class=\"plan-type badge-winner\">✓ Selected</span>" if is_winner else ""}'
                f'<span style="font-family:monospace;font-size:1.2rem;color:#7dffb3;font-weight:700">{sim["score"]:.3f}</span>'
                f'</div>',
                unsafe_allow_html=True,
            )
            m = sim["metrics"]
            mc1, mc2, mc3, mc4 = st.columns(4)
            for col, label, val, inv in [
                (mc1, "Completion", m["completion"], False),
                (mc2, "Fatigue", m["fatigue"], True),
                (mc3, "Overload", m["overload"], False),
                (mc4, "Stability", m["stability"], False),
            ]:
                with col:
                    st.markdown(
                        f'<div style="text-align:center">'
                        f'<div style="font-size:0.65rem;color:#6b9e7a;text-transform:uppercase;letter-spacing:0.1em">{label}</div>'
                        f'<div style="font-family:monospace;font-size:1rem;color:#7dffb3;font-weight:700">{pct(val, inv)}</div>'
                        f'</div>',
                        unsafe_allow_html=True,
                    )
                    st.progress(min(max((1 - val if inv else val), 0), 1))
            st.markdown(
                f'<div style="color:#a8d5b5;font-size:0.85rem;margin-top:0.8rem;line-height:1.6">{sim["summary"]}</div>'
                f'</div>',
                unsafe_allow_html=True,
            )

    # ── Footer ───────────────────────────────────────────────────────────────
    st.markdown('<hr class="section-divider">', unsafe_allow_html=True)
    st.markdown(
        '<p style="text-align:center;color:#2d5a3d;font-family:monospace;font-size:0.8rem">'
        '404 Brain Not Found · AMD MI300X · lablab.ai Hackathon 2026'
        '</p>',
        unsafe_allow_html=True,
    )