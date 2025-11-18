from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from elevenlabs import ElevenLabs
from dotenv import load_dotenv
import os
import json
from openai import OpenAI
from models import ConversationAnalysisResponse, SourceDocument, CatchPhrase, ConversationCatchup
import httpx

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


async def get_conversation_from_elevenlabs(conversation_id):
    """Get conversation from ElevenLabs"""
    print(f"Getting conversation for ID: {conversation_id}")
    url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
    max_attempts = 10
    for attempt in range(1, max_attempts + 1):
        print(f'Polling attempt {attempt}/{max_attempts} for conversation {conversation_id}')
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers={"xi-api-key": os.getenv("XI_API_KEY")}
                )
                response.raise_for_status()
                data = response.json()
                if data.get('transcript',[]) != []:
                    print(f"Retrieved assessment data for ID: {conversation_id}")
                    return data
            except Exception as e:
                print(f"Error fetching assessment: {str(e)}")
                raise

def get_top_documents(conversation):
    """Get top 3 documents from conversation"""
    all_chunks = []

    # Get all chunks from transcript
    for entry in conversation['transcript']:
        rag_info = entry['rag_retrieval_info']
        print(f"RAG info: {rag_info}")
        if rag_info:
            for chunk in rag_info['chunks']:
                all_chunks.append({
                    'document_id': chunk['document_id'],
                    'chunk_id': chunk['chunk_id'],
                    'vector_distance': chunk['vector_distance']
                })
                print(f"Chunk: {chunk}")
                print(f"Chunk document id: {chunk['document_id']}")
                print(f"Chunk chunk id: {chunk['chunk_id']}")
                print(f"Chunk vector distance: {chunk['vector_distance']}")
                print("--------------------------------")
    
    # Sort and get top 3 unique documents
    all_chunks.sort(key=lambda x: x['vector_distance'])
    seen_docs = set()
    top_chunks = []
    for chunk in all_chunks:
        if chunk['document_id'] not in seen_docs and len(top_chunks) < 3:
            seen_docs.add(chunk['document_id'])
            top_chunks.append(chunk)
    print(f"Top chunks: {top_chunks}")
    # Add document names
    doc_names = {
        '6n8jkk10ZexkueKk4eHM': 'Hayalini Yorganına Göre Uzat TEDx',
        'yTRbeWQ2SnmuxSKDfDQs': 'Emrah Safa Gürkan YouTube Programı',
        'udo19y2bATQQonQje5bq': 'Emrah Safa Gürkan YouTube Programı',
        'qdLnliHwu2kRlqlVak76': 'Emrah Safa Gürkan YouTube Programı',
        'gpNBDQFh5KTVUTYeqrIo': 'Emrah Safa Gürkan YouTube Programı',
        'UftqzB2H2C5nZSOVfoVF': 'Emrah Safa Gürkan YouTube Programı',
        'IG5uedNpggtH1wLLlKpS': 'Emrah Safa Gürkan YouTube Programı',
        'HPctSU6KSLq0onxys6ls': 'Emrah Safa Gürkan YouTube Programı',
        'HC8NKVnlYrSCXxUzYChF': 'Emrah Safa Gürkan YouTube Programı',
        'Fg0yCCXzL7rAJsZgDW9z': 'Emrah Safa Gürkan YouTube Programı',
        '4xQnpZwGng2CUgv6OqMp': 'Emrah Safa Gürkan YouTube Programı',
        '460d6f3BpakKNsYNfDse': 'Emrah Safa Gürkan YouTube Programı',
        '2Ruj1XNQeikThS6Nlr9o': 'Emrah Safa Gürkan YouTube Programı',
        'y1pfpzeIzxGvuI0drNWT': 'Duygu Gecü YouTube Programı',
        'xTlJ6NRzailUZEhSJ8Tk': 'Duygu Gecü YouTube Programı',
        'ubxNRvMylWNdUCUY13cY': 'Duygu Gecü YouTube Programı',
        's9sDi2ZdiQJ2Imxw9nfD': 'Duygu Gecü YouTube Programı',
        'pQyyhhn9r6pYE8EPYqE4': 'Duygu Gecü YouTube Programı',
        'hPt4n2jUoBufe6Y1G1qN': 'Duygu Gecü YouTube Programı',
        'VJTqBtu6yUfmhM3xEGA9': 'Duygu Gecü YouTube Programı',
        'Qxi2ojLF3CUzu0rlebOe': 'Duygu Gecü YouTube Programı',
        'QMWtWFnmQ1LKHxaEk4Id': 'Duygu Gecü YouTube Programı',
        'KukAn9QEQLEgm5V6AfoZ': 'Duygu Gecü YouTube Programı',
        '1WCa6VPoobPnfhzj0dPt': 'Duygu Gecü YouTube Programı',
        'yubajAbH325ddYDFbrjp': 'Ceyda Düvenci YouTube Programı',
        'p0VmFBCnvVMb66Gks4dw': 'Ceyda Düvenci YouTube Programı',
        'hewrUf211InjEqwiZIqC': 'Ceyda Düvenci YouTube Programı',
        'VzvJmkQkslztcQnxLkKe': 'Ceyda Düvenci YouTube Programı',
        'LTJJ6oJjuJezMWjAB9cq': 'Ceyda Düvenci YouTube Programı',
        'EpvMhodbLoMCRPMWeX0z': 'Ceyda Düvenci YouTube Programı',
        '6MmUWrcr9morxPhESZNh': 'Ceyda Düvenci YouTube Programı',
        '32lw1tGLZk5XjRnXQjRF': 'Ceyda Düvenci YouTube Programı',
        '2H8qUDQ14nmmdodf6Ab2': 'Ceyda Düvenci YouTube Programı',
        'zkSur93DJdGz74HXOc2a': 'Cansu Canan Özgen YouTube Programı',
        'zjewEpgeS6A78WGUcwpq': 'Cansu Canan Özgen YouTube Programı',
        'xKUgugvuhG8dXHL2GCFf': 'Cansu Canan Özgen YouTube Programı',
        'x6kjk2546qcf1aHmLP4g': 'Cansu Canan Özgen YouTube Programı',
        'akQrGBILuDzN3ExO0E5m': 'Cansu Canan Özgen YouTube Programı',
        'CXUCtyHSoDxjAHgNqJGw': 'Cansu Canan Özgen YouTube Programı',
        '39CWaWc8wLwYZL5g7J3A': 'Cansu Canan Özgen YouTube Programı',
        '2GIS0BHPH1ZaCvAhuoV1': 'Cansu Canan Özgen YouTube Programı',
        'm2FICLNXc5cTFc4D7FvT': 'Cansu Canan Özgen YouTube Programı',
        'kzKNtrSwp11SezxsnrOw': 'Cansu Canan Özgen YouTube Programı',
        'gCyklvo4bjBw0ZYe7zbB': 'Cansu Canan Özgen YouTube Programı',
        'c51m9mZtTZakm45SmyjA': 'Cansu Canan Özgen YouTube Programı',
        'bgykKnIQHnZS6ugh1t6T': 'Cansu Canan Özgen YouTube Programı',
        'ZZdoPn2iws2c4IlVij36': 'Cansu Canan Özgen YouTube Programı',
        'Vrm58ILoOJaDsZyXlTPX': 'Cansu Canan Özgen YouTube Programı',
        'LMCY0CBOMcpGaqp8h496': 'Cansu Canan Özgen YouTube Programı',
        'L9wi0o091zsEKbXHGHA8': 'Cansu Canan Özgen YouTube Programı',
        'CKhhDDGN10obVtT11Ust': 'Cansu Canan Özgen YouTube Programı',
        'jeHPBvb3ZGQC6NEtnNXS': 'Burcu Esmersoy YouTube Programı',
        'hwQHOwvtqkj3BA0zX9Yj': 'Burcu Esmersoy YouTube Programı',
        'cBsELMIBhAChCisfT2XH': 'Burcu Esmersoy YouTube Programı',
        'WcjGKe2Qvm5p9dtQgUzn': 'Burcu Esmersoy YouTube Programı',
        'VPDT1WuaS7OSbNIwscbT': 'Burcu Esmersoy YouTube Programı',
        'UvdlrxzdodTcwtwyUHeg': 'Burcu Esmersoy YouTube Programı',
        'C7Xns2s5tFYvCKpRFQT3': 'Burcu Esmersoy YouTube Programı',
        '77bMoKEozzRTpOcskxSl': 'Burcu Esmersoy YouTube Programı',
        '6OoKqgjYcPU20CGJF1j5': 'Burcu Esmersoy YouTube Programı',
        '4aECi6DVagc4VjNFqsUU': 'Burcu Esmersoy YouTube Programı',
        '1dRAeMQXyGPluhMa4DoT': 'Burcu Esmersoy YouTube Programı',
        'wf9rIhJhs6WyYhggyCG1': 'Armağan Çağlayan YouTube Programı',
        'uT6F1R8cEYITsxfbkdfs': 'Armağan Çağlayan YouTube Programı',
        'tEmktSyLc9f3GT4h35bf': 'Armağan Çağlayan YouTube Programı',
        'sqz96XTFz8GUNsSizFT5': 'Armağan Çağlayan YouTube Programı',
        'nskH4HIQ14N9EyDeQjbD': 'Armağan Çağlayan YouTube Programı',
        'mc7CnsGfPMvYr780qWVf': 'Armağan Çağlayan YouTube Programı',
        'l22GodxynFNvKY3TYlU3': 'Armağan Çağlayan YouTube Programı',
        'hDUobDLBw5WQt1Xrg42T': 'Armağan Çağlayan YouTube Programı',
        'YpJDqqwfryIEYusRgJ9S': 'Armağan Çağlayan YouTube Programı',
        'R6uoe2LRfajvkGZHabKW': 'Armağan Çağlayan YouTube Programı',
        '9JIMbvF6b8IICiWP8F0d': 'Armağan Çağlayan YouTube Programı',
        '6QB4cidQuOIThv438UVc': 'Armağan Çağlayan YouTube Programı',
        '5hq08Im4GPplPhYxn95h': 'Armağan Çağlayan YouTube Programı',
        '1teRwwFVcIch4LeTsLy6': 'Armağan Çağlayan YouTube Programı',
        'vyaZu9uB5RAwgGwN20ak': 'Pınar Sabancı YouTube Programı',
        'ndjwDXJDxI2rDlizV0fC': 'Pınar Sabancı YouTube Programı',
        'frw4O7F6APxKjAhmVo3x': 'Pınar Sabancı YouTube Programı',
        'e39xrn6Jf64p3yrD0GRa': 'Pınar Sabancı YouTube Programı',
        'VJqM1weg4KkKJFX60Rlj': 'Pınar Sabancı YouTube Programı',
        'U5vClRZcekzxPz5Y1unC': 'Pınar Sabancı YouTube Programı',
        'QmARFCQnhko7LYs86DMS': 'Pınar Sabancı YouTube Programı',
        'Pa3gWTTzBn8UvMvxbsi2': 'Pınar Sabancı YouTube Programı',
        'Ml7kW5HyVGXjr9t8uQOq': 'Pınar Sabancı YouTube Programı',
        'F3NaPv3AIhAQ0nmpj8Q1': 'Pınar Sabancı YouTube Programı',
        'E3rhi7Ya8DyEnWqugJcV': 'Pınar Sabancı YouTube Programı',
        '7aGnrNBWK9dR9l9ecdGo': 'Pınar Sabancı YouTube Programı',
        '3fpDkIFWSO9SGogiCXUh': 'Pınar Sabancı YouTube Programı',
        '0dMfnGk6XMWu7UeZnRFx': 'Pınar Sabancı YouTube Programı',
        '0YHZFk7JbtUbBwLRGRUa': 'Pınar Sabancı YouTube Programı',
        'ICLuDsUBAWFhLRe2oGwp': 'Astroloji Hakkında',
        '8usIWxuVEpS7smymvroG': 'Gençlere öneriler',
        'StFlFvnCNj6JkAReBFhv': 'Sayılarla Ölçülmeyen Performans Yönetim Modeli',
        'mNnqLkUN8wEjLMDvKpu7': 'Çalışan Bağlılığı Efsanesi',
        'jres4nIUeB1HQN3X75w4': 'Liderlik eğitimleri',
        'Msohjd4Keac4iM2x5eI2': 'Anadolu’dan Evrensel Değerlere Şefkatli Liderlik',
        '7jhI5vJafGA50gEQvv4l': 'İş Hayatı',
        'Vg9ctMdMRgO4P7Ghlk2x': 'Kırılmamak için ne yapmak gerekiyor?',
        'UpTnSkdvoboWpyjMXniq': 'Hayatta Başarılı Olmak',
        'TxxaWsO9eaNF3hsPKvjX': 'Geleceğin liderlerini kendi içyapılarından yetiştirmek',
        'S3R7zsJDhNIWtxMofvzl': 'Enerjimizi doğru yere koymak',
        'CCHcNNZGe8kFkLPC6mgD': 'Çocukluk ne zaman biter?',
        '2wHZF7xQWirWAWYDOBgu': 'Liderlik Eğitimleri',
        'fXUDTq01m4JyUMWmzxEa': 'Yeni Yöneticinin El Kitabı',
        'YZhvxxfLwYPxGVdp3PoA': 'Liderlik Yolculuğu',
        'QATF16lcSUa2HnCZknlg': 'Biyografi',
        'TbhFhQVS9neD6uZ0Tlf1': 'Pınar Sabancı YouTube Programı',
        'q5JkrZv5degARn7ERHpJ': 'Pınar Sabancı YouTube Programı',
        'ThMi78u4P0ztigK2s5Fh': 'Psikolojik Sermaye- Olumluya Odaklanmak',
        'smady2nGBfoOWVj3NebT': 'Ceyda Düvenci YouTube Programı',
        'vK5zQHOeflB09Fy23M9d': 'Hayatın Hakkını Vermek TEDx ',
        'smMOfYHfiuqODJtTubUA': 'Hayatın Hakkını Vermek TEDx ',
        'lEMpZvicrKHkKsT2JdAw': 'Hayatın Hakkını Vermek TEDx ',
        'pUd0ev0x1oXxR9Qa0AXb': 'Hayatın Hakkını Vermek TEDx ',
        'x1Q1bAhHLFqWTSeWs1hW': 'Hayatın Hakkını Vermek TEDx ',
        'wT8NzDKApR5tAUaH5odR': 'Hayatın Hakkını Vermek TEDx ',
        'wCmpxUwb6y3Eza9hjJ3X': 'Hayatın Hakkını Vermek TEDx ',
        'VubSu5CtXoTSalSgkkgV': 'Hayatın Hakkını Vermek TEDx ',
        'UdUp2Q4N2467GEks2fa0': 'Hayatın Hakkını Vermek TEDx ',
        'TyG0vu5pC4vhVoI0kfcL': 'Hayatın Hakkını Vermek TEDx ',
        'T04YqqApdT6xEnBmISPS': 'Hayatın Hakkını Vermek TEDx ',
        '8vVbiub4HASrpR3OmLbL': 'Hayatın Hakkını Vermek TEDx ',
        '1PilDEZKZVz04qz2J9jE': 'Hayatın Hakkını Vermek TEDx ',
        '0QNkBtyWBDgTcKD7SQEt': 'Hayatın Hakkını Vermek TEDx ',
        'a1DpwAjCjhRX0ZVq3juE': 'Hayalini Yorganına Göre Uzat TEDx',
        'Ae2UnxxP0OyXb2ltsOXg': 'Hayalini Yorganına Göre Uzat TEDx',
        'AJK9Cbk7HQiCaWdTG8YZ': 'Hayalini Yorganına Göre Uzat TEDx',
        'stCGiF23IWayTFQzszH2': 'Hayalini Yorganına Göre Uzat TEDx',
        'o7SQrBVJDWWIfbJb5OxO': 'Hayalini Yorganına Göre Uzat TEDx',
        'm0BOWDNxmrbWaoEzIfVJ': 'Hayalini Yorganına Göre Uzat TEDx',
        'j6BVD496jfkdU3cxmTSP': 'Hayalini Yorganına Göre Uzat TEDx',
        'YRvDiHgoZ3pL3kAI9VN1': 'Hayalini Yorganına Göre Uzat TEDx',
        'Y8xh8BZcqCG9AtRPkzQi': 'Hayalini Yorganına Göre Uzat TEDx',
        'U3ZauRY4VIMOYfInBeSM': 'Hayalini Yorganına Göre Uzat TEDx',
        'SHlynXdPollwZlxOOfu3': 'Hayalini Yorganına Göre Uzat TEDx',
        'RVyrG2ngmCEH2XqLz54a': 'Hayalini Yorganına Göre Uzat TEDx',
        'K1T2PGYFAem7f6UuRxsn': 'Hayalini Yorganına Göre Uzat TEDx',
        'FdXQcSKBbeFup4ZfZYoG': 'Hayalini Yorganına Göre Uzat TEDx'
    }
    
    for chunk in top_chunks:
        chunk['document_name'] = doc_names.get(chunk['document_id'], 'Unknown Document')
        chunk['content_preview'] = "Sample content preview..."
    
    return top_chunks

def select_phrase(conversation):
    """Use OpenAI to select the most relevant phrase"""
    # Load phrases once at startup
    with open("phrases.json", "r", encoding="utf-8") as f:
        phrases_data = json.load(f)
    

    # Extract transcript
    transcript_text = ""
    for entry in conversation['transcript']:
        role = entry['role']
        message = entry['message']
        transcript_text += f"{role.upper()}: {message}\n"

    # Prepare phrases for selection
    phrases_text = ""
    phrases_list = phrases_data.get("leadership_phrases", [])
    for i, phrase_data in enumerate(phrases_list, 1):
        phrases_text += f"{i}. \"{phrase_data['phrase']}\" - {phrase_data['source']}\n"

    # Use OpenAI to select the most relevant phrase index (0-based)
    prompt = f"""Aşağıda bir konuşma transkripti ve Sinan Canan'a ait liderlik ile ilgili bazı özlü sözler (her biri numaralandırılmış) verilmiştir.

    KONUŞMA TRANSKRİPTİ:
    {transcript_text}

    Phrase Listesi:
    {phrases_text}

    Sana gördüğün gibi bir phrase listesi verdim ve bu liste 1'den 20'ye kadar numaralandırılmıştır. Lütfen transkripte en çok uyan, en alakalı olan phrase'in numarasını sadece sayı olarak ver. Hiçbir açıklama ekleme. Sadece en alakalı phrase'in numarasını yaz."""

    response = openai_client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": "Sen bir yardımcı asistanısın. Sadece istenen sayıyı döndür."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0,
        max_tokens=5
    )

    # Parse the index (OpenAI returns 1-based, we want 0-based)
    try:
        index_str = response.choices[0].message.content.strip()
        index = int(index_str)
        
        if 0 <= index < len(phrases_list):
            print(f"Selected phrase index: {index}")
            return CatchPhrase(**phrases_list[index-1])
        else:
            print(f"Fallback phrase index: {index}")
            return 0  # fallback to first if out of range
    except Exception as e:
        print(f"Error parsing phrase index: {e}")
        return 0

def analyze_conversation(conversation):
    """Use OpenAI to analyze the conversation"""
    # Extract transcript
    transcript_text = ""
    for entry in conversation['transcript']:
        role = entry['role']
        message = entry['message']
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

