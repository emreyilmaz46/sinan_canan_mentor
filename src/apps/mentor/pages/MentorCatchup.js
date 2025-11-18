// MentorCatchup.js - Conversation catchup page for Mentor app
import { logInfo, logError } from '../../../shared/utils/utils.js';
import { getCurrentUser } from '../../../shared/auth/auth.js';
import { navigateToMentorRoute } from '../MentorApp.js';

const CONVERSATION_CATHUP_DATA = {
    "catch_phrase": {
        "phrase": "Akademik ayrıntılardan arındırırsak, lideri 'sonucu değiştiren kişi' olarak tanımlayabiliriz.",
        "source": "https://www.sinancanan.net/guven-duygusu-yaratmak/"
    },
    "top_sources": [
         {
             "document_id": "fXUDTq01m4JyUMWmzxEa",
             "document_name": "Hayalini Yorganına Göre Uzat TEDx",
             "chunk_id": "ImERMJDoekyLO5miItWP",
             "vector_distance": 0.061327338218688965,
             "content_preview": "Liderlik ve yönetim konularında temel prensipler ve uygulamalı yaklaşımlar. Genç liderlerin karşılaştığı zorluklar ve çözüm önerileri..."
         },
         {
             "document_id": "YZhvxxfLwYPxGVdp3PoA",
             "document_name": "Pınar Sabancı YouTube Programı",
             "chunk_id": "qa4BSEWdVTaMWJ6v8oDZ",
             "vector_distance": 0.06358420848846436,
             "content_preview": "Liderlik sürecinin farklı aşamaları ve kişisel gelişim stratejileri. Ekip yönetimi ve motivasyon teknikleri..."
         },
         {
             "document_id": "QATF16lcSUa2HnCZknlg",
             "document_name": "Hayatın Hakkını Vermek TEDx",
             "chunk_id": "NfgKPyFO4jWhN4AK4NUi",
             "vector_distance": 0.10075974464416504,
             "content_preview": "Sinan Canan'ın yaşam öyküsü ve mesleki deneyimleri. Psikolog, yazar ve eğitmen olarak kariyer yolculuğu..."
         }
    ],
    "conversation_catchup": {
        "topic": "Seninle yaptığımız bu sohbetin merkezinde, insanın içsel kaynaklarını ve hayatı anlamlandırma çabasını ele aldık. Özellikle psikolojik sermaye, yılmazlık ve Memento Mori gibi kavramlar üzerinden hayata, zorluklara ve liderliğe bakışımızı konuştuk. Biliyorsun, psikolojide yıllardır çalıştığım alanlardan biri de insanın kendi potansiyelini anlaması ve hayata daha dirençli yaklaşabilmesi. Senin soruların bana, yaşamın yalnızca bir mücadele değil; aynı zamanda bir büyüme, anlam ve katkı süreci olduğunu bir kez daha hatırlattı. Ölümün farkındalığıyla yaşamı daha değerli kılmak ve hayatın hakkını vermek, aslında kişisel gelişimin ve iyi bir liderliğin temel taşlarıdır. Yıllar boyu hem bireylerle hem de yöneticilerle çalışırken gördüm ki, kendine ve çevresine değer katmak isteyen herkesin önce kendi içsel gücünü tanıması ve hayatın geçiciliğini bilerek kararlar alması gerekiyor. Sohbetimizde senin de bu kavramları ne kadar içselleştirmeye niyetli olduğunu hissetmek bana ayrı bir mutluluk verdi.",
        "suggestions_from_sinan": `
            Konuşmamızda özellikle üzerinde durduğum noktalardan biri, psikolojik sermayenin dört temel unsuru: yılmazlık, umut, iyimserlik ve öz yeterlilik. 
            
            Sana da tavsiyem, kendi hayatında bu dört unsuru ayrı ayrı düşünmen ve hangisinin şu an senin için daha güçlendirilmeye ihtiyaç duyduğunu fark etmen olur. Mesela, yılmazlıkla ilgili en çok rastladığım yanılgı, sadece güçlü olup ayakta kalmakla sınırlanmasıdır. Oysa yılmazlık, düşüp tekrar ayağa kalkabilmektir; ama bununla birlikte umut, karanlıkta bile bir çıkış yolu olabileceğine inanmaktır. Öz yeterlilik ise, kendi becerilerine duyduğun güvenle adım atabilmek anlamına gelir. 
            
            İyimserlik ise, yaşanan olumsuzluklara rağmen hayatın sana iyi şeyler getirebileceğine dair inancını diri tutmandır. 
            
            Sana önereceğim şey, zaman zaman kendine şu soruları sorman: Hayat karşısında ne kadar esneğim, umudumu ne kadar besliyorum, kendime ne kadar güveniyorum ve zor zamanlarda iyimser kalabiliyor muyum? Memento Mori kavramı ise, bana her zaman şunu hatırlatır: Hayatın sınırlı olduğunu bilmek, bugünün kıymetini anlamak demektir. Ben kendi hayatımda da, zaman zaman durup 'Bugün gerçekten yaşadım mı?' diye kendime sorarım; sana da bunu öneririm. Liderlik meselesine gelince, sana söylediğim gibi, asıl amaç etrafındaki insanlara değer katmak ve onların potansiyellerini ortaya çıkarmak olmalı. Yıllar içinde gördüm ki, gerçek liderler 'Ben nasıl öne çıkarım?' sorusundan çok, 'Etrafımdakilerle birlikte nasıl büyüyebilirim?' sorusunu kendine soranlardır. 
            
            Yani, hem kendine hem çevrene karşı şefkatli ve anlam arayışı içinde olman, hem de yaptığın her işte iz bırakmayı hedeflemen çok kıymetli. Unutma, hayatın hakkını vermek, sana verilen zamanın ve enerjinin karşılığını en iyi şekilde ortaya koymak demektir. Bir lider olarak da, bir birey olarak da, kendini yaşama ve çevrene adamanın değerini hiçbir zaman küçümseme.
            `
    }
}

// Format text into separate paragraphs for better readability - UX Optimized
function formatTextIntoParagraphs(text) {
    if (!text) return '<p>Loading content...</p>';
    
    // Clean and normalize text
    const cleanText = text.trim().replace(/\s+/g, ' ');
    
    // Split by natural paragraph breaks or logical sentence groups
    const sentences = cleanText
        .split(/\.\s+(?=[A-ZÜĞŞÇÖI])|(?:\r?\n\s*){2,}/)
        .filter(sentence => sentence.trim().length > 0);
    
    // Create well-balanced paragraphs (3-4 sentences for optimal reading)
    const paragraphs = [];
    const sentencesPerParagraph = 3;
    
    for (let i = 0; i < sentences.length; i += sentencesPerParagraph) {
        const paragraphSentences = sentences.slice(i, i + sentencesPerParagraph);
        const paragraph = paragraphSentences.join('. ');
        
        if (paragraph.trim()) {
            // Ensure proper punctuation
            const finalParagraph = paragraph.endsWith('.') ? paragraph : paragraph + '.';
            paragraphs.push(`<p>${finalParagraph}</p>`);
        }
    }
    
    return paragraphs.length > 0 ? paragraphs.join('') : `<p>${cleanText}</p>`;
}

// Initialize the conversation catchup page
export async function initializeMentorCatchup(conversationId = null) {
    logInfo('Initializing Mentor catchup page', conversationId ? `with conversation ID: ${conversationId}` : 'without conversation ID');

    const container = document.getElementById('mentorContainer');
    if (!container) return;

    const user = getCurrentUser();
    
    // Show loading state immediately
    showCatchupLoadingState(container);
    
    // Load conversation catchup data
    const catchupData = await loadCatchupData(conversationId);
    
    // Show the actual content
    showCatchupContent(container, catchupData);
}

// Show loading state
function showCatchupLoadingState(container) {
    container.innerHTML = `
        <div class="mentor-catchup mentor-catchup-loading">
            <button class="mentor-back-btn mentor-back-btn-floating" id="mentorBackBtn">
                <i class="fas fa-arrow-left"></i>
            </button>
            
            <div class="mentor-catchup-content">
                <div class="mentor-catchup-intro">
                    <div class="mentor-catchup-avatar">
                        <img src="https://ik.imagekit.io/6iek12r3y/sinan-canan.jpeg" alt="Prof. Dr. Sinan Canan">
                    </div>
                    <h1>Your Conversation is Being Analyzed</h1>
                    <p class="mentor-catchup-subtitle">Sinan Hoca is evaluating your conversation and preparing personalized recommendations for you...</p>
                </div>
                
                <div class="mentor-loading-container">
                    <div class="mentor-loading-spinner">
                        <div class="mentor-spinner"></div>
                    </div>
                    <div class="mentor-loading-text">
                        <p class="mentor-loading-main">Your conversation is being analyzed</p>
                        <p class="mentor-loading-sub">This process may take approximately 10-15 seconds</p>
                    </div>
                </div>
                
                <div class="mentor-loading-steps">
                    <div class="mentor-loading-step mentor-loading-step-active">
                        <i class="fas fa-comments"></i>
                        <span>Processing conversation transcript</span>
                    </div>
                    <div class="mentor-loading-step">
                        <i class="fas fa-brain"></i>
                        <span>Running AI analysis</span>
                    </div>
                    <div class="mentor-loading-step">
                        <i class="fas fa-lightbulb"></i>
                        <span>Preparing recommendations</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup back button event listener
    const backBtn = document.getElementById('mentorBackBtn');
    backBtn?.addEventListener('click', () => {
        navigateToMentorRoute('/');
    });
    
    // Animate loading steps
    animateLoadingSteps();
}

// Animate loading steps
function animateLoadingSteps() {
    const steps = document.querySelectorAll('.mentor-loading-step');
    let currentStep = 0;
    
    const interval = setInterval(() => {
        // Remove active class from all steps
        steps.forEach(step => step.classList.remove('mentor-loading-step-active'));
        
        // Add active class to current step
        if (steps[currentStep]) {
            steps[currentStep].classList.add('mentor-loading-step-active');
        }
        
        currentStep = (currentStep + 1) % steps.length;
    }, 3000); // Change step every 3 seconds
    
    // Store interval ID to clear it later
    window.catchupLoadingInterval = interval;
}

// Show catchup content
function showCatchupContent(container, catchupData) {
    // Clear any loading intervals
    if (window.catchupLoadingInterval) {
        clearInterval(window.catchupLoadingInterval);
        window.catchupLoadingInterval = null;
    }
    
    container.innerHTML = `
        <div class="mentor-catchup">
            <button class="mentor-back-btn mentor-back-btn-floating" id="mentorBackBtn">
                <i class="fas fa-arrow-left"></i>
            </button>
            
            <div class="mentor-catchup-content">
                <div class="mentor-catchup-intro">
                    <div class="mentor-catchup-avatar">
                        <img src="https://ik.imagekit.io/6iek12r3y/sinan-canan.jpeg" alt="Prof. Dr. Sinan Canan">
                    </div>
                    <h1>Conversation Summary</h1>
                    <p class="mentor-catchup-subtitle">Key points from your conversation with Sinan Hoca</p>
                </div>
                
                <!-- Catch Phrase Section -->
                <div class="mentor-catchup-section">
                    <div class="mentor-catchup-card mentor-catchup-quote">
                        <div class="mentor-quote-icon">
                            <i class="fas fa-quote-left"></i>
                        </div>
                        <blockquote class="mentor-quote-text">
                            "${catchupData?.catch_phrase?.phrase || 'Trust, openness and honesty determine the extent to which cooperation will occur in a work environment.'}"
                        </blockquote>
                        <div class="mentor-quote-source">
                            <a href="${catchupData?.catch_phrase?.source || '#'}" target="_blank" rel="noopener noreferrer">
                                <i class="fas fa-external-link-alt"></i>
                                View source
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Conversation Summary Section -->
                <div class="mentor-catchup-section">
                    <h2 class="mentor-catchup-section-title">
                        <i class="fas fa-comments"></i>
                        Main Topic of Conversation
                    </h2>
                    <div class="mentor-catchup-card">
                        <div class="mentor-catchup-topic">
                            ${formatTextIntoParagraphs(catchupData?.conversation_catchup?.topic || 'Loading conversation summary...')}
                        </div>
                    </div>
                </div>
                
                <!-- Sinan's Suggestions Section -->
                <div class="mentor-catchup-section">
                    <h2 class="mentor-catchup-section-title">
                        <i class="fas fa-lightbulb"></i>
                        Recommendations from Sinan Hoca
                    </h2>
                    <div class="mentor-catchup-card">
                        <div class="mentor-catchup-suggestions">
                            ${formatTextIntoParagraphs(catchupData?.conversation_catchup?.suggestions_from_sinan || 'Loading recommendations...')}
                        </div>
                    </div>
                </div>
                
                <!-- Top Sources Section -->
                <div class="mentor-catchup-section">
                    <h2 class="mentor-catchup-section-title">
                        <i class="fas fa-book"></i>
                        Related Sources
                    </h2>
                    <div class="mentor-sources-grid">
                        ${renderTopSources(catchupData?.top_sources || [])}
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="mentor-catchup-actions">
                    <button class="mentor-action-btn mentor-action-btn-primary" id="mentorNewConversationBtn">
                        <i class="fas fa-microphone"></i>
                        <span>Start New Conversation</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    // Setup event listeners
    setupMentorCatchupEventListeners();
}

// Load conversation catchup data
async function loadCatchupData(conversationId = null) {
    try {
        logInfo('loadCatchupData called with conversationId:', conversationId);
        
        if (conversationId) {
            logInfo('Loading conversation catchup data from API for conversation ID:', conversationId);
            
            // Call the conversation catchup API
            const response = await fetch(`/conversation/${conversationId}/catchup`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                logInfo('Catchup data loaded successfully from API');
                return data;
            } else {
                logError('Failed to load catchup data from API, status:', response.status);
                throw new Error(`API returned status ${response.status}`);
            }
        } else {
            logInfo('No conversation ID provided, using embedded constant data');
            return CONVERSATION_CATHUP_DATA;
        }
        
    } catch (error) {
        logError('Error loading catchup data:', error);
        // Return the embedded data as fallback
        logInfo('Using fallback embedded data');
        return CONVERSATION_CATHUP_DATA;
    }
}

// Render top sources
function renderTopSources(sources) {
    if (!sources || sources.length === 0) {
        return `
            <div class="mentor-source-card mentor-source-placeholder">
                <div class="mentor-source-icon">
                    <i class="fas fa-book"></i>
                </div>
                <h3>Loading Sources</h3>
                <p>Related sources are loading...</p>
            </div>
        `;
    }

    return sources.map(source => `
        <div class="mentor-source-card">
            <div class="mentor-source-icon">
                <i class="fas fa-book-open"></i>
            </div>
            <h3>${source.document_name || 'Source'}</h3>
            <p class="mentor-source-preview">${source.content_preview || 'Preview not available'}</p>
            <div class="mentor-source-meta">
                <span class="mentor-source-distance">
                    <i class="fas fa-chart-line"></i>
                    Relevance: ${Math.round((1 - (source.vector_distance || 0)) * 100)}%
                </span>
            </div>
        </div>
    `).join('');
}

// Setup event listeners for catchup page
function setupMentorCatchupEventListeners() {
    const backBtn = document.getElementById('mentorBackBtn');
    const newConversationBtn = document.getElementById('mentorNewConversationBtn');

    // Back button
    backBtn?.addEventListener('click', () => {
        navigateToMentorRoute('/');
    });

    // New conversation button
    newConversationBtn?.addEventListener('click', () => {
        navigateToMentorRoute('/');
    });
}
