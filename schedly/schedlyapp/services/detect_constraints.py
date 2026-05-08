def detect_constraints(state):
   total = state['total_task_hours']
   capacity = state['capacity_hours']
   fatigue = state['fatigue_score']
   energy = state['effective_energy']
   
   overload_ratio = total / capacity if capacity > 0 else float('inf')
   execution_risk = 0.5 * fatigue + 0.5 * (1 - energy)
   
   # overload risk
   if overload_ratio > 1.5:
         overload_risk = "High overload risk"      
   elif overload_ratio > 1.0:
         overload_risk = "Moderate overload risk"
   else:
         overload_risk = "Low overload risk"
   
   # execution risk
   if execution_risk > 0.7:
         exec_risk = "High execution risk"
   elif execution_risk > 0.4:
         exec_risk = "Moderate execution risk"
   else:
         exec_risk = "Low execution risk"
   
   # fatigue risk
   if fatigue > 0.4:
         fatigue_risk = "High fatigue risk"
   elif fatigue > 0.2:
         fatigue_risk = "Moderate fatigue risk"
   else:
         fatigue_risk = "Low fatigue risk"
   
   # stability risk
   if overload_risk == "High overload risk" and exec_risk == "High execution risk":
               stability = "unstable"
   elif overload_risk == "Moderate overload risk" or exec_risk == "Moderate execution risk":
               stability = "strained"
   else:
               stability = "stable"

   constraint = {
               "overload_risk": overload_risk,
               "execution_risk": exec_risk,
               "fatigue_risk": fatigue_risk,
               "stability": stability,
   }

   return constraint
