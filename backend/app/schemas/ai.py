from pydantic import BaseModel

class GenerateSceneRequest(BaseModel):
    scene_id: int
    prompt: str

class EditInlineRequest(BaseModel):
    selected_text: str
    instruction: str
