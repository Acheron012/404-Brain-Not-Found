# Project Functionality Summary

## Overview

This repository contains **Schedly**, a scheduling and productivity application with:

- a **Django + Django REST Framework backend**
- a **React + Vite frontend dashboard**
- an **LLM-assisted planning pipeline** that tries to recommend task plans based on user capacity, fatigue, and energy

At a high level, the project is designed to help a user:

1. store their current energy/fatigue state
2. create and manage tasks
3. declare how many hours they have available
4. generate multiple scheduling strategies
5. critique and score those strategies
6. select a recommended plan

The codebase also includes standalone test/demo scripts and design notes that explain the scoring and planning logic in more detail.

## Repository Structure

- `schedly/`: Django backend project
- `schedly/schedlyapp/`: main backend app
- `frontend/`: React frontend
- `testing/`: standalone test and experimentation scripts for the planning layers
- `ComputationMatrix.md`: explanation of state computation and critique rules
- `SimulationMatrix.md`: explanation of plan scoring and simulation rules

## Core Product Idea

Schedly is not just a task tracker. It aims to be a **wellness-aware schedule optimizer**.

Instead of simply listing tasks, it tries to answer:

- How much work is realistically possible today?
- Is the user overloaded?
- How much usable energy remains after fatigue is considered?
- Which tasks should proceed, be compressed, delayed, dropped, missed, or outsourced?

The planning system is structured in layers:

1. compute schedule state
2. detect constraints
3. generate three plans with an LLM
4. critique and mutate those plans with another LLM
5. simulate and score all plans
6. choose a final recommendation

## Backend Functionality

### Django Project Setup

The backend is a Django 6 project using:

- SQLite for local development
- Django REST Framework for API endpoints
- `drf-spectacular` for API schema/docs
- `django-cors-headers` for frontend integration

Root routes in `schedly/amdhackathon/urls.py` provide:

- `/`: a simple JSON home response
- `/admin/`: Django admin
- `/api/`: REST API routes from `schedlyapp`
- `/schema/`: OpenAPI schema
- `/docs/`: Swagger UI

### Data Models

The main backend entities are:

#### `UserState`

Represents the user's current condition:

- `energy_level`: `low`, `medium`, `high`
- `fatigue_level`: `low`, `medium`, `high`
- `sleep_hours`
- `created_at`

This model is used as the user-centric input to planning.

#### `Task`

Represents a task attached to a `UserState`:

- `title`
- `body`
- `remaining_hours`
- `priority_level`
- `energy_required`
- `status`
- `level`
- `deadline`
- `created_at`

The task status system supports:

- `pending`
- `delayed`
- `in_progress`
- `finished`
- `dropped`
- `cancelled`
- `missed`
- `not_yet_started`

#### `ScheduleRequest`

Represents a scheduling request for a specific user:

- `user`
- `available_hours`
- `created_at`

This is the trigger record for plan generation.

#### `ScheduleState`

Stores computed schedule metrics derived from tasks, user state, and availability:

- `total_task_hours`
- `overload_hours`
- `capacity_hours`
- `overloaded`
- `fatigue_score`
- `effective_energy`

This acts as a persisted snapshot of the user's scheduling situation at request time.

#### `PlanDecision`

Stores the final chosen recommendation:

- `selected_plan`
- `score`
- `metrics`
- `created_at`

This is intended to persist the output of the pipeline after all plans are generated and evaluated.

### API Endpoints

The backend exposes DRF `ModelViewSet`s for:

- `user-states`
- `tasks`
- `schedule-requests`

Current API capabilities include:

- full CRUD for user states
- full CRUD for tasks
- full CRUD for schedule requests
- filtering tasks by `?user=<id>`
- filtering schedule requests by `?user=<id>`

There is also a custom action:

- `POST /api/schedule-requests/generate_plan/`

This endpoint is intended to:

1. create a `ScheduleRequest`
2. run the full planning pipeline
3. save the final decision
4. return recommendation/debug data

### Validation Rules

Serializer validation currently enforces:

- `remaining_hours` must be non-negative
- task `deadline` must be in the future
- `available_hours` must be non-negative

## Planning Pipeline Functionality

The most distinctive part of the repository is the backend planning engine in `schedly/schedlyapp/services` and `schedly/schedlyapp/agents`.

### Layer 1: Schedule State Computation

Implemented in `services/compute_schedule_state.py`.

This computes:

- total task hours
- capacity hours
- overload hours
- overload flag
- fatigue score from a fatigue map
- effective energy from energy minus fatigue

Mappings used:

- fatigue: `low=0.1`, `medium=0.3`, `high=0.5`
- energy: `low=0.3`, `medium=0.6`, `high=0.9`

This produces the numeric state that later layers use.

### Layer 2: Constraint Detection

Implemented in `services/detect_constraints.py`.

This derives qualitative risk signals from the computed state:

- overload risk
- execution risk
- fatigue risk
- stability

Examples of classifications:

- low/moderate/high overload risk
- low/moderate/high execution risk
- stable/strained/unstable

This layer turns raw numbers into policy-style signals for the LLM agents.

### Layer 3: Plan Generation and Critique

Implemented in:

- `agents/planner.py`
- `agents/critic.py`
- `agents/layer_3.py`

#### Agent 1: Planner

The planner uses a Hugging Face-hosted LLM through LangChain to generate exactly three plan styles:

- `conservative`
- `balanced`
- `aggressive`

Each plan contains actions for tasks such as:

- `proceed`
- `compress`
- `delay`
- `drop`
- `miss`
- `outsource`

The planner prompt emphasizes:

- grounding against real task IDs
- differing risk tolerance across the three plans
- compress actions requiring `new_hours`
- JSON-only output

The planner also adds a validation report that checks:

- all three plan types exist
- all actions reference known task IDs
- `compress` actions include `new_hours`

#### Agent 2: Critic

The critic reviews Agent 1's plans and mutates actions only when certain grounding rules fire.

Its responsibilities include:

- reviewing each plan against state and constraints
- identifying unsafe `proceed` actions
- replacing actions with safer alternatives like `compress` or `delay`
- building a new set of mutated plans

It returns:

- per-plan critiques
- mutations
- unchanged task references
- merged mutated plans for scoring

It also validates:

- all three plan types were critiqued
- mutations reference known task IDs
- compress mutations include `new_hours`

#### Layer 3 Orchestrator

`agents/layer_3.py` runs:

1. planner
2. critic

and returns:

- original plans
- mutated plans
- planner reasoning
- critic feedback

### Layer 4: Simulation and Scoring

Implemented in `agents/simulator.py`.

This layer simulates all plans in parallel and computes a score for each one.

It combines:

- deterministic mathematical scoring
- a short LLM-generated plain-language explanation per plan

#### Metrics Computed

For each plan, the simulator calculates:

- `completion_rate`
- `fatigue_end`
- `overload_delta`
- `stability`
- overall `score`

The score uses weighted factors:

- 35% completion
- 30% fatigue protection
- 20% overload relief
- 15% stability

It returns:

- all simulation results
- benchmark timing
- the mathematically highest-scoring plan

### Layer 5: Final Decision Agent

Implemented in `agents/decision.py`.

This agent reads:

- user state
- planner reasoning
- critic output
- all simulation results
- best math-only plan

It then selects a final plan and returns:

- selected plan type
- score
- metrics
- short reasoning

The decision is meant to consider safety and not just the highest raw score.

### Pipeline Orchestration

The full orchestration is in `services/pipeline.py`.

It performs the following flow:

1. load active tasks for the user
2. map ORM models into domain dictionaries
3. compute schedule state
4. save `ScheduleState`
5. detect constraints
6. run Layer 3
7. run Layer 4
8. run Layer 5
9. return final decision plus detailed debug data

The pipeline returns a structured payload containing:

- `plan_decision`
- `debug.agent1`
- `debug.agent2`
- `debug.layer4`

## Frontend Functionality

The frontend is a single-page React dashboard under `frontend/src`.

### App Structure

Routing is minimal:

- `/` renders the `Dashboard`

The dashboard coordinates shared state for:

- tasks
- active user
- active user state
- theme selection
- modal visibility
- API errors

### Main User Experience

The UI is organized into widgets:

#### User Status Widget

`components/UserStatusWidget.tsx`

This widget allows the user to:

- set available hours
- set sleep hours
- adjust fatigue via slider
- adjust energy via slider
- save the current state to the backend
- request suggested task plans from the scheduling API

It also:

- opens a suggestions modal after saving
- shows loading phases
- displays returned plans
- lets the user choose one returned plan
- converts the selected plan into tasks added back into the UI

#### Add Task Widget

`components/AddTaskWidget.tsx`

Lets the user create tasks by entering:

- task name
- description
- deadline
- intensity

#### To Do List Widget

`components/ToDoListWidget.tsx`

Shows tasks due today and supports:

- toggling finished/pending
- inline editing
- changing intensity
- changing status
- deleting tasks

#### Calendar Widget

`components/CalendarWidget.tsx`

Displays a calendar with markers for dates that have tasks and opens a task modal when a date is selected.

#### Progress Widget

`components/ProgressWidget.tsx`

Shows:

- status counts derived from live tasks
- a chart for daily/weekly/monthly progress

The status counters are real, but the chart data itself is currently mock data.

#### Task Modal

`components/TaskModal.tsx`

Although not reviewed in depth here, it is wired from the dashboard to show tasks for a selected calendar date and supports task updates/deletes.

### Frontend API Layer

The frontend uses Axios wrappers in:

- `src/lib/api.ts`
- `src/lib/endpoints.ts`

Supported frontend API calls include:

- list/create/update/delete user states
- list/create/update/delete tasks
- list/create/update/delete schedule requests
- generate plan suggestions

### Frontend Data Mapping

The dashboard maps backend fields into UI fields:

- backend `level` maps to UI `intensity`
- backend `not_yet_started` maps to UI `not yet started`

The frontend also creates a default user state if none exists, then loads tasks for that first user.

### Theming

The dashboard includes a theme picker with multiple palette options and theme variables, giving the UI a more designed dashboard feel instead of a plain admin-style layout.

## Domain and Mapping Layer

The backend includes a `domain/` folder with enums, entities, and mappers.

Its purpose is to translate Django ORM objects into plain task/user/request data structures for pipeline use. This helps keep the planning logic closer to domain dictionaries than direct model objects.

## Test and Research Assets

The `testing/` folder contains standalone scripts for:

- schedule state computation
- constraint detection
- planner behavior
- critic behavior
- layer 3 pipeline behavior

These are not structured as a formal automated Django/pytest suite. They function more like sandbox or prototype scripts for validating the layered planning approach.

The repository also includes:

- `tasks.json`
- `state.json`
- `constraint.json`

which appear to be sample inputs for local layer testing.

## Dependencies and External Services

### Backend Dependencies

Key backend dependencies include:

- Django
- Django REST Framework
- drf-spectacular
- django-cors-headers
- LangChain components
- Hugging Face Hub tooling
- python-dotenv

The requirements file also includes Celery/Redis-related packages, but there is no clear active Celery integration in the reviewed application code.

### Frontend Dependencies

Key frontend libraries include:

- React 18
- Vite
- Axios
- React Router
- Recharts
- React Day Picker
- Lucide icons
- Radix UI primitives

### LLM Dependency

The planning agents depend on:

- `HUGGINGFACEHUB_API_TOKEN`
- the Hugging Face model `Qwen/Qwen2-7B-Instruct:featherless-ai`

Without that token, the planner, critic, simulator interpretation, and decision agent will fail.

## Deployment and Runtime Notes

### Local Backend

The backend is expected to run from `schedly/manage.py` with SQLite.

### Local Frontend

The frontend runs via Vite on port `5173`.

### Docker

The provided `docker-compose.yml` only defines the frontend service. It expects the backend to be available separately, with the frontend container pointing at `http://host.docker.internal:8000`.

## Current Implementation Notes and Gaps

The repository has a strong concept and a fairly complete architectural outline, but some parts are still in prototype/integration state.

Important examples:

- The schedule generation view in `schedlyapp/views.py` references variables like `tasks`, `schedule_state`, `constraints`, and `decision` that are not defined in the method.
- `run_planning_pipeline()` currently expects a `schedule_request` object, but the view calls it with keyword arguments that do not match that signature.
- The pipeline calls `decide(..., request_data)`, while `decide()` is typed/documented as taking a `schedule_request_id`; it still returns the value under the `schedule_request` key, but the interface is inconsistent.
- The frontend expects a `reasoning/plans` style response for generated suggestions, while the backend code currently appears to return a `decision/debug` payload shape.
- The progress chart uses mock trend data rather than backend-derived history.
- The frontend "save selected plan as tasks" flow adds new UI tasks based on plan actions, but those generated tasks are simplified and may not preserve the original task metadata fully.

So the repository currently represents:

- a working CRUD-oriented task dashboard
- a designed AI scheduling architecture
- a partially integrated backend planning pipeline
- a frontend suggestion workflow that expects that pipeline to be fully connected

## Practical Summary

In functional terms, this project is trying to be a **smart task scheduling assistant** that combines:

- personal state tracking
- task management
- health-aware workload analysis
- multi-strategy plan generation
- critique and mutation of plans
- mathematical simulation and scoring
- final AI recommendation

Today, the codebase already contains most of the major building blocks for that system, especially the planning architecture and the dashboard UI. The main remaining work is integration hardening so the `generate_plan` endpoint and frontend suggestion flow behave consistently from end to end.
