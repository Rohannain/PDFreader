import os
import pandas as pd
from langchain_community.llms import Ollama, CTransformers
from langchain_experimental.agents.agent_toolkits import create_csv_agent



# Load the CSV file
df = pd.read_csv('file1.csv')
#print(df.head())

# Initialize the LLM (Llama 3) via Ollama
llm = Ollama(model = "llama3")


# Create the agent executor with the LLM, the CSV file, and verbosity, allowing dangerous code
agent_executer = create_csv_agent(llm, 'file1.csv', verbose=True, allow_dangerous_code=True)

# Function to run the query loop
def query_loop():
    while True:
        query = input("Enter your query (or type 'exit' to quit): ")
        if query.lower() == 'exit':
            break
        try:
            response = agent_executer.invoke(query)
            print("Response:", response)
        except Exception as e:
            print(f"An error occurred: {e}")

# Run the query loop
if __name__ == "__main__":
    query_loop()
