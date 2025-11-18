from pydantic import BaseModel
from typing import List, Optional

class CatchPhrase(BaseModel):
    phrase: str
    source: str

class SourceDocument(BaseModel):
    document_id: str
    document_name: str
    chunk_id: str
    vector_distance: float
    content_preview: str

class ConversationCatchup(BaseModel):
    topic: str
    suggestions_from_sinan: str

class ConversationAnalysisResponse(BaseModel):
    catch_phrase: CatchPhrase
    top_sources: List[SourceDocument]
    conversation_catchup: ConversationCatchup
