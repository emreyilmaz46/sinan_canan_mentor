from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from elevenlabs import ElevenLabs
from dotenv import load_dotenv
import os
import json
from openai import OpenAI
from models import ConversationAnalysisResponse, SourceDocument, CatchPhrase, ConversationCatchup

load_dotenv()

app = FastAPI(title="Conversation Catchup API", version="1.0.0")

# Add CORS middleware to allow frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize clients
elevenlabs_client = ElevenLabs(api_key=os.getenv("XI_API_KEY"))
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Load phrases once at startup
with open("phrases.json", "r", encoding="utf-8") as f:
    phrases_data = json.load(f)

def get_conversation(conversation_id):
    """Get conversation from ElevenLabs"""
    return elevenlabs_client.conversational_ai.conversations.get(conversation_id)

def get_top_documents(conversation):
    """Get top 3 documents from conversation"""
    all_chunks = []
    
    # Get all chunks from transcript
    for entry in conversation.transcript:
        rag_info = getattr(entry, 'rag_retrieval_info', None)
        if rag_info and hasattr(rag_info, 'chunks') and rag_info.chunks:
            for chunk in rag_info.chunks:
                all_chunks.append({
                    'document_id': chunk.document_id,
                    'chunk_id': chunk.chunk_id,
                    'vector_distance': chunk.vector_distance
                })
    
    # Sort and get top 3 unique documents
    all_chunks.sort(key=lambda x: x['vector_distance'])
    seen_docs = set()
    top_chunks = []
    
    for chunk in all_chunks:
        if chunk['document_id'] not in seen_docs and len(top_chunks) < 3:
            seen_docs.add(chunk['document_id'])
            top_chunks.append(chunk)
    
    # Add document names
    doc_names = {
        'fXUDTq01m4JyUMWmzxEa': 'Sinan Canan - Yeni Yöneticinin El Kitabı',
        'YZhvxxfLwYPxGVdp3PoA': 'Sinan Canan - EP - Liderlik Yolculuğu',
        'QATF16lcSUa2HnCZknlg': 'Sinan Canan - Biyografi'
    }
    
    for chunk in top_chunks:
        chunk['document_name'] = doc_names.get(chunk['document_id'], 'Unknown Document')
        chunk['content_preview'] = "Sample content preview..."
    
    return top_chunks

def select_phrase(conversation):
    """Use OpenAI to select the most relevant phrase"""
    # Extract transcript
    transcript_text = ""
    for entry in conversation.transcript:
        role = getattr(entry, 'role', 'unknown')
        message = getattr(entry, 'message', '')
        transcript_text += f"{role.upper()}: {message}\n"
    
    # Prepare phrases for selection
    phrases_text = ""
    phrases_list = phrases_data.get("leadership_phrases", [])
    for i, phrase_data in enumerate(phrases_list, 1):
        phrases_text += f"{i}. \"{phrase_data['phrase']}\" - {phrase_data['source']}\n"
    
    prompt = f"""
    Aşağıda bir kullanıcı ile Sinan Canan AI arasında geçen liderlik konulu konuşma transkripti ve Sinan Canan'ın sözleri var.

    KONUŞMA TRANSKRİPTİ:
    {transcript_text}

    SİNAN CANAN'IN SÖZLERİ:
    {phrases_text}

    Görevin: Bu konuşmanın ana temasını, kullanıcının sorduğu sorular ve aldığı tavsiyeleri analiz ederek, konuşmanın ruhuna en uygun Sinan Canan sözünü seçmek.

    Analiz kriterleri:
    1. Konuşmanın ana konusu (liderlik, yönetim, takım, motivasyon, vs.)
    2. Kullanıcının hangi zorluklarla karşılaştığı
    3. Sinan Canan'ın verdiği tavsiyeler
    4. Konuşmanın genel mesajı ve öğretisi

    Bu analizi yaparak, konuşmanın özüne en uygun düşen sözün numarasını döndür.
    Sadece rakam ver. Örnek: "5"
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Sen liderlik ve yönetim alanında uzman bir analiz yapıcısın. Konuşma transkriptlerini derinlemesine analiz ederek, içeriğin ana temasına en uygun Sinan Canan sözünü seçebilirsin. Konuşmanın duygusal tonunu, ana mesajını ve öğretici değerini anlayarak en anlamlı seçimi yaparsın."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=5
    )
    
    selected_number = response.choices[0].message.content.strip()
    selected_index = int(selected_number) - 1
    
    if 0 <= selected_index < len(phrases_list):
        selected_phrase = phrases_list[selected_index]
        return CatchPhrase(phrase=selected_phrase["phrase"], source=selected_phrase["source"])
    
    # Fallback
    if phrases_list:
        return CatchPhrase(phrase=phrases_list[0]["phrase"], source=phrases_list[0]["source"])
    
    return CatchPhrase(phrase="Liderlik bir yolculuktur.", source="Sinan Canan")

def analyze_conversation(conversation):
    """Use OpenAI to analyze the conversation"""
    # Extract transcript
    transcript_text = ""
    for entry in conversation.transcript:
        role = getattr(entry, 'role', 'unknown')
        message = getattr(entry, 'message', '')
        transcript_text += f"{role.upper()}: {message}\n"
    
    prompt = f"""Bu Türkçe konuşma transkripti bir kullanıcı ile Sinan Canan kişiliğindeki AI agent arasında geçmiştir.

    KONUŞMA TRANSKRİPTİ:
    {transcript_text}

    Sen Sinan Canan'sın. Bu konuşmayı yapan kişiye hitap ederek, onunla konuştuğun konular hakkında çok detaylı, uzun ve kapsamlı bir analiz yap. 
    
    ÖNEMLI: Konuşma transkritinden Sinan Canan'ın üslubunu analiz ederek, onun ağzından ve üslubu ile üstten olmayan ama profesyonel ve destekleyici bir dil kullan.
    "Sen", "sana", "senin" diliyle hitap et. Çok samimi, babacan ve rehber bir dil kullan.
    Her paragraf uzun ve detaylı olsun (en az 4-5 cümle). Kişisel deneyimlerinden örnekler ver.
    
    JSON formatında şu alanları doldur:
    - topic: Konuşmanın ana konusunu Sinan Canan'ın üslubu ile çok detaylı açıkla (en az 5-6 cümle)
    - suggestions_from_sinan: Konuşma sırasında verilen tavsiyeleri, karşındaki kişinin odaklanması gereken alanları, bu konuşmanın önemli içgörülerini Sinan Canan'ın üslubu ile detaylandır (en az 10 cümle)
   
    Her alan çok uzun ve detaylı olsun. Sinan Canan'ın bilgeliğini, deneyimini ve sıcaklığını yansıt."""
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Sen Sinan Canan'sın. Ünlü psikolog, yazar ve eğitmensin. Yıllarca liderlik ve yönetim alanında çalıştın. Çok samimi, babacan ve bilge bir yaklaşımın var. Konuştuğun kişiye 'sen' diliyle hitap edersin ve onlara rehberlik edersin. Her cümlen deneyim ve bilgelik dolu. Uzun, detaylı ve içten analizler yaparsın."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.8,
        max_tokens=2500,
        response_format={"type": "json_object"}
    )
    
    analysis_json = json.loads(response.choices[0].message.content)
    return ConversationCatchup(**analysis_json)

@app.get("/conversation/{conversation_id}/catchup", response_model=ConversationAnalysisResponse)
def get_conversation_catchup(conversation_id: str):
    """Get conversation analysis"""
    
    print(f"Processing conversation catchup for ID: {conversation_id}")
    
    # Get conversation from ElevenLabs
    conversation = get_conversation(conversation_id)
    
    # Get top documents
    top_documents = get_top_documents(conversation)
    
    # Select phrase
    catch_phrase = select_phrase(conversation)
    
    # Analyze conversation
    conversation_catchup = analyze_conversation(conversation)
    
    # Prepare response
    source_documents = []
    for doc in top_documents:
        source_documents.append(SourceDocument(
            document_id=doc['document_id'],
            document_name=doc['document_name'],
            chunk_id=doc['chunk_id'],
            vector_distance=doc['vector_distance'],
            content_preview=doc['content_preview']
        ))
    
    return ConversationAnalysisResponse(
        catch_phrase=catch_phrase,
        top_sources=source_documents,
        conversation_catchup=conversation_catchup
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
