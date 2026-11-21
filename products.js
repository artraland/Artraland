// ARTRA product details — one entry per art piece.
// Each field matches a question on the "ARTRA Product Detail" Google Form, in the same order, so a form
// response can be copied straight in. Leave a field as "" until it is known: empty fields are not shown.
//
// Languages: a text field can be plain text (shown in every language), or one text per language:
//   name: { en: "…", fr: "…", es: "…", ar: "…", fa: "…" }
// A language that is missing shows the English. Keep `category` in the same words as the craft names in i18n.js
// (c.enamel, c.metal, …) so "Enquire" can pick the craft in the commission form.
//
//   key          which animated drawing to show when there is no photo (vase, box, tray, lantern, mirror, carpet);
//                leave it "" for a piece shown from its photo
//   city         the Silk Road city it comes from, shown on the map (keys in silkroad.js: isfahan, shiraz, kashan,
//                zanjan, tabriz, samarkand, bukhara, …)
//   slug         the piece's address, /piece?p=<slug> (optional; otherwise made from key, ID or English name)
//   name         Product Name
//   category     Product Category
//   id           Product ID
//   photo        Photo link (a direct link to the high-quality image; replaces the drawing)
//   cutout       optional: the same photo with its background removed (PNG or WebP with transparency); when set,
//                the pages show it in place of the photo, and keep the full photo for the close-up
//   artist       Artist
//   origin       Origin of art piece (City / Country)
//   history      Art Piece history
//   description  Description
//   medium       Medium
//   dimensions   Dimensions (weight, height, width, depth)
//   packaging    Packaging Dimensions
//   additional   Additional Information
//   care         Care Instructions
//   returns      Returns and Exchanges
//   updated      Last update date
//
// The form's "Document Provider name" and "Date of document creation" are internal and are not shown on the site.
// The text below is sample wording for the six drawn pieces; replace it with the real form responses.
window.ARTRA_PRODUCTS = [
  {
    // A real piece, shown from its photo. Fill in the empty fields from its form response.
    key: "",
    slug: "engraved-lidded-vase",
    city: "isfahan",
    name: {
      en: "Engraved Lidded Vase",
      fr: "Vase couvert gravé",
      es: "Jarrón con tapa grabado",
      ar: "مزهرية منقوشة ذات غطاء",
      fa: "گلدان درب‌دار قلم‌زنی"
    },
    category: { en: "Engraved metal", fr: "Métal gravé", es: "Metal grabado", ar: "المعدن المنقوش", fa: "قلم‌زنی روی فلز" },
    id: "",
    photo: "/photos/engraved-lidded-vase.jpg",
    cutout: "/photos/engraved-lidded-vase-cutout.webp",
    artist: "",
    origin: "",
    history: {
      en: "Ghalamzani is the engraving of metal with a small hammer and fine steel chisels, a craft long associated with the bazaars of Isfahan. The pattern is drawn onto the metal, then cut into it line by line, so that light catches every stroke.",
      fr: "Le ghalamzani est la gravure du métal au petit marteau et aux fins ciselets d'acier, un art longtemps associé aux bazars d'Ispahan. Le motif est dessiné sur le métal, puis creusé ligne après ligne, pour que la lumière accroche chaque trait.",
      es: "El ghalamzani es el grabado del metal con un pequeño martillo y finos cinceles de acero, un oficio unido desde hace siglos a los bazares de Isfahán. El motivo se dibuja sobre el metal y luego se talla línea a línea, para que la luz atrape cada trazo.",
      ar: "القلم زني هو نقش المعدن بمطرقة صغيرة وأزاميل فولاذية دقيقة، وهي حرفة ارتبطت طويلاً بأسواق أصفهان. يُرسم النقش على المعدن ثم يُحفر خطاً بعد خط، ليلتقط الضوء كل ضربة.",
      fa: "قلم‌زنی، کندن نقش بر فلز با چکشی کوچک و قلم‌های ظریف فولادی است؛ هنری که دیرزمانی با بازارهای اصفهان پیوند داشته است. نقش ابتدا بر فلز کشیده و سپس خط‌به‌خط کنده می‌شود تا نور بر هر ضربه بنشیند."
    },
    description: {
      en: "A lidded vase on a slender stem, chased all over with arabesques and floral medallions. The main panels are picked out in gold tone against the silver-toned metal, and a tall finial crowns the domed lid.",
      fr: "Un vase couvert sur un pied élancé, entièrement ciselé d'arabesques et de médaillons floraux. Les panneaux principaux ressortent en ton doré sur le métal argenté, et un haut fleuron couronne le couvercle bombé.",
      es: "Un jarrón con tapa sobre un pie esbelto, cincelado por completo con arabescos y medallones florales. Los paneles principales resaltan en tono dorado sobre el metal plateado, y un alto remate corona la tapa abombada.",
      ar: "مزهرية ذات غطاء على ساق رشيقة، منقوشة بالكامل بالأرابيسك والميداليات الزهرية. تبرز اللوحات الرئيسية بلون ذهبي على المعدن الفضي، ويتوّج الغطاءَ المقبّبَ رأسٌ مزخرف طويل.",
      fa: "گلدانی درب‌دار بر پایه‌ای باریک که سراسرش با اسلیمی و ترنج‌های گل‌دار قلم‌زنی شده است. نقش‌های اصلی با رنگ طلایی بر زمینهٔ نقره‌فام برجسته شده‌اند و سرپوشی بلند بر درِ گنبدی‌اش نشسته است."
    },
    medium: {
      en: "Hand-engraved metal, two-tone finish",
      fr: "Métal gravé à la main, finition bicolore",
      es: "Metal grabado a mano, acabado bicolor",
      ar: "معدن منقوش يدوياً، بلمسة نهائية بلونين",
      fa: "فلز قلم‌زنی‌شده با دست، پرداخت دورنگ"
    },
    dimensions: "",
    packaging: "",
    additional: "",
    care: {
      en: "Dust with a soft dry cloth and handle by the base, not the lid or finial. Avoid abrasive polish, which wears down the engraving and the gold-toned panels; keep away from damp.",
      fr: "Dépoussiérez avec un chiffon doux et sec et saisissez la pièce par le pied, jamais par le couvercle ou le fleuron. Évitez les produits abrasifs, qui usent la gravure et les panneaux dorés ; tenez à l'abri de l'humidité.",
      es: "Quite el polvo con un paño suave y seco y sujete la pieza por la base, nunca por la tapa ni el remate. Evite los productos abrasivos, que desgastan el grabado y los paneles dorados; manténgala lejos de la humedad.",
      ar: "أزل الغبار بقطعة قماش ناعمة وجافة وأمسك القطعة من قاعدتها لا من الغطاء أو الرأس. تجنّب مواد التلميع الكاشطة التي تُبلي النقش واللوحات الذهبية، وأبعدها عن الرطوبة.",
      fa: "با پارچه‌ای نرم و خشک گردگیری کنید و اثر را از پایه بگیرید، نه از در یا سرپوش. از جلادهندهٔ ساینده بپرهیزید، چون قلم‌زنی و نقش‌های طلایی را می‌ساید؛ از رطوبت دور نگه دارید."
    },
    returns: "",
    updated: ""
  },
  {
    key: "vase",
    city: "isfahan",
    name: { en: "The Sovereign Vase", fr: "Le Vase Souverain", es: "El Jarrón Soberano", ar: "مزهرية السلطان", fa: "گلدان شهریار" },
    category: { en: "Gilded enamel", fr: "Émail doré", es: "Esmalte dorado", ar: "المينا المذهّبة", fa: "میناکاری" },
    id: "",
    photo: "",
    artist: "",
    origin: "",
    history: {
      en: "Enamelling on copper (minakari) has been practised in Persia for centuries and is centred today in Isfahan. Colours are painted on as ground glass and fixed by firing, layer after layer.",
      fr: "L'émaillage sur cuivre (minakari) est pratiqué en Perse depuis des siècles et se concentre aujourd'hui à Ispahan. Les couleurs sont posées sous forme de verre broyé et fixées par cuisson, couche après couche.",
      es: "El esmaltado sobre cobre (minakari) se practica en Persia desde hace siglos y hoy se concentra en Isfahán. Los colores se aplican como vidrio molido y se fijan al fuego, capa tras capa.",
      ar: "يُمارَس فن المينا على النحاس (ميناكاري) في بلاد فارس منذ قرون، ومركزه اليوم أصفهان. تُرسم الألوان من زجاج مطحون وتُثبَّت بالحرق طبقةً بعد طبقة.",
      fa: "میناکاری روی مس قرن‌هاست که در ایران رواج دارد و امروز کانونش اصفهان است. رنگ‌ها به‌صورت شیشهٔ ساییده نقاشی و لایه‌به‌لایه در کوره تثبیت می‌شوند."
    },
    description: {
      en: "Raised from a single sheet of copper, fired in enamel several times and banded with burnished gold leaf. The pattern turns all the way round without a seam.",
      fr: "Formé à partir d'une seule feuille de cuivre, émaillé en plusieurs cuissons et cerclé de feuille d'or brunie. Le motif fait le tour complet sans aucune couture.",
      es: "Levantado a partir de una sola lámina de cobre, esmaltado en varias cocciones y ceñido con pan de oro bruñido. El motivo da la vuelta completa sin una sola costura.",
      ar: "شُكّلت من صفيحة نحاس واحدة، وأُحرقت بالمينا مرات عدة وطُوّقت برقائق ذهب مصقولة. يدور النقش حولها كاملاً بلا أي وصلة.",
      fa: "از یک ورق مس برآمده، چند بار در کورهٔ مینا پخته و با ورق طلای صیقلی کمربند شده است. نقش بی‌هیچ درزی سراسر آن را دور می‌زند."
    },
    medium: {
      en: "Copper, vitreous enamel, gold leaf",
      fr: "Cuivre, émail vitrifié, feuille d'or",
      es: "Cobre, esmalte vítreo, pan de oro",
      ar: "نحاس، مينا زجاجية، رقائق ذهب",
      fa: "مس، لعاب مینا، ورق طلا"
    },
    dimensions: "",
    packaging: "",
    additional: "",
    care: {
      en: "Dust with a soft dry cloth. Keep away from knocks and sudden changes of temperature; do not use water or polish.",
      fr: "Dépoussiérez avec un chiffon doux et sec. Protégez des chocs et des brusques changements de température ; n'utilisez ni eau ni produit lustrant.",
      es: "Quite el polvo con un paño suave y seco. Protéjalo de golpes y cambios bruscos de temperatura; no use agua ni abrillantador.",
      ar: "أزل الغبار بقطعة قماش ناعمة وجافة. احمها من الصدمات والتغيرات المفاجئة في الحرارة، ولا تستخدم الماء أو مواد التلميع.",
      fa: "با پارچه‌ای نرم و خشک گردگیری کنید. از ضربه و تغییر ناگهانی دما دور نگه دارید؛ از آب یا جلادهنده استفاده نکنید."
    },
    returns: "",
    updated: ""
  },
  {
    key: "box",
    city: "shiraz",
    name: { en: "The Treasury Casket", fr: "Le Coffret du Trésor", es: "El Cofre del Tesoro", ar: "صندوق الخزانة", fa: "صندوقچهٔ خزانه" },
    category: { en: "Khatam inlay", fr: "Marqueterie khatam", es: "Taracea khatam", ar: "تطعيم الخاتم", fa: "خاتم‌کاری" },
    id: "",
    photo: "",
    artist: "",
    origin: "",
    history: {
      en: "Khatam is Persian marquetry: rods of wood, bone and metal are bundled into a star pattern, glued, then sliced into thin sheets and laid onto the object. Shiraz and Isfahan are its best-known centres.",
      fr: "Le khatam est une marqueterie persane : des baguettes de bois, d'os et de métal sont assemblées en étoile, collées, puis tranchées en fines feuilles posées sur l'objet. Chiraz et Ispahan en sont les centres les plus réputés.",
      es: "El khatam es la taracea persa: varillas de madera, hueso y metal se agrupan en forma de estrella, se encolan y se cortan en láminas finas que se aplican sobre el objeto. Shiraz e Isfahán son sus centros más conocidos.",
      ar: "الخاتم كاري فنّ تطعيم فارسي: تُجمع قضبان من الخشب والعظم والمعدن في نقش نجمي وتُلصق، ثم تُقطّع إلى شرائح رقيقة تُكسى بها القطعة. شيراز وأصفهان أشهر مراكزه.",
      fa: "خاتم‌کاری منبت‌کاری ایرانی است: میله‌هایی از چوب، استخوان و فلز به شکل ستاره کنار هم چسبانده و سپس به ورقه‌های نازک بریده و بر شیء نشانده می‌شوند. شیراز و اصفهان نامدارترین کانون‌های آن‌اند."
    },
    description: {
      en: "A casket covered in khatam stars, banded and fitted in gold-toned brass. Lift the lid and the lining glows like a lamp.",
      fr: "Un coffret couvert d'étoiles de khatam, cerclé et monté de laiton doré. Soulevez le couvercle : la doublure s'illumine comme une lampe.",
      es: "Un cofre cubierto de estrellas de khatam, ribeteado y montado en latón dorado. Al levantar la tapa, el forro brilla como una lámpara.",
      ar: "صندوق تكسوه نجوم الخاتم، مطوّق ومركّب بالنحاس الذهبي. ارفع الغطاء فتتوهج بطانته كالمصباح.",
      fa: "صندوقچه‌ای پوشیده از ستاره‌های خاتم، با کمربند و یراق برنجی طلایی. در را که بردارید، آسترش چون چراغ می‌درخشد."
    },
    medium: {
      en: "Wood, bone, brass (khatam)",
      fr: "Bois, os, laiton (khatam)",
      es: "Madera, hueso, latón (khatam)",
      ar: "خشب، عظم، نحاس أصفر (خاتم)",
      fa: "چوب، استخوان، برنج (خاتم)"
    },
    dimensions: "",
    packaging: "",
    additional: "",
    care: {
      en: "Keep out of direct sun and away from heaters and damp. Dust with a soft brush; never soak or use solvents.",
      fr: "Tenez à l'abri du soleil direct, des radiateurs et de l'humidité. Dépoussiérez au pinceau doux ; ne mouillez jamais et n'utilisez pas de solvants.",
      es: "Manténgalo lejos del sol directo, de la calefacción y de la humedad. Quite el polvo con un pincel suave; nunca lo moje ni use disolventes.",
      ar: "أبعده عن أشعة الشمس المباشرة والمدافئ والرطوبة. أزل الغبار بفرشاة ناعمة، ولا تنقعه أبداً ولا تستخدم المذيبات.",
      fa: "از آفتاب مستقیم، بخاری و رطوبت دور نگه دارید. با قلم‌موی نرم گردگیری کنید؛ هرگز خیس نکنید و حلّال به کار نبرید."
    },
    returns: "",
    updated: ""
  },
  {
    key: "tray",
    city: "isfahan",
    name: { en: "The Court Tray", fr: "Le Plateau de la Cour", es: "La Bandeja de la Corte", ar: "صينية البلاط", fa: "سینی دربار" },
    category: { en: "Engraved brass", fr: "Laiton gravé", es: "Latón grabado", ar: "النحاس المنقوش", fa: "قلم‌زنی روی برنج" },
    id: "",
    photo: "",
    artist: "",
    origin: "",
    history: {
      en: "Ghalamzani is the engraving of metal with a small hammer and steel chisels, a craft long associated with the bazaars of Isfahan.",
      fr: "Le ghalamzani est la gravure du métal au petit marteau et aux ciselets d'acier, un art longtemps associé aux bazars d'Ispahan.",
      es: "El ghalamzani es el grabado del metal con un pequeño martillo y cinceles de acero, un oficio unido desde hace siglos a los bazares de Isfahán.",
      ar: "القلم زني هو نقش المعدن بمطرقة صغيرة وأزاميل فولاذية، وهي حرفة ارتبطت طويلاً بأسواق أصفهان.",
      fa: "قلم‌زنی، کندن نقش بر فلز با چکشی کوچک و قلم‌های فولادی است؛ هنری که دیرزمانی با بازارهای اصفهان پیوند داشته است."
    },
    description: {
      en: "A round tray chased ring within ring with leaves and stars, until the brass catches light like water.",
      fr: "Un plateau rond ciselé d'anneaux concentriques de feuilles et d'étoiles, jusqu'à ce que le laiton accroche la lumière comme l'eau.",
      es: "Una bandeja redonda cincelada anillo tras anillo con hojas y estrellas, hasta que el latón atrapa la luz como el agua.",
      ar: "صينية مستديرة نُقشت حلقةً داخل حلقة بالأوراق والنجوم، حتى يلتقط النحاسُ الضوءَ كالماء.",
      fa: "سینی گردی که حلقه در حلقه با برگ و ستاره قلم‌زنی شده، تا برنج نور را چون آب بگیرد."
    },
    medium: { en: "Hand-engraved brass", fr: "Laiton gravé à la main", es: "Latón grabado a mano", ar: "نحاس أصفر منقوش يدوياً", fa: "برنج قلم‌زنی‌شده با دست" },
    dimensions: "",
    packaging: "",
    additional: "",
    care: {
      en: "Wipe with a soft dry cloth. Avoid abrasive polish, which wears down the engraving.",
      fr: "Essuyez avec un chiffon doux et sec. Évitez les produits abrasifs, qui usent la gravure.",
      es: "Límpiela con un paño suave y seco. Evite los productos abrasivos, que desgastan el grabado.",
      ar: "امسحها بقطعة قماش ناعمة وجافة. تجنّب مواد التلميع الكاشطة التي تُبلي النقش.",
      fa: "با پارچه‌ای نرم و خشک پاک کنید. از جلادهندهٔ ساینده بپرهیزید، چون قلم‌زنی را می‌ساید."
    },
    returns: "",
    updated: ""
  },
  {
    key: "lantern",
    city: "zanjan",
    name: { en: "The Vigil Lantern", fr: "La Lanterne de Veille", es: "El Farol de la Vigilia", ar: "فانوس السهر", fa: "فانوس شب‌زنده‌داری" },
    category: { en: "Silver filigree", fr: "Filigrane d'argent", es: "Filigrana de plata", ar: "التخريم الفضي", fa: "ملیله‌کاری نقره" },
    id: "",
    photo: "",
    artist: "",
    origin: "",
    history: {
      en: "Filigree (malileh) is built from fine twisted silver wire soldered into open lace-like patterns; the city of Zanjan is especially known for it.",
      fr: "Le filigrane (malileh) est fait de fins fils d'argent torsadés, soudés en motifs ajourés comme une dentelle ; la ville de Zanjan en est particulièrement réputée.",
      es: "La filigrana (malileh) se construye con finos hilos de plata retorcidos y soldados en dibujos calados como un encaje; la ciudad de Zanjan es especialmente célebre por ella.",
      ar: "يُصنع التخريم (مليله) من أسلاك فضية رفيعة مجدولة تُلحم في نقوش مفرّغة كالدانتيل، وتشتهر به مدينة زنجان خاصة.",
      fa: "ملیله از مفتول‌های ظریف و تابیدهٔ نقره ساخته می‌شود که به نقش‌هایی مشبک چون تور لحیم می‌شوند؛ شهر زنجان به‌ویژه به آن نامدار است."
    },
    description: {
      en: "Silver wire twisted by hand into vines and teardrops, then gilded, so candlelight falls through it as lace.",
      fr: "Du fil d'argent torsadé à la main en rinceaux et en larmes, puis doré, pour que la lumière des bougies le traverse comme une dentelle.",
      es: "Hilo de plata retorcido a mano en sarmientos y lágrimas y luego dorado, para que la luz de las velas lo atraviese como un encaje.",
      ar: "سلك فضي جُدل باليد على هيئة كروم وقطرات ثم ذُهّب، فيعبره ضوء الشموع كالدانتيل.",
      fa: "مفتول نقره‌ای که با دست به شکل پیچک و اشک تابیده و سپس طلاکاری شده، تا نور شمع چون تور از آن بگذرد."
    },
    medium: { en: "Silver filigree, gilding", fr: "Filigrane d'argent, dorure", es: "Filigrana de plata, dorado", ar: "تخريم فضي، تذهيب", fa: "ملیلهٔ نقره، طلاکاری" },
    dimensions: "",
    packaging: "",
    additional: "",
    care: {
      en: "Handle by the frame, not the wire work. Store wrapped in acid-free tissue to slow tarnish; clean only with a soft brush.",
      fr: "Manipulez par la monture, jamais par le filigrane. Rangez-la dans un papier de soie sans acide pour ralentir le ternissement ; nettoyez seulement au pinceau doux.",
      es: "Sujételo por el armazón, no por la filigrana. Guárdelo envuelto en papel de seda sin ácido para frenar el ennegrecimiento; límpielo solo con un pincel suave.",
      ar: "أمسكه من الإطار لا من التخريم. احفظه ملفوفاً بورق خالٍ من الأحماض لإبطاء الاسوداد، ونظّفه بفرشاة ناعمة فقط.",
      fa: "از قاب بگیرید، نه از ملیله. برای کند کردن تیرگی در کاغذ بی‌اسید بپیچید و نگه دارید؛ فقط با قلم‌موی نرم تمیز کنید."
    },
    returns: "",
    updated: ""
  },
  {
    key: "mirror",
    city: "shiraz",
    name: { en: "The Hall of Light", fr: "La Salle de Lumière", es: "La Sala de la Luz", ar: "قاعة النور", fa: "تالار نور" },
    category: { en: "Mirror mosaic", fr: "Mosaïque de miroirs", es: "Mosaico de espejos", ar: "فسيفساء المرايا", fa: "آینه‌کاری" },
    id: "",
    photo: "",
    artist: "",
    origin: "",
    history: {
      en: "Mirror work (ayeneh-kari) sets small hand-cut pieces of mirror into plaster so that a single light is scattered across a room, as in the halls of Persian palaces and shrines.",
      fr: "L'ayeneh-kari serti de petits éclats de miroir taillés à la main dans le plâtre, pour qu'une seule lumière se disperse dans toute la pièce, comme dans les salles des palais et sanctuaires persans.",
      es: "El ayeneh-kari engasta pequeñas piezas de espejo cortadas a mano en yeso, para que una sola luz se esparza por toda la sala, como en los salones de los palacios y santuarios persas.",
      ar: "الآينه كاري يرصّع قطعاً صغيرة من المرايا المقطوعة يدوياً في الجص، لينتشر ضوء واحد في أرجاء القاعة كما في قاعات القصور والأضرحة الفارسية.",
      fa: "آینه‌کاری تکه‌های کوچک آینهٔ دست‌بریده را در گچ می‌نشاند تا یک نور در سراسر تالار پخش شود، چنان‌که در تالارهای کاخ‌ها و حرم‌های ایرانی."
    },
    description: {
      en: "Hundreds of hand-cut mirror facets set in gilded plaster, each angled a little differently.",
      fr: "Des centaines de facettes de miroir taillées à la main, serties dans un plâtre doré, chacune inclinée un peu différemment.",
      es: "Cientos de facetas de espejo cortadas a mano y engastadas en yeso dorado, cada una con un ángulo ligeramente distinto.",
      ar: "مئات الأوجه من المرايا المقطوعة يدوياً مرصّعة في جص مذهّب، لكلٍّ منها ميل مختلف قليلاً.",
      fa: "صدها تراش آینهٔ دست‌بریده در گچ طلاکاری‌شده، هر یک با زاویه‌ای اندکی متفاوت."
    },
    medium: { en: "Mirror glass on plaster, gilding", fr: "Miroir sur plâtre, dorure", es: "Espejo sobre yeso, dorado", ar: "زجاج مرايا على جص، تذهيب", fa: "آینه روی گچ، طلاکاری" },
    dimensions: "",
    packaging: "",
    additional: "",
    care: {
      en: "Hang on a solid wall away from damp. Dust gently with a soft dry brush; do not spray cleaners onto the piece.",
      fr: "Accrochez sur un mur solide, à l'abri de l'humidité. Dépoussiérez délicatement au pinceau doux et sec ; ne vaporisez aucun nettoyant sur la pièce.",
      es: "Cuélguelo en una pared firme, lejos de la humedad. Quite el polvo con suavidad con un pincel seco; no rocíe limpiadores sobre la pieza.",
      ar: "علّقها على جدار متين بعيداً عن الرطوبة. أزل الغبار برفق بفرشاة ناعمة جافة، ولا ترشّ المنظفات على القطعة.",
      fa: "بر دیواری محکم و دور از رطوبت بیاویزید. با قلم‌موی نرم و خشک به‌آرامی گردگیری کنید؛ پاک‌کننده روی اثر نپاشید."
    },
    returns: "",
    updated: ""
  },
  {
    key: "carpet",
    city: "kashan",
    name: { en: "The Throne Rug", fr: "Le Tapis du Trône", es: "La Alfombra del Trono", ar: "سجادة العرش", fa: "قالیچهٔ تخت" },
    category: { en: "Hand-knotted carpet", fr: "Tapis noué main", es: "Alfombra anudada a mano", ar: "سجادة معقودة يدوياً", fa: "فرش دست‌بافت" },
    id: "",
    photo: "/photos/carpet-silk.jpg",
    artist: "",
    origin: "",
    history: {
      en: "Persian carpets are tied knot by knot on a vertical loom, from a design drawn square by square; the medallion carpets of Kashan and Isfahan are among the most celebrated.",
      fr: "Les tapis persans sont noués nœud après nœud sur un métier vertical, d'après un carton dessiné case par case ; les tapis à médaillon de Kachan et d'Ispahan comptent parmi les plus célèbres.",
      es: "Las alfombras persas se anudan nudo a nudo en un telar vertical, a partir de un diseño dibujado cuadro a cuadro; las alfombras de medallón de Kashán e Isfahán están entre las más célebres.",
      ar: "تُعقد السجاد الفارسي عقدةً عقدة على نول عمودي، وفق تصميم مرسوم مربعًا مربعًا؛ وسجاد الميدالية في كاشان وأصفهان من أشهره.",
      fa: "فرش ایرانی گره به گره بر دار عمودی و از روی نقشه‌ای خانه‌به‌خانه بافته می‌شود؛ فرش‌های ترنج‌دار کاشان و اصفهان از نامدارترین آن‌اند."
    },
    description: {
      en: "An emerald-green field of scrolling vines and flowers around a red star medallion, with ivory arabesque corners and a wine-red border of palmettes between gold guards.",
      fr: "Un champ vert émeraude de rinceaux et de fleurs autour d'un médaillon étoilé rouge, des écoinçons d'arabesques ivoire et une bordure lie-de-vin à palmettes entre des galons dorés.",
      es: "Un campo verde esmeralda de roleos y flores alrededor de un medallón de estrella rojo, con esquinas de arabescos marfil y una cenefa rojo vino de palmetas entre galones dorados.",
      ar: "أرضية خضراء زمردية من الأغصان الملتفة والزهور حول ميدالية نجمية حمراء، بزوايا من الأرابيسك العاجي وإطار أحمر نبيذي من النخيلات بين حواشٍ ذهبية.",
      fa: "زمینه‌ای سبز زمردی از اسلیمی و گل گرد ترنجی ستاره‌ای و لاکی، با لچک‌های اسلیمی شیری و حاشیه‌ای لاکی تیره از بته‌جقه میان حاشیه‌های طلایی."
    },
    medium: { en: "Hand-knotted carpet", fr: "Tapis noué main", es: "Alfombra anudada a mano", ar: "سجادة معقودة يدوياً", fa: "فرش دست‌بافت" },
    dimensions: "",
    packaging: "",
    additional: "",
    care: {
      en: "Keep out of strong sunlight and turn it now and then so it fades evenly. Have it cleaned only by a rug specialist.",
      fr: "Tenez à l'écart d'un fort soleil et tournez-le de temps en temps pour qu'il passe uniformément. Confiez son nettoyage uniquement à un spécialiste du tapis.",
      es: "Manténgala lejos del sol intenso y gírela de vez en cuando para que se aclare de manera uniforme. Hágala limpiar solo por un especialista en alfombras.",
      ar: "أبعدها عن الشمس القوية وأدرها من حين لآخر ليبهت لونها بالتساوي. لا تُنظَّف إلا لدى مختص في السجاد.",
      fa: "از آفتاب تند دور نگه دارید و گاه‌به‌گاه بچرخانید تا یکنواخت رنگ ببازد. شست‌وشو را تنها به متخصص فرش بسپارید."
    },
    returns: "",
    updated: ""
  }
];
