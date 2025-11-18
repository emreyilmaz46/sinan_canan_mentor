from pydantic import BaseModel
from typing import Optional

class SimulationContext(BaseModel):
    """
    Represents the context for a simulation scenario,
    including title, description, and goal.
    """
    title: str
    description: str
    goal: str

class SimulationPersona(BaseModel):
    """
    Represents a simulation persona with all associated details,
    including their scenario context.
    """
    id: str
    name: str
    role: str
    agent_id: str
    image: str
    description: str
    scenario: SimulationContext 