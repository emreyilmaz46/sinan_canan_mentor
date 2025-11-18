from backend.datamodels import SimulationPersona, SimulationContext
import os
from dotenv import load_dotenv

# Load environment variables to access agent IDs
load_dotenv()

def get_preset_personas():
    """
    Returns a list of predefined SimulationPersona objects.
    Agent IDs are loaded from environment variables.
    """
    # Get agent IDs from environment variables
    engin_agent_id = os.getenv("ENGIN_AGENT_ID")
    merve_agent_id = os.getenv("MERVE_AGENT_ID")
    sinan_canan_agent_id = os.getenv("SINAN_CANAN_AGENT_ID")

    # Define preset personas
    engin = SimulationPersona(
        id="engin",
        name="Engin",
        role="Genç Takım Üyesi",
        agent_id=engin_agent_id,
        image="https://v3.fal.media/files/elephant/S9eRxtBQ-zHozj9-2-4aX_output.png",
        description="Engin, 24 yaşında ve ekibe yeni katılmış genç bir takım üyesidir. İyi bir üniversiteden yüksek not ortalamasıyla mezun olmuş, potansiyeli yüksek bir çalışan olarak görülmektedir. Sık sık aldığı övgüler sayesinde özgüveni oldukça yüksektir; bu durum, çoğunlukla pozitif olsa da zaman zaman iletişimde güçlükler yaratabilmektedir. Önceki ortamlarda sergilediği üstün performansla dikkat çeken Engin, yeni iş ortamında da aynı başarıyı sürdürmeye çalışırken içten içe kaygı duyar. Bu kaygılarını her şeyi bilirim veya tek başıma hallederim tavrıyla gizlemeye çalışır. Ekip ve yöneticisi tarafından kabul görmek, takdir edilmek onun için önemlidir; ancak geri bildirim anlarında eleştiriyi kendi yeterliliğine yönelik bir tehdit gibi algılayıp savunmaya geçebilir.",
        scenario=SimulationContext(
            title="Etkili Geri Bildirim: Ekibin Yeni ve Genç Üyesi",
            description="Siz bir mühendislik ekibinin müdürüsünüz ve son zamanlarda ekibinizin teslim ettiği ürünlerle ilgili hata oranlarında gözle görülür bir artış yaşandığı raporlanmaya başladı. Buna ilişkin bir inceleme yaptığınızda, ekibinizin yeni ve genç üyesi Engin’in zorlandığı teknik problemlerle ilgili daha deneyimli takım arkadaşlarından destek almak yerine gereğinden fazla mesai yaparak işleri yetiştirmeye çalıştığını fark ettiniz. Bu durum, Engin’in artan yorgunluk ve süre baskısı altında normalden daha fazla hata yapmasına sebep oluyor gibi görünüyor. Sonuç odaklı ve iş birliğine önem veren şirket kültürünüzde, bu tutum hem projenin kalitesini hem de Engin’in motivasyonunu olumsuz etkiliyor. Günlük yoğunluğunuza rağmen Engin’i kısa bir görüşmeye davet ettiniz. Amacınız, bu geri bildirim sürecinde Engin’in kendi hatalarını ve davranışlarını objektif bir şekilde görmesini sağlamak, ona daha sağlıklı çalışma yöntemleri konusunda yol göstererek performansını ve motivasyonunu artırmak. Toplam 4-5 dakikanızın olduğu bu görüşmede Engin’i hem bilgilendirmeniz hem de geliştirecek bir yaklaşım sunmanız beklenmektedir.",
            goal="SBI modelini kullanarak Engin'e etkili bir geri bildirim vermelisiniz. Bu görüşme sonrasında Engin'in, kendisine verdiğiniz tavsiyeleri ve iyileştirme önerilerini hem doğru biçimde anladığından emin olmalı hem de Engin'i bunları dikkate alarak davranışlarını değiştirmeye ikna etmelisiniz."
        )
    )

    merve = SimulationPersona(
        id="merve",
        name="Merve",
        role="İnsan Kaynakları Direktörü",
        agent_id=merve_agent_id,
        image="https://v3.fal.media/files/monkey/qbpmtkUZTmakD-j5tZvXo_image.webp",
        description="""Merve Hanım, 42 yaşında ve oldukça deneyimli bir insan kaynakları profesyonelidir. Son yıllarda hızla büyüyen bir sanayi kuruluşunda İnsan Kaynakları Direktörü olarak çalışmaktadır. 15 yıllık İK tecrübesinde pek çok farklı pozisyonda bulunmuş ve mesleğini çok seven bir yöneticidir. Duygusallıktan uzak, tamamen analitik ve sonuç odaklı düşünen bir mizacı vardır. İşlerini yürütürken, önceden zihninde belirlediği hedeflere hitap etmeyen meselelere minimum zaman ayırmak ister. Bir an önce ana konuya gelmeyi ve kendi işine yarayacak bir bilgi ya da çözüm olup olmadığını önemser. Onun saygısını kazanmak kolay değildir. Yaptığı işte uzman olduğuna emin olmadığı kişilere karşı başlangıçta hep mesafeli ve şüpheci yaklaşır. Şirketi son iki yılda çalışan sayısını iki kattan fazla arttırmıştır. Bu agresif büyüme sürecinde kurulan pek çok yeni birim için hızlı ve etkili bir şekilde yönetici yetiştirmek ihtiyacı ortaya çıkmıştır. Uzun süredir Merve Hanım'ın bir numaralı gündemi budur.
        """,
        scenario=SimulationContext(
            title="Satış Fırsatı Oluşturm: Yeni Bir Liderlik Programı",
            description="""Gelişim Laboratuvarı isimli bir kurumsal eğitim şirketinin satış liderisiniz. Şirketiniz, çok sayıda kurumsal firmaya davranışsal beceriler ve yönetici gelişim programları tasarlayan ve gerçekleştiren bir eğitim danışmanlık şirketi. Rutin ziyaretlerinizden farklı olarak bu defa müşterinin talebiyle, 'en kısa sürede' denilerek ayarlanan bir görüşme için birim yöneticisinin odasındasınız.

Toplantıyı ayarlayan çalışanların söylediği kadarıyla bu defa standart bir çözümden çok o kurumun spesifik ihtiyaçlarına göre tasarlanacak bir liderlik programına ihtiyaç var. Daha önce de ziyaret ettiğiniz bu kurum hızlı biçimde büyüyen ancak bütçe hassasiyetinin de yüksek olduğu bir süreçten geçiyor. Kulağınıza gelen duyumlara göre, bu ihtiyaç için görüşmeye davet edilen tek eğitim danışmanlık şirketi de siz değilsiniz.

Ana gündemin liderlik ve yöneticilik becerileri özelinde bir program olacağı net gibi görünüyor. Ancak bunun dışında ne gibi spesifik beklentiler olduğuna dair önceden bilgi verilmedi. O yüzden bu kısa görüşmede hem karşın temel önceliklerini anlamalı hem de rakiplerin önerebileceği genel geçer çözümlerden nasıl farklılaşabileceğinizi kestirmeniz gerekebilir.
            """,
            goal="""İnsan Kaynakları Direktörü Merve Hanım’ın hangi konuda direnç göstereceğini ve sizden ne tür bir çözüm veya destek beklediğini doğru tespit etmelisiniz. Akut ihtiyacı hızlıca anlamanız ve inisiyatif alarak kurumun hassasiyetlerini olası rakiplerin yaklaşımlarından daha iyi adresleyen bir çözüm vaat edebilmeniz önemli olacak. Bu etkileşimin sonunda nihai amacınız, program tasarımı ve bütçe ayrıntılarını içeren bir teklif vermek üzere müşterinin talepte bulunmasını sağlamaktır.
            """
        )
    )

    # Define Sinan Canan persona for mentor app
    sinan_canan = SimulationPersona(
        id="sinan_canan",
        name="Prof. Dr. Sinan Canan",
        role="Psikolog, Yazar, Eğitmen",
        agent_id=sinan_canan_agent_id,
        image="https://ik.imagekit.io/6iek12r3y/sinan-canan.jpeg",
        description="Prof. Dr. Sinan Canan, Türkiye'nin önde gelen psikologlarından biri olup, onlarca kitap yazmış, yüzlerce makale kaleme almış, çok sayıda konuşma ve röportaj vermiş deneyimli bir akademisyen ve eğitmendir. Kişisel gelişim, liderlik, iletişim ve psikoloji alanlarında uzman olan Sinan Hoca, geniş bir takipçi kitlesine sahiptir ve medyada sıkça yer almaktadır. Danışanlarına pratik ve uygulanabilir tavsiyelerde bulunur, karmaşık konuları anlaşılır bir dille açıklar.",
        scenario=SimulationContext(
            title="Sinan Hoca ile Kişisel Mentörlük",
            description="Prof. Dr. Sinan Canan ile birebir kişisel mentörlük seansı. Kariyeriniz, kişisel gelişiminiz, liderlik beceriniz, iletişim tarzınız veya hayatınızla ilgili herhangi bir konuda onun deneyiminden faydalanabilirsiniz. Sinan Hoca, psikoloji alanındaki derin bilgisi ve praktik yaklaşımıyla size rehberlik edecek, sorularınızı yanıtlayacak ve kişisel hedefinize ulaşmanız için önerilerde bulunacaktır.",
            goal="Sinan Hoca ile samimi ve yapıcı bir konuşma gerçekleştirerek, kişisel veya profesyonel hedefleriniz doğrultusunda değerli tavsiyeler alın. Bu serbest format konuşmada istediğiniz konuları ele alabilir, sorularınızı sorabilir ve onun deneyiminden faydalanabilirsiniz."
        )
    )

    # Return list of all preset personas
    return [engin, merve, sinan_canan]