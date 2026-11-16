// ARTRA — the site's text in five languages: English, French, Spanish, Arabic and Persian.
// The language is chosen in the <head> of each page (the ?lang= address, then the visitor's last choice,
// then their browser's language, else English); this file supplies the words and the switch in the header.
// Elements carry data-i18n="key" (text), data-i18n-html="key" (text with markup) or
// data-i18n-aria="key" (aria-label). To change wording, edit it here for every language.
(function () {
  "use strict";

  var LANGS = ["en", "fr", "es", "ar", "fa"];
  var LABELS = { en: "EN", fr: "FR", es: "ES", ar: "ع", fa: "فا" };
  var NAMES = { en: "English", fr: "Français", es: "Español", ar: "العربية", fa: "فارسی" };

  var S = {
    en: {
      "nav.collection": "Collection", "nav.showcase": "Showcase", "nav.craft": "The craft", "nav.commission": "Commission",
      "aria.menu": "Menu", "aria.home": "ARTRA home", "aria.lang": "Language", "aria.scroll": "Scroll to the collection",
      "aria.prev": "Previous piece", "aria.next": "Next piece", "aria.back": "Scroll back", "aria.fwd": "Scroll forward",
      "meta.title": "ARTRA — Royal handicrafts",
      "meta.desc": "ARTRA: royal art pieces made by hand — engraved metal, gilded enamel, inlay, filigree, mirror mosaic and silk.",

      "hero.eyebrow": "Royal handicrafts · Made by hand",
      "hero.title": '<span class="gold-text">Heirlooms</span> fit for a palace.',
      "hero.lede": "Each piece is drawn, cut, gilded and finished by a master artisan over weeks or months — enamel, inlay, filigree and silk, in editions no larger than a single hand can make.",
      "hero.view": "View the collection", "hero.commission": "Commission a piece",

      "c.enamel": "Gilded enamel", "c.khatam": "Khatam inlay", "c.brass": "Engraved brass", "c.filigree": "Silver filigree",
      "c.mirror": "Mirror mosaic", "c.silk": "Hand-knotted silk", "c.metal": "Engraved metal", "c.unsure": "Not sure yet",

      "col.eyebrow": "The collection", "col.title": "One piece at a time.",
      "col.lede": "Select a piece to open its page: its story, the craft up close, and full specifications.",
      "show.more": "Full details", "show.enquire": "Enquire",

      "l.medium": "Medium", "l.origin": "Origin", "l.dimensions": "Dimensions", "l.id": "Product ID", "l.category": "Category",
      "l.artist": "Artist", "l.packaging": "Packaging dimensions", "l.updated": "Last update",
      "l.care": "Care instructions", "l.returns": "Returns and exchanges", "l.additional": "Additional information",

      "craft.eyebrow": "The craft", "craft.title": "From first line to final polish.",
      "step1.t": "Design", "step1.p": "Every motif is drawn by hand with compass and pen, proportioned to the old geometric canons.",
      "step2.t": "Shape", "step2.p": "Metal is raised and chased, wood cut into slivers finer than a match, silk dyed with plants and roots.",
      "step3.t": "Gild", "step3.p": "Leaves of 24-carat gold are laid on with a squirrel-hair brush and burnished with agate.",
      "step4.t": "Seal", "step4.p": "The master signs and numbers each piece, and it leaves with a certificate of its making.",
      "s.artisans": "master artisans", "s.crafts": "living crafts", "s.hours": "hours, our longest piece", "s.edition": "pieces per edition, at most",

      "com.eyebrow": "Private commission", "com.title": "A piece made for one house.",
      "com.lede": "Tell us the room, the occasion or the story. A master artisan will reply with sketches, materials and a timeline.",
      "f.name": "Name", "f.email": "Email", "f.craft": "Craft", "f.idea": "Your idea", "f.send": "Send the request",
      "f.note": "Opens your email app with the request ready to send.",
      "f.thanks": "Thank you — your email app should now open with the request.",
      "mail.commission": "ARTRA commission request — {craft}",

      "foot.tag": "Royal handicrafts, made by hand.", "foot.top": "Back to top ↑", "foot.collection": "The collection →",

      "pbar.overview": "Overview", "pbar.story": "Story", "pbar.closeup": "Up close", "pbar.specs": "Specifications", "pbar.care": "Care",
      "discover": "Discover",
      "close.title": "Every line,<br><em>by hand.</em>",
      "close.more": "Come closer: every motif was drawn, cut and finished by hand, and no two pieces are quite alike.",
      "close.artist": "{medium}, worked by {artist}. {more}", "close.medium": "{medium}. {more}",
      "care.eyebrow": "Care & service", "care.title": "Kept for generations.",
      "more.title": "Discover more pieces",
      "cta.eyebrow": "Private enquiry", "cta.title": "Enquire about {name}",
      "cta.lede": "An artisan will reply with availability, delivery and the piece's certificate of making.",
      "cta.mail": "Enquire by email", "cta.back": "Back to the collection",
      "missing.eyebrow": "Not found", "missing.title": "This piece is not in the collection.", "missing.cta": "See the collection",
      "ch.heritage": "Heritage", "ch.artist": "The artist", "ch.origin": "Origin", "ch.material": "The material", "ch.madein": "Made in {origin}",
      "mail.enquiry": "Enquiry — {name}",
      "mail.body": "Hello ARTRA,\n\nI would like to know more about {name}{id}.\n\n{url}\n", "mail.id": " (product ID {id})",
      "piece.desc": "An ARTRA royal art piece: its story, the craft up close, and full specifications."
    },

    fr: {
      "nav.collection": "Collection", "nav.showcase": "Vitrine", "nav.craft": "Le savoir-faire", "nav.commission": "Commande",
      "aria.menu": "Menu", "aria.home": "Accueil ARTRA", "aria.lang": "Langue", "aria.scroll": "Aller à la collection",
      "aria.prev": "Pièce précédente", "aria.next": "Pièce suivante", "aria.back": "Défiler en arrière", "aria.fwd": "Défiler en avant",
      "meta.title": "ARTRA — Artisanat royal",
      "meta.desc": "ARTRA : des pièces d'art royales faites à la main — métal gravé, émail doré, marqueterie, filigrane, mosaïque de miroirs et soie.",

      "hero.eyebrow": "Artisanat royal · Fait à la main",
      "hero.title": '<span class="gold-text">Des trésors</span> dignes d\'un palais.',
      "hero.lede": "Chaque pièce est dessinée, taillée, dorée et achevée par un maître artisan pendant des semaines ou des mois — émail, marqueterie, filigrane et soie, en éditions qu'une seule main peut réaliser.",
      "hero.view": "Voir la collection", "hero.commission": "Commander une pièce",

      "c.enamel": "Émail doré", "c.khatam": "Marqueterie khatam", "c.brass": "Laiton gravé", "c.filigree": "Filigrane d'argent",
      "c.mirror": "Mosaïque de miroirs", "c.silk": "Soie nouée main", "c.metal": "Métal gravé", "c.unsure": "Je ne sais pas encore",

      "col.eyebrow": "La collection", "col.title": "Une pièce à la fois.",
      "col.lede": "Choisissez une pièce pour ouvrir sa page : son histoire, le savoir-faire de près et sa fiche complète.",
      "show.more": "Tous les détails", "show.enquire": "Se renseigner",

      "l.medium": "Matériaux", "l.origin": "Origine", "l.dimensions": "Dimensions", "l.id": "Référence", "l.category": "Catégorie",
      "l.artist": "Artiste", "l.packaging": "Dimensions de l'emballage", "l.updated": "Dernière mise à jour",
      "l.care": "Conseils d'entretien", "l.returns": "Retours et échanges", "l.additional": "Informations complémentaires",

      "craft.eyebrow": "Le savoir-faire", "craft.title": "Du premier trait au dernier poli.",
      "step1.t": "Dessiner", "step1.p": "Chaque motif est dessiné à la main, au compas et à la plume, selon les anciens canons géométriques.",
      "step2.t": "Façonner", "step2.p": "Le métal est repoussé et ciselé, le bois taillé en lamelles plus fines qu'une allumette, la soie teinte de plantes et de racines.",
      "step3.t": "Dorer", "step3.p": "Des feuilles d'or 24 carats sont posées au pinceau en poil d'écureuil puis brunies à l'agate.",
      "step4.t": "Sceller", "step4.p": "Le maître signe et numérote chaque pièce, qui part avec son certificat de fabrication.",
      "s.artisans": "maîtres artisans", "s.crafts": "métiers vivants", "s.hours": "heures pour notre plus longue pièce", "s.edition": "pièces par édition, au plus",

      "com.eyebrow": "Commande privée", "com.title": "Une pièce pour une seule maison.",
      "com.lede": "Parlez-nous de la pièce, de l'occasion ou de l'histoire. Un maître artisan vous répondra avec croquis, matériaux et calendrier.",
      "f.name": "Nom", "f.email": "E-mail", "f.craft": "Métier", "f.idea": "Votre idée", "f.send": "Envoyer la demande",
      "f.note": "Ouvre votre messagerie avec la demande prête à envoyer.",
      "f.thanks": "Merci — votre messagerie devrait maintenant s'ouvrir avec la demande.",
      "mail.commission": "Demande de commande ARTRA — {craft}",

      "foot.tag": "Artisanat royal, fait à la main.", "foot.top": "Haut de page ↑", "foot.collection": "La collection →",

      "pbar.overview": "Aperçu", "pbar.story": "Histoire", "pbar.closeup": "De près", "pbar.specs": "Caractéristiques", "pbar.care": "Entretien",
      "discover": "Découvrir",
      "close.title": "Chaque trait,<br><em>à la main.</em>",
      "close.more": "Approchez-vous : chaque motif a été dessiné, taillé et achevé à la main, et aucune pièce n'est tout à fait semblable.",
      "close.artist": "{medium}, travaillé par {artist}. {more}", "close.medium": "{medium}. {more}",
      "care.eyebrow": "Entretien et service", "care.title": "Conservé pour des générations.",
      "more.title": "Découvrir d'autres pièces",
      "cta.eyebrow": "Demande privée", "cta.title": "Se renseigner sur : {name}",
      "cta.lede": "Un artisan vous répondra sur la disponibilité, la livraison et le certificat de fabrication de la pièce.",
      "cta.mail": "Écrire par e-mail", "cta.back": "Retour à la collection",
      "missing.eyebrow": "Introuvable", "missing.title": "Cette pièce ne fait pas partie de la collection.", "missing.cta": "Voir la collection",
      "ch.heritage": "Patrimoine", "ch.artist": "L'artiste", "ch.origin": "Origine", "ch.material": "La matière", "ch.madein": "Réalisé à {origin}",
      "mail.enquiry": "Demande — {name}",
      "mail.body": "Bonjour ARTRA,\n\nJ'aimerais en savoir plus sur {name}{id}.\n\n{url}\n", "mail.id": " (référence {id})",
      "piece.desc": "Une pièce d'art royale ARTRA : son histoire, le savoir-faire de près et sa fiche complète."
    },

    es: {
      "nav.collection": "Colección", "nav.showcase": "Vitrina", "nav.craft": "El oficio", "nav.commission": "Encargo",
      "aria.menu": "Menú", "aria.home": "Inicio de ARTRA", "aria.lang": "Idioma", "aria.scroll": "Ir a la colección",
      "aria.prev": "Pieza anterior", "aria.next": "Pieza siguiente", "aria.back": "Desplazar atrás", "aria.fwd": "Desplazar adelante",
      "meta.title": "ARTRA — Artesanía real",
      "meta.desc": "ARTRA: piezas de arte reales hechas a mano — metal grabado, esmalte dorado, taracea, filigrana, mosaico de espejos y seda.",

      "hero.eyebrow": "Artesanía real · Hecho a mano",
      "hero.title": '<span class="gold-text">Tesoros</span> dignos de un palacio.',
      "hero.lede": "Cada pieza es dibujada, cortada, dorada y terminada por un maestro artesano durante semanas o meses — esmalte, taracea, filigrana y seda, en ediciones que una sola mano puede crear.",
      "hero.view": "Ver la colección", "hero.commission": "Encargar una pieza",

      "c.enamel": "Esmalte dorado", "c.khatam": "Taracea khatam", "c.brass": "Latón grabado", "c.filigree": "Filigrana de plata",
      "c.mirror": "Mosaico de espejos", "c.silk": "Seda anudada a mano", "c.metal": "Metal grabado", "c.unsure": "Aún no lo sé",

      "col.eyebrow": "La colección", "col.title": "Una pieza a la vez.",
      "col.lede": "Elija una pieza para abrir su página: su historia, el oficio de cerca y su ficha completa.",
      "show.more": "Todos los detalles", "show.enquire": "Consultar",

      "l.medium": "Materiales", "l.origin": "Origen", "l.dimensions": "Dimensiones", "l.id": "Referencia", "l.category": "Categoría",
      "l.artist": "Artista", "l.packaging": "Dimensiones del embalaje", "l.updated": "Última actualización",
      "l.care": "Cuidados", "l.returns": "Devoluciones y cambios", "l.additional": "Información adicional",

      "craft.eyebrow": "El oficio", "craft.title": "Del primer trazo al último pulido.",
      "step1.t": "Diseñar", "step1.p": "Cada motivo se dibuja a mano con compás y pluma, según los antiguos cánones geométricos.",
      "step2.t": "Dar forma", "step2.p": "El metal se repuja y cincela, la madera se corta en láminas más finas que una cerilla, la seda se tiñe con plantas y raíces.",
      "step3.t": "Dorar", "step3.p": "Las hojas de oro de 24 quilates se colocan con pincel de pelo de ardilla y se bruñen con ágata.",
      "step4.t": "Sellar", "step4.p": "El maestro firma y numera cada pieza, que sale con su certificado de elaboración.",
      "s.artisans": "maestros artesanos", "s.crafts": "oficios vivos", "s.hours": "horas, nuestra pieza más larga", "s.edition": "piezas por edición, como máximo",

      "com.eyebrow": "Encargo privado", "com.title": "Una pieza hecha para una sola casa.",
      "com.lede": "Cuéntenos la estancia, la ocasión o la historia. Un maestro artesano le responderá con bocetos, materiales y plazos.",
      "f.name": "Nombre", "f.email": "Correo electrónico", "f.craft": "Oficio", "f.idea": "Su idea", "f.send": "Enviar la solicitud",
      "f.note": "Abre su aplicación de correo con la solicitud lista para enviar.",
      "f.thanks": "Gracias — su aplicación de correo debería abrirse ahora con la solicitud.",
      "mail.commission": "Solicitud de encargo ARTRA — {craft}",

      "foot.tag": "Artesanía real, hecha a mano.", "foot.top": "Volver arriba ↑", "foot.collection": "La colección →",

      "pbar.overview": "Resumen", "pbar.story": "Historia", "pbar.closeup": "De cerca", "pbar.specs": "Ficha técnica", "pbar.care": "Cuidados",
      "discover": "Descubrir",
      "close.title": "Cada trazo,<br><em>a mano.</em>",
      "close.more": "Acérquese: cada motivo fue dibujado, cortado y terminado a mano, y no hay dos piezas iguales.",
      "close.artist": "{medium}, trabajado por {artist}. {more}", "close.medium": "{medium}. {more}",
      "care.eyebrow": "Cuidado y servicio", "care.title": "Para conservar durante generaciones.",
      "more.title": "Descubra más piezas",
      "cta.eyebrow": "Consulta privada", "cta.title": "Consultar sobre {name}",
      "cta.lede": "Un artesano le responderá sobre disponibilidad, envío y el certificado de elaboración de la pieza.",
      "cta.mail": "Consultar por correo", "cta.back": "Volver a la colección",
      "missing.eyebrow": "No encontrada", "missing.title": "Esta pieza no está en la colección.", "missing.cta": "Ver la colección",
      "ch.heritage": "Patrimonio", "ch.artist": "El artista", "ch.origin": "Origen", "ch.material": "El material", "ch.madein": "Hecho en {origin}",
      "mail.enquiry": "Consulta — {name}",
      "mail.body": "Hola ARTRA:\n\nMe gustaría saber más sobre {name}{id}.\n\n{url}\n", "mail.id": " (referencia {id})",
      "piece.desc": "Una pieza de arte real de ARTRA: su historia, el oficio de cerca y su ficha completa."
    },

    ar: {
      "nav.collection": "المجموعة", "nav.showcase": "المعرض", "nav.craft": "الحرفة", "nav.commission": "طلب خاص",
      "aria.menu": "القائمة", "aria.home": "الصفحة الرئيسية لآرترا", "aria.lang": "اللغة", "aria.scroll": "الانتقال إلى المجموعة",
      "aria.prev": "القطعة السابقة", "aria.next": "القطعة التالية", "aria.back": "التمرير للخلف", "aria.fwd": "التمرير للأمام",
      "meta.title": "آرترا — حِرف ملكية",
      "meta.desc": "آرترا: قطع فنية ملكية مصنوعة يدوياً — معدن منقوش، مينا مذهّبة، تطعيم، تخريم، فسيفساء المرايا وحرير.",

      "hero.eyebrow": "حِرف ملكية · صُنعت يدوياً",
      "hero.title": '<span class="gold-text">نفائس</span> تليق بالقصور.',
      "hero.lede": "كل قطعة يرسمها ويقطعها ويذهّبها ويتمّها معلّم حِرفي على مدى أسابيع أو أشهر — مينا وتطعيم وتخريم وحرير، بإصدارات لا تتجاوز ما تصنعه يد واحدة.",
      "hero.view": "استعرض المجموعة", "hero.commission": "اطلب قطعة خاصة",

      "c.enamel": "المينا المذهّبة", "c.khatam": "تطعيم الخاتم", "c.brass": "النحاس المنقوش", "c.filigree": "التخريم الفضي",
      "c.mirror": "فسيفساء المرايا", "c.silk": "حرير معقود يدوياً", "c.metal": "المعدن المنقوش", "c.unsure": "لم أحدد بعد",

      "col.eyebrow": "المجموعة", "col.title": "قطعة واحدة في كل مرة.",
      "col.lede": "اختر قطعة لتفتح صفحتها: قصتها، والحرفة عن قرب، ومواصفاتها الكاملة.",
      "show.more": "التفاصيل الكاملة", "show.enquire": "استفسر",

      "l.medium": "الخامات", "l.origin": "المنشأ", "l.dimensions": "الأبعاد", "l.id": "رمز المنتج", "l.category": "الفئة",
      "l.artist": "الفنان", "l.packaging": "أبعاد التغليف", "l.updated": "آخر تحديث",
      "l.care": "إرشادات العناية", "l.returns": "الإرجاع والاستبدال", "l.additional": "معلومات إضافية",

      "craft.eyebrow": "الحرفة", "craft.title": "من الخط الأول إلى الصقل الأخير.",
      "step1.t": "التصميم", "step1.p": "يُرسم كل زخرف باليد بالفرجار والقلم، وفق النِّسب الهندسية القديمة.",
      "step2.t": "التشكيل", "step2.p": "يُطرق المعدن ويُنقش، ويُقطع الخشب شرائح أرق من عود الثقاب، ويُصبغ الحرير بالنباتات والجذور.",
      "step3.t": "التذهيب", "step3.p": "تُوضع رقائق الذهب عيار ٢٤ بفرشاة من شعر السنجاب ثم تُصقل بحجر العقيق.",
      "step4.t": "الختم", "step4.p": "يوقّع المعلّم كل قطعة ويرقّمها، وتغادر الورشة مع شهادة صنعها.",
      "s.artisans": "معلّمًا حِرفيًا", "s.crafts": "حِرف حيّة", "s.hours": "ساعة لأطول قطعة لدينا", "s.edition": "قطعة لكل إصدار على الأكثر",

      "com.eyebrow": "طلب خاص", "com.title": "قطعة تُصنع لبيت واحد.",
      "com.lede": "حدّثنا عن المكان أو المناسبة أو القصة. سيرد عليك معلّم حِرفي برسوم أولية والخامات والجدول الزمني.",
      "f.name": "الاسم", "f.email": "البريد الإلكتروني", "f.craft": "الحرفة", "f.idea": "فكرتك", "f.send": "أرسل الطلب",
      "f.note": "يفتح تطبيق البريد لديك والطلب جاهز للإرسال.",
      "f.thanks": "شكرًا لك — يُفترض أن يُفتح تطبيق البريد الآن مع الطلب.",
      "mail.commission": "طلب خاص من آرترا — {craft}",

      "foot.tag": "حِرف ملكية، صُنعت يدوياً.", "foot.top": "العودة إلى الأعلى ↑", "foot.collection": "المجموعة ←",

      "pbar.overview": "نظرة عامة", "pbar.story": "القصة", "pbar.closeup": "عن قرب", "pbar.specs": "المواصفات", "pbar.care": "العناية",
      "discover": "اكتشف",
      "close.title": "كل خط،<br><em>باليد.</em>",
      "close.more": "اقترب: كل زخرف رُسم وقُطع وأُتمّ باليد، ولا تتشابه قطعتان تمامًا.",
      "close.artist": "{medium}، من عمل {artist}. {more}", "close.medium": "{medium}. {more}",
      "care.eyebrow": "العناية والخدمة", "care.title": "تُحفظ لأجيال.",
      "more.title": "اكتشف مزيدًا من القطع",
      "cta.eyebrow": "استفسار خاص", "cta.title": "استفسر عن {name}",
      "cta.lede": "سيرد عليك أحد الحِرفيين بشأن التوفر والتوصيل وشهادة صنع القطعة.",
      "cta.mail": "استفسر بالبريد الإلكتروني", "cta.back": "العودة إلى المجموعة",
      "missing.eyebrow": "غير موجودة", "missing.title": "هذه القطعة ليست ضمن المجموعة.", "missing.cta": "استعرض المجموعة",
      "ch.heritage": "الإرث", "ch.artist": "الفنان", "ch.origin": "المنشأ", "ch.material": "الخامة", "ch.madein": "صُنعت في {origin}",
      "mail.enquiry": "استفسار — {name}",
      "mail.body": "مرحبًا آرترا،\n\nأودّ معرفة المزيد عن {name}{id}.\n\n{url}\n", "mail.id": " (رمز المنتج {id})",
      "piece.desc": "قطعة فنية ملكية من آرترا: قصتها، والحرفة عن قرب، ومواصفاتها الكاملة."
    },

    fa: {
      "nav.collection": "مجموعه", "nav.showcase": "ویترین", "nav.craft": "هنر و صناعت", "nav.commission": "سفارش",
      "aria.menu": "منو", "aria.home": "صفحهٔ اصلی آرترا", "aria.lang": "زبان", "aria.scroll": "رفتن به مجموعه",
      "aria.prev": "اثر قبلی", "aria.next": "اثر بعدی", "aria.back": "پیمایش به عقب", "aria.fwd": "پیمایش به جلو",
      "meta.title": "آرترا — صنایع‌دستی شاهانه",
      "meta.desc": "آرترا: آثار هنری شاهانهٔ دست‌ساز — قلم‌زنی، میناکاری، خاتم‌کاری، ملیله‌کاری، آینه‌کاری و ابریشم.",

      "hero.eyebrow": "صنایع‌دستی شاهانه · ساخت دست",
      "hero.title": '<span class="gold-text">میراثی</span> درخور کاخ‌ها.',
      "hero.lede": "هر اثر را استادکاری در طول هفته‌ها یا ماه‌ها طراحی می‌کند، می‌بُرد، طلاکاری و پرداخت می‌کند — مینا، خاتم، ملیله و ابریشم، در شمارگانی که تنها از یک دست برمی‌آید.",
      "hero.view": "دیدن مجموعه", "hero.commission": "سفارش یک اثر",

      "c.enamel": "میناکاری", "c.khatam": "خاتم‌کاری", "c.brass": "قلم‌زنی روی برنج", "c.filigree": "ملیله‌کاری نقره",
      "c.mirror": "آینه‌کاری", "c.silk": "ابریشم دست‌بافت", "c.metal": "قلم‌زنی روی فلز", "c.unsure": "هنوز مطمئن نیستم",

      "col.eyebrow": "مجموعه", "col.title": "هر بار، یک اثر.",
      "col.lede": "اثری را برگزینید تا صفحه‌اش باز شود: داستانش، هنرش از نزدیک و مشخصات کامل.",
      "show.more": "جزئیات کامل", "show.enquire": "پرس‌وجو",

      "l.medium": "جنس و روش", "l.origin": "خاستگاه", "l.dimensions": "ابعاد", "l.id": "شناسهٔ محصول", "l.category": "دسته",
      "l.artist": "هنرمند", "l.packaging": "ابعاد بسته‌بندی", "l.updated": "آخرین به‌روزرسانی",
      "l.care": "نگهداری", "l.returns": "بازگشت و تعویض", "l.additional": "اطلاعات بیشتر",

      "craft.eyebrow": "هنر و صناعت", "craft.title": "از نخستین خط تا واپسین پرداخت.",
      "step1.t": "طراحی", "step1.p": "هر نقش با پرگار و قلم و به دست کشیده می‌شود، بر پایهٔ تناسب‌های هندسی کهن.",
      "step2.t": "ساخت", "step2.p": "فلز چکش‌کاری و قلم‌زنی می‌شود، چوب به باریکه‌هایی نازک‌تر از چوب‌کبریت بریده می‌شود و ابریشم با گیاه و ریشه رنگ می‌گیرد.",
      "step3.t": "طلاکاری", "step3.p": "ورق‌های طلای ۲۴ عیار با قلم‌موی موی سنجاب نشانده و با عقیق صیقل داده می‌شوند.",
      "step4.t": "مُهر", "step4.p": "استاد هر اثر را امضا و شماره‌گذاری می‌کند و اثر با شناسنامهٔ ساختش راهی می‌شود.",
      "s.artisans": "استادکار", "s.crafts": "هنر زنده", "s.hours": "ساعت، برای طولانی‌ترین اثر ما", "s.edition": "اثر در هر شمارگان، دست‌بالا",

      "com.eyebrow": "سفارش ویژه", "com.title": "اثری برای یک خانه.",
      "com.lede": "از فضا، مناسبت یا داستان‌تان بگویید. استادکاری با طرح‌های اولیه، مواد و زمان‌بندی پاسخ می‌دهد.",
      "f.name": "نام", "f.email": "ایمیل", "f.craft": "هنر", "f.idea": "ایدهٔ شما", "f.send": "ارسال درخواست",
      "f.note": "برنامهٔ ایمیل شما با درخواستی آمادهٔ ارسال باز می‌شود.",
      "f.thanks": "سپاس — اکنون برنامهٔ ایمیل شما باید با درخواست باز شود.",
      "mail.commission": "درخواست سفارش آرترا — {craft}",

      "foot.tag": "صنایع‌دستی شاهانه، ساخت دست.", "foot.top": "بازگشت به بالا ↑", "foot.collection": "مجموعه ←",

      "pbar.overview": "نمای کلی", "pbar.story": "داستان", "pbar.closeup": "از نزدیک", "pbar.specs": "مشخصات", "pbar.care": "نگهداری",
      "discover": "کشف کنید",
      "close.title": "هر خط،<br><em>با دست.</em>",
      "close.more": "نزدیک‌تر بیایید: هر نقش با دست کشیده، بریده و پرداخت شده و هیچ دو اثری کاملاً یکسان نیستند.",
      "close.artist": "{medium}، کار {artist}. {more}", "close.medium": "{medium}. {more}",
      "care.eyebrow": "نگهداری و خدمات", "care.title": "ماندگار برای نسل‌ها.",
      "more.title": "آثار بیشتری ببینید",
      "cta.eyebrow": "پرس‌وجوی ویژه", "cta.title": "پرس‌وجو دربارهٔ {name}",
      "cta.lede": "یکی از استادکاران دربارهٔ موجودی، ارسال و شناسنامهٔ ساخت اثر به شما پاسخ می‌دهد.",
      "cta.mail": "پرس‌وجو با ایمیل", "cta.back": "بازگشت به مجموعه",
      "missing.eyebrow": "یافت نشد", "missing.title": "این اثر در مجموعه نیست.", "missing.cta": "دیدن مجموعه",
      "ch.heritage": "میراث", "ch.artist": "هنرمند", "ch.origin": "خاستگاه", "ch.material": "جنس", "ch.madein": "ساخت {origin}",
      "mail.enquiry": "پرس‌وجو — {name}",
      "mail.body": "سلام آرترا،\n\nمی‌خواهم دربارهٔ {name}{id} بیشتر بدانم.\n\n{url}\n", "mail.id": " (شناسهٔ محصول {id})",
      "piece.desc": "اثر هنری شاهانهٔ آرترا: داستانش، هنرش از نزدیک و مشخصات کامل."
    }
  };

  var html = document.documentElement;
  var lang = LANGS.indexOf(html.lang) > -1 ? html.lang : "en";
  var rtl = lang === "ar" || lang === "fa";

  // A string in the current language (English if it is missing), with {placeholders} filled in.
  function t(key, vars) {
    var s = (S[lang] && S[lang][key]) || S.en[key] || key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] == null ? "" : vars[k]; });
    return s;
  }
  // A product field may be plain text (shown in every language) or {en, fr, es, ar, fa}.
  function pick(v) {
    if (v && typeof v === "object") return v[lang] || v.en || "";
    return v == null ? "" : String(v);
  }
  function pickEn(v) { return v && typeof v === "object" ? (v.en || "") : (v == null ? "" : String(v)); }

  function apply(root) {
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll("[data-i18n]"), function (n) { n.textContent = t(n.getAttribute("data-i18n")); });
    Array.prototype.forEach.call(root.querySelectorAll("[data-i18n-html]"), function (n) { n.innerHTML = t(n.getAttribute("data-i18n-html")); });
    Array.prototype.forEach.call(root.querySelectorAll("[data-i18n-aria]"), function (n) { n.setAttribute("aria-label", t(n.getAttribute("data-i18n-aria"))); });
  }

  // The language switch: EN · FR · ES · ع · فا. Choosing one reloads the page in that language.
  function buildSwitch() {
    var box = document.getElementById("lang");
    if (!box) return;
    box.setAttribute("aria-label", t("aria.lang"));
    LANGS.forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = LABELS[l];
      b.lang = l;
      b.title = NAMES[l];
      b.setAttribute("aria-label", NAMES[l]);
      if (l === lang) { b.setAttribute("aria-current", "true"); b.className = "on"; }
      b.addEventListener("click", function () {
        if (l === lang) return;
        try { localStorage.setItem("artra-lang", l); } catch (e) {}
        var u = new URL(location.href);
        u.searchParams.set("lang", l);
        location.assign(u.toString());
      });
      box.appendChild(b);
    });
  }

  window.ARTRA_I18N = { lang: lang, rtl: rtl, langs: LANGS, t: t, pick: pick, pickEn: pickEn, apply: apply };

  // This file loads at the end of <body>, so the page is all there: translate it now, before the page
  // scripts run (they use t() for the text they build, and the piece page then sets its own title).
  var piecePage = document.body.classList.contains("piece-page");
  document.title = t("meta.title");
  var md = document.querySelector('meta[name="description"]');
  if (md) md.content = t(piecePage ? "piece.desc" : "meta.desc");
  apply(document);
  buildSwitch();
})();
