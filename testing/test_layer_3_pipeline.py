import json
from test_layer3 import run_layer3


def run_tests():
    print("\n==============================")
    print(" AGENT TESTING STARTED ")
    print("==============================\n")

    with open("tasks.json") as f:
        tasks = json.load(f)

    with open("state.json") as f:
        state = json.load(f)
    
    with open("constraint.json") as f:
        constraints = json.load(f)
        
    result = run_layer3(tasks, state, constraints)
    
    print("\n==============================")
    print (f"{json.dumps(result, indent=2)}")
    print(" AGENT TESTING COMPLETED ")
    
if __name__ == "__main__":
    run_tests()