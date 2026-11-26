-- ============================================================
-- DISCIPULOS · 20 estudios bíblicos (5 por etapa)
-- Ejecutar en Supabase -> SQL Editor.
-- Requiere que el perfil con email 'hugoarcuri@gmail.com' exista.
-- ============================================================

begin;

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'El regalo de la gracia',
  'Un primer acercamiento al regalo de la salvación y a lo que significa vivir desde la gracia de Dios.',
  'nuevos-comienzos',
  'Efesios 2:1-10',
  'Comprender que la salvación es un regalo de Dios y no un logro personal, para responder con gratitud y no con culpa.',
  'La salvación no comienza con lo que hacemos por Dios, sino con lo que Dios hizo por nosotros. Pablo recuerda a los efesios que estaban muertos en sus delitos y que fueron vivificados por gracia. No había nada que pudieran ofrecer para merecer ese regalo.

La gracia es un regalo: no se gana, no se merece y no se paga. Por eso la vida cristiana no es un intento de ganar el amor de Dios, sino una respuesta agradecida a un amor que ya nos alcanzó. Esta verdad nos libera del orgullo y también de la desesperanza.

Cuando comprendemos la gracia, cambia nuestra manera de acercarnos a Dios y de acompañar a otros. Dejamos de medirnos con la vara del mérito y aprendemos a descansar en Cristo, sabiendo que las buenas obras son el fruto de una vida transformada, no el precio de la salvación.',
  '[{"id": "q_gracia_1", "texto": "¿Qué diferencia hay entre intentar ganar el favor de Dios y recibirlo como un regalo?"}, {"id": "q_gracia_2", "texto": "Según Efesios 2:10, ¿para qué preparó Dios las buenas obras en nuestra vida?"}, {"id": "q_gracia_3", "texto": "¿Cómo cambia tu forma de verte a vos mismo y a los demás saber que la salvación es por gracia?"}]'::jsonb,
  'Durante esta semana, anotá tres momentos en los que intentaste ganarte el amor de Dios. Al lado de cada uno, escribí una frase de Efesios 2 que te recuerde la verdad de la gracia.',
  'Leé Romanos 8:1-4 y anotá una frase que te ayude a descansar en la obra de Cristo.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  '¿Quién es Jesús?',
  'Un estudio sobre la identidad de Jesús como el Verbo eterno que se hizo carne para revelarnos al Padre.',
  'nuevos-comienzos',
  'Juan 1:1-18',
  'Reconocer a Jesús como Dios hecho hombre, para confiar en él y seguirlo con certeza.',
  'Juan comienza su evangelio no con un pesebre, sino con la eternidad. El Verbo ya existía antes de la creación y todo fue hecho por medio de él. Eso nos dice que Jesús no es un profeta más ni un maestro inspirado: es el mismo Dios que se acerca a nosotros.

El texto nos muestra el contraste entre la luz y las tinieblas, y la tristeza de que el mundo no lo recibió. Sin embargo, a los que lo recibieron les dio potestad de ser hechos hijos de Dios. La fe no es solo asentir a una idea, sino recibir a una Persona.

La gracia y la verdad se encontraron en Jesús. Él nos explica al Padre porque es el Hijo unigénito. Conocer a Jesús es conocer a Dios; seguirlo es el comienzo de una vida nueva.',
  '[{"id": "q_jesus_1", "texto": "¿Qué nos dice Juan 1:1-3 sobre el origen y la divinidad de Jesús?"}, {"id": "q_jesus_2", "texto": "¿Qué significa “recibirlo” en el versículo 12 y qué consecuencia tiene?"}, {"id": "q_jesus_3", "texto": "¿Cómo podés conocer mejor a Jesús esta semana?"}]'::jsonb,
  'Escribí una carta corta a Jesús agradeciéndole por haberse hecho hombre para salvarte. Guardala y léela cuando dudes de su amor.',
  'Leé Colosenses 1:15-20 para profundizar en la supremacía de Cristo.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'El nuevo nacimiento',
  'Jesús explica a Nicodemo que para ver el reino de Dios es necesario nacer de nuevo.',
  'nuevos-comienzos',
  'Juan 3:1-17',
  'Entender que la conversión es obra del Espíritu y que Dios nos ama lo suficiente como para dar a su Hijo.',
  'Nicodemo era un maestro religioso, pero Jesús le dijo que necesitaba nacer de nuevo. No bastaba con conocer las Escrituras ni con cumplir ritos: se necesitaba una obra nueva del Espíritu de Dios en el corazón.

El viento sopla donde quiere y así es el Espíritu: su obra es soberana y transformadora. No la controlamos, pero la recibimos. El nuevo nacimiento no es una mejora de la vieja naturaleza, sino el comienzo de una vida nueva.

En el centro de este pasaje está el amor de Dios. Él dio a su Hijo unigénito para que todo el que cree no se pierda. La fe es mirar a Cristo como los israelitas miraron la serpiente en el desierto: simple, humilde y salvadora.',
  '[{"id": "q_nuevo_1", "texto": "¿Por qué Jesús le dice a Nicodemo que debe nacer de nuevo?"}, {"id": "q_nuevo_2", "texto": "¿Qué enseña el versículo 16 sobre el amor de Dios y la fe?"}, {"id": "q_nuevo_3", "texto": "¿En qué área de tu vida necesitás que el Espíritu haga algo nuevo?"}]'::jsonb,
  'Orá esta semana pidiéndole al Espíritu que renueve un área concreta de tu vida. Anotá lo que observes.',
  'Leé Tito 3:4-7 y compará con Juan 3.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'La seguridad de la salvación',
  'Juan nos asegura que podemos saber que tenemos vida eterna si creemos en el Hijo de Dios.',
  'nuevos-comienzos',
  '1 Juan 5:11-13',
  'Afianzar la certeza de la salvación en Cristo, no en los sentimientos.',
  'La vida eterna no es una esperanza vaga, sino un testimonio que Dios dio sobre su Hijo. Quien tiene al Hijo tiene la vida. La seguridad no descansa en nuestras emociones ni en nuestro rendimiento, sino en la fidelidad de Dios y en su promesa.

Juan escribió estas cosas para que los que creen sepan que tienen vida eterna. La fe cristiana no es una religión de incertidumbre, sino de confianza en la obra consumada de Cristo.

Cuando dudamos, volvemos a la promesa. Cristo es suficiente y su obra es completa. Descansar en él nos da paz y libertad para caminar.',
  '[{"id": "q_seguridad_1", "texto": "¿Dónde se basa la seguridad de la salvación según 1 Juan 5?"}, {"id": "q_seguridad_2", "texto": "¿Por qué es importante no depender de los sentimientos para saber que somos salvos?"}, {"id": "q_seguridad_3", "texto": "¿Qué promesa de Dios te da más paz hoy?"}]'::jsonb,
  'Memorizá 1 Juan 5:13 esta semana. Repetilo cuando aparezcan dudas sobre tu salvación.',
  'Leé Juan 10:27-30 y anotá qué dice Jesús sobre la seguridad del creyente.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'Primeros pasos con Dios',
  'Pablo anima a los colosenses a caminar en Cristo, arraigados y sobreedificados en él.',
  'nuevos-comienzos',
  'Colosenses 2:6-7',
  'Dar pasos concretos para crecer en la fe desde el primer día.',
  'Haber recibido a Cristo es el comienzo, pero también es el camino. Pablo exhorta a caminar en él, arraigados y sobreedificados, firmes en la fe. La vida cristiana no es un evento aislado, sino un proceso diario de seguir a Jesús.

Arraigarse implica profundidad: conocer la Palabra, orar y estar en comunidad. Sobreedificarse implica crecimiento constante sobre el fundamento de Cristo. La gratitud es la actitud que sostiene ese caminar.

Los primeros pasos son simples pero decisivos: leer la Biblia, orar, congregarse y obedecer. Dios es fiel para completar la obra que comenzó.',
  '[{"id": "q_pasos_1", "texto": "¿Qué significa “caminar en Cristo” en tu vida diaria?"}, {"id": "q_pasos_2", "texto": "¿Qué hábitos te ayudan a arraigarte y sobreedificarte en la fe?"}, {"id": "q_pasos_3", "texto": "¿Qué paso concreto querés dar esta semana?"}]'::jsonb,
  'Elegí un hábito espiritual (lectura, oración o comunidad) y practicálo todos los días esta semana. Anotá tu experiencia.',
  'Leé Colosenses 1:9-12 y orá usando esas peticiones.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'Una vida de oración',
  'Aprender a orar con sinceridad, dependencia y constancia, tomando como modelo la enseñanza de Jesús.',
  'crecimiento',
  'Mateo 6:5-13',
  'Incorporar la oración como un hábito cotidiano de comunión con Dios, más allá de las palabras o las circunstancias.',
  'Jesús enseñó a orar a personas comunes. No buscaba discursos elocuentes ni fórmulas mágicas, sino una relación honesta con el Padre. La oración es, ante todo, una conversación donde aprendemos a escuchar y a hablar con confianza.

En el Padrenuestro, Jesús comienza por el carácter y el reino de Dios antes de presentar las necesidades personales. Esa estructura nos recuerda que la oración no es solo un pedido de ayuda, sino una forma de alinear el corazón con la voluntad del Padre.

La constancia importa. Habrá días de sequedad y días de alegría; la fidelidad de Dios no depende de nuestras emociones. Orar es volver una y otra vez, con sencillez, sabiendo que él escucha.',
  '[{"id": "q_oracion_1", "texto": "¿Qué lugar ocupa la oración en tu rutina diaria y qué te cuesta más sostener?"}, {"id": "q_oracion_2", "texto": "¿Por qué creés que Jesús nos enseña a comenzar por el carácter de Dios y no por nuestras necesidades?"}, {"id": "q_oracion_3", "texto": "¿Qué pedido concreto querés presentarle a Dios esta semana?"}]'::jsonb,
  'Elegí un horario fijo para orar durante diez minutos cada día de esta semana. Escribí al final una frase sobre lo que Dios te mostró en ese tiempo.',
  'Leé Lucas 11:1-13 como complemento de Mateo 6:5-13.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'La Palabra que transforma',
  'El salmista enseña cómo un joven puede mantener puro su camino: guardando la Palabra de Dios.',
  'crecimiento',
  'Salmo 119:9-16',
  'Valorar la Biblia como guía diaria y esconderla en el corazón.',
  'La Palabra de Dios no es solo información, sino transformación. El salmista pregunta cómo puede el joven mantener puro su camino y responde: guardando la Palabra. La pureza no viene de la fuerza de voluntad, sino de la verdad que habita en nosotros.

Buscar a Dios con todo el corazón implica desear su Palabra más que el pecado. Esconderla en el corazón es memorizarla y meditarla hasta que forme nuestro pensar y nuestro actuar.

La alegría en los testimonios de Dios es la marca de quien ama su Palabra. No es una carga, sino un tesoro que guía cada paso.',
  '[{"id": "q_palabra_1", "texto": "¿Qué significa para vos “guardar la Palabra” en la vida diaria?"}, {"id": "q_palabra_2", "texto": "¿Cómo podés esconder la Palabra en tu corazón esta semana?"}, {"id": "q_palabra_3", "texto": "¿Qué versículo te gustaría memorizar y por qué?"}]'::jsonb,
  'Elegí un versículo del Salmo 119 y memorizalo. Repetilo cada mañana antes de empezar el día.',
  'Leé Josué 1:8 y anotá la promesa que aparece allí.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'El Espíritu Santo en la vida del creyente',
  'Jesús promete al Espíritu Santo como Consolador y Guía para los que lo aman.',
  'crecimiento',
  'Juan 14:15-27',
  'Reconocer la presencia y el papel del Espíritu Santo en la vida diaria del creyente.',
  'Jesús no dejó a sus discípulos huérfanos. Prometió enviar el Espíritu de la verdad, que mora en nosotros y nos enseña todas las cosas. El Espíritu no es una fuerza impersonal, sino una Persona que acompaña, consuela y guía.

La obediencia y el amor a Jesús están vinculados con la manifestación del Espíritu. Él nos recuerda la enseñanza de Cristo y nos da paz, no como el mundo la da.

Depender del Espíritu es dejar de confiar solo en nuestras fuerzas. Él nos capacita para vivir como discípulos y nos da la certeza de la presencia de Dios.',
  '[{"id": "q_espiritu_1", "texto": "¿Qué promete Jesús sobre el Espíritu Santo en este pasaje?"}, {"id": "q_espiritu_2", "texto": "¿Cómo se manifiesta la presencia del Espíritu en tu vida?"}, {"id": "q_espiritu_3", "texto": "¿En qué área necesitás más la guía del Espíritu esta semana?"}]'::jsonb,
  'Antes de tomar una decisión esta semana, orá pidiendo la guía del Espíritu y anotá lo que discernís.',
  'Leé Gálatas 5:16-18 y relacioná con Juan 14.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'La iglesia: familia de Dios',
  'El autor de Hebreos exhorta a no dejar de congregarse y a animarse mutuamente.',
  'crecimiento',
  'Hebreos 10:24-25',
  'Valorar la comunidad cristiana como espacio de crecimiento y ánimo.',
  'La fe no se vive en soledad. El autor de Hebreos nos llama a considerarnos unos a otros para estimularnos al amor y a las buenas obras. La congregación no es un mero hábito, sino un medio de gracia.

Dejar de congregarse debilita la fe. La comunidad nos sostiene en las pruebas, nos corrige en el error y nos anima a perseverar. Cada creyente tiene algo que aportar.

Ser parte de la iglesia es comprometerse con personas reales, con sus virtudes y defectos, sabiendo que Cristo es el centro que nos une.',
  '[{"id": "q_iglesia_1", "texto": "¿Por qué es importante no dejar de congregarse?"}, {"id": "q_iglesia_2", "texto": "¿Cómo podés estimular a otros al amor y a las buenas obras esta semana?"}, {"id": "q_iglesia_3", "texto": "¿Qué te cuesta más de la vida en comunidad y cómo podés crecer en ello?"}]'::jsonb,
  'Esta semana, enviá un mensaje de ánimo a alguien de tu iglesia y orá por esa persona.',
  'Leé 1 Corintios 12:12-27 sobre el cuerpo de Cristo.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'Crecer en la fe',
  'Pedro enumera las virtudes que, añadidas a la fe, nos hacen fructíferos en el conocimiento de Cristo.',
  'crecimiento',
  '2 Pedro 1:3-8',
  'Añadir a la fe virtudes que produzcan un crecimiento equilibrado y fructífero.',
  'Dios nos ha dado todo lo necesario para la vida y la piedad. No nos falta nada para crecer; lo que necesitamos es aplicar con diligencia lo que ya recibimos.

Pedro enumera una cadena de virtudes: fe, virtud, conocimiento, dominio propio, paciencia, piedad, amor fraternal y amor. Cada una se construye sobre la anterior. No es un esfuerzo para ganar la salvación, sino el fruto de una fe viva.

El crecimiento espiritual es intencional. Si estas cosas están en nosotros y abundan, no seremos ineficaces ni estériles.',
  '[{"id": "q_crecer_1", "texto": "¿Qué significa que Dios nos dio todo lo necesario para la vida y la piedad?"}, {"id": "q_crecer_2", "texto": "¿Cuál de las virtudes de la lista te cuesta más y por qué?"}, {"id": "q_crecer_3", "texto": "¿Qué paso concreto darás para crecer en esa virtud esta semana?"}]'::jsonb,
  'Elegí una virtud de la lista y definí una acción concreta para practicarla cada día esta semana.',
  'Leé Efesios 4:11-16 sobre el crecimiento del cuerpo de Cristo.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'El fruto del Espíritu en las relaciones',
  'Reconocer cómo el Espíritu de Dios forma en nosotros un carácter que se expresa en la manera de tratar a los demás.',
  'caracter',
  'Gálatas 5:16-26',
  'Identificar un área concreta de nuestra manera de relacionarnos donde el Espíritu quiere formar su fruto.',
  'Pablo contrasta las obras de la carne con el fruto del Espíritu. No se trata simplemente de una lista de virtudes que debemos fabricar por esfuerzo propio, sino del resultado de una vida que se deja guiar por el Espíritu.

El amor, el gozo, la paz, la paciencia, la benignidad, la bondad, la fe, la mansedumbre y la templanza se prueban especialmente en las relaciones. Es en la convivencia diaria, en las diferencias y en las heridas donde se ve si estamos dando fruto.

Crecer en carácter no significa esconder las dificultades, sino llevarlas a la luz de Dios y permitir que él transforme nuestras reacciones. Es un proceso, no una actuación.',
  '[{"id": "q_fruto_1", "texto": "¿Cuál de las actitudes del fruto del Espíritu reconocés que más necesitás desarrollar en tus relaciones?"}, {"id": "q_fruto_2", "texto": "¿Qué diferencia hay entre esforzarte por ser bueno y dejar que el Espíritu forme su fruto?"}, {"id": "q_fruto_3", "texto": "¿Con qué persona o situación concreta necesitás pedirle a Dios una reacción distinta esta semana?"}]'::jsonb,
  'Elegí una relación concreta y esta semana practicá una actitud del fruto del Espíritu que te resulte difícil. Al final de la semana, anotá qué aprendiste.',
  'Escuchá o leé Colosenses 3:12-17 y anotá una frase que quieras recordar.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'La humildad de Cristo',
  'Pablo exhorta a los filipenses a tener los mismos sentimientos que Cristo, quien se humilló hasta la muerte de cruz.',
  'caracter',
  'Filipenses 2:1-11',
  'Cultivar la humildad, considerando a los demás como superiores a uno mismo.',
  'La humildad no es pensar mal de uno mismo, sino pensar menos en uno mismo. Pablo nos llama a tener los mismos sentimientos que hubo en Cristo Jesús, quien, siendo en forma de Dios, no tuvo por usurpación el ser igual a Dios, sino que se despojó a sí mismo.

Cristo tomó forma de siervo y se humilló hasta la muerte, y muerte de cruz. Esa es la medida de la humildad cristiana: no buscar el propio interés, sino el de los demás.

La humildad no es debilidad, sino fortaleza controlada. Es reconocer que todo lo que somos y tenemos viene de Dios, y que servir es mayor que ser servido.',
  '[{"id": "q_humildad_1", "texto": "¿Qué significa “tener los mismos sentimientos que hubo en Cristo Jesús”?"}, {"id": "q_humildad_2", "texto": "¿En qué área de tu vida te cuesta más ser humilde?"}, {"id": "q_humildad_3", "texto": "¿Cómo podés servir a alguien esta semana sin buscar reconocimiento?"}]'::jsonb,
  'Esta semana, realizá un acto de servicio anónimo por alguien. No se lo cuentes a nadie.',
  'Leé 1 Pedro 5:5-6 sobre la humildad ante Dios y los demás.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'El perdón que libera',
  'Jesús enseña sobre el perdón a través de la parábola del siervo despiadado.',
  'caracter',
  'Mateo 18:21-35',
  'Comprender la magnitud del perdón recibido y extenderlo a otros.',
  'Pedro pregunta cuántas veces debe perdonar a su hermano. Jesús responde con una cifra que significa “sin límite”. Luego cuenta la parábola del siervo que, perdonado de una deuda impagable, no quiso perdonar una deuda mínima.

El perdón que Dios nos dio en Cristo es infinitamente mayor que cualquier ofensa que recibimos. No perdonar es olvidar la gracia recibida. El perdón no es negar el dolor, sino entregarlo a Dios y liberar al ofensor.

Perdonar es un proceso, no un sentimiento. Es una decisión que se renueva cada día, sostenida por la gracia de Dios.',
  '[{"id": "q_perdon_1", "texto": "¿Qué enseña la parábola sobre la relación entre el perdón recibido y el perdón dado?"}, {"id": "q_perdon_2", "texto": "¿Hay alguien a quien necesitás perdonar y te cuesta hacerlo?"}, {"id": "q_perdon_3", "texto": "¿Cómo podés dar un paso de perdón esta semana?"}]'::jsonb,
  'Escribí el nombre de la persona que necesitás perdonar y orá por ella cada día esta semana.',
  'Leé Efesios 4:31-32 y anotá la exhortación de Pablo.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'La pureza del corazón',
  'Jesús proclama bienaventurados a los de limpio corazón, porque ellos verán a Dios.',
  'caracter',
  'Mateo 5:8',
  'Buscar la pureza interior que nos permite ver a Dios y reflejar su carácter.',
  'La pureza del corazón no es perfección externa, sino una intención sincera y no dividida. Jesús no habla de ritos ni de apariencias, sino de lo que hay en lo profundo del ser.

Un corazón puro es aquel que no está contaminado por la hipocresía, la envidia o el orgullo. Es un corazón que busca a Dios con sinceridad y que se deja transformar por su gracia.

La promesa es hermosa: los de limpio corazón verán a Dios. La pureza nos prepara para la comunión con él y nos hace transparentes ante los demás.',
  '[{"id": "q_pureza_1", "texto": "¿Qué significa tener un corazón puro según Jesús?"}, {"id": "q_pureza_2", "texto": "¿Qué áreas de tu corazón necesitan ser purificadas?"}, {"id": "q_pureza_3", "texto": "¿Qué práctica te ayudaría a cultivar la pureza interior esta semana?"}]'::jsonb,
  'Esta semana, antes de una conversación difícil, pedí a Dios que purifique tus intenciones. Anotá cómo cambió tu actitud.',
  'Leé Salmo 51:10 y orá con ese versículo.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'La paciencia en la prueba',
  'Santiago anima a considerar gozo cuando vengan pruebas, porque producen paciencia.',
  'caracter',
  'Santiago 1:2-4',
  'Aprender a ver las pruebas como oportunidades de crecimiento y formación del carácter.',
  'Santiago nos llama a considerar gozo las pruebas, no porque el sufrimiento sea agradable, sino porque produce paciencia. La paciencia es la capacidad de mantenerse firme bajo presión, confiando en Dios.

Las pruebas no son castigos, sino herramientas de formación. Dios las usa para perfeccionar nuestro carácter y llevarnos a la madurez. Lo que falta es sabiduría, y Dios la da generosamente a quien la pide.

La paciencia no se aprende en la comodidad, sino en la adversidad. Cada prueba es una oportunidad para confiar más en Dios y menos en nosotros mismos.',
  '[{"id": "q_paciencia_1", "texto": "¿Por qué Santiago dice que debemos considerar gozo las pruebas?"}, {"id": "q_paciencia_2", "texto": "¿Cómo te ayuda la fe a soportar las pruebas?"}, {"id": "q_paciencia_3", "texto": "¿Qué prueba estás atravesando ahora y cómo podés pedir sabiduría a Dios?"}]'::jsonb,
  'Esta semana, cuando enfrentes una dificultad, antes de reaccionar, orá pidiendo paciencia y sabiduría. Anotá el resultado.',
  'Leé Romanos 5:3-5 y compará con Santiago 1.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'Llamados a servir',
  'Descubrir que el liderazgo que Jesús nos propone no busca ser servido, sino servir y acompañar a otros en su crecimiento.',
  'compromiso',
  'Marcos 10:42-45',
  'Comprender el servicio como respuesta al ejemplo de Jesús y dar un paso concreto para acompañar a otra persona.',
  'Jesús invirtió la lógica del poder. Mientras los líderes de las naciones dominaban, él eligió servir. Su autoridad no se construyó sobre el control, sino sobre la entrega.

Servir no es sinónimo de hacer todo por los demás ni de olvidarnos de nuestros límites. Es usar lo que Dios nos dio para el bien de otros, con humildad y responsabilidad. El servicio madura cuando nace del amor y no de la búsqueda de reconocimiento.

El discipulado es un servicio: acompañar a alguien, escuchar, enseñar con paciencia y señalar a Cristo. No se trata de tener todas las respuestas, sino de caminar junto a otro con fidelidad.',
  '[{"id": "q_servicio_1", "texto": "¿Cómo describirías la diferencia entre servir con amor y servir buscando aprobación?"}, {"id": "q_servicio_2", "texto": "¿Qué recurso, talento o tiempo podés poner hoy al servicio de otra persona?"}, {"id": "q_servicio_3", "texto": "¿A quién podrías acompañar en un paso concreto de su crecimiento durante este mes?"}]'::jsonb,
  'Elegí una persona de tu entorno y hacé algo concreto por ella esta semana, sin esperar nada a cambio. Luego anotá cómo te hizo sentir y qué te mostró Dios.',
  'Leé Juan 13:1-17 y compará el gesto de Jesús con tu manera de servir.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'El Gran Mandamiento',
  'Jesús resume toda la Ley en amar a Dios con todo el ser y al prójimo como a uno mismo.',
  'compromiso',
  'Mateo 22:34-40',
  'Vivir el amor a Dios y al prójimo como el centro de la vida cristiana.',
  'Cuando le preguntaron cuál era el gran mandamiento, Jesús no eligió un ritual ni una regla, sino el amor. Amar a Dios con todo el corazón, alma y mente es la respuesta a quien nos amó primero.

El segundo mandamiento es semejante: amar al prójimo como a uno mismo. No se puede separar el amor a Dios del amor a las personas. El verdadero amor a Dios se expresa en el trato con los demás.

Estos dos mandamientos son el fundamento de toda la Ley. Todo lo demás se sostiene sobre ellos. Vivirlos es la esencia del compromiso cristiano.',
  '[{"id": "q_mandamiento_1", "texto": "¿Qué significa amar a Dios con todo el corazón, alma y mente?"}, {"id": "q_mandamiento_2", "texto": "¿Cómo se expresa el amor a Dios en el amor al prójimo?"}, {"id": "q_mandamiento_3", "texto": "¿A quién podés amar de manera concreta esta semana?"}]'::jsonb,
  'Esta semana, identificá a una persona difícil de amar y orá por ella. Buscá una forma práctica de servirla.',
  'Leé 1 Corintios 13:1-7 y anotá qué aspecto del amor querés cultivar.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'Haced discípulos',
  'Jesús encomienda a sus seguidores la gran comisión: ir y hacer discípulos de todas las naciones.',
  'compromiso',
  'Mateo 28:18-20',
  'Asumir la responsabilidad de acompañar a otros en su crecimiento, sabiendo que Jesús está con nosotros.',
  'La gran comisión no es una sugerencia, sino un mandato. Jesús, con toda autoridad, nos envía a hacer discípulos. No se trata solo de evangelizar, sino de enseñar y acompañar en el crecimiento.

El discipulado implica bautizar y enseñar a guardar todo lo que Jesús mandó. Es un proceso largo y personal, que requiere paciencia y fidelidad. No lo hacemos solos: Jesús promete estar con nosotros todos los días.

Ser discípulo es también hacer discípulos. El compromiso con Cristo se expresa en el compromiso con las personas que él nos confía.',
  '[{"id": "q_discipulos_1", "texto": "¿Qué implica “hacer discípulos” según este pasaje?"}, {"id": "q_discipulos_2", "texto": "¿A quién podés acompañar en su crecimiento esta semana?"}, {"id": "q_discipulos_3", "texto": "¿Cómo te anima la promesa “yo estoy con vosotros todos los días”?"}]'::jsonb,
  'Elegí a una persona y comprometete a acompañarla en su crecimiento durante un mes. Anotá el primer paso.',
  'Leé 2 Timoteo 2:2 sobre la cadena del discipulado.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'El costo del discipulado',
  'Jesús enseña que seguirlo implica negarse a sí mismo, tomar la cruz y seguirlo cada día.',
  'compromiso',
  'Lucas 9:23-26',
  'Asumir el costo de seguir a Jesús con decisión y sin reservas.',
  'Jesús no oculta el costo del discipulado. Negarse a sí mismo, tomar la cruz y seguirlo cada día es una renuncia diaria al egoísmo y a la comodidad. No es un momento, sino un estilo de vida.

Guardar la vida es perderla; perderla por Cristo es ganarla. El mundo ofrece seguridad y reconocimiento, pero solo Cristo da vida eterna. El compromiso con él vale más que todo lo que podemos ganar aquí.

El discipulado cuesta, pero la recompensa es eterna. Seguir a Jesús es el mejor intercambio: dejamos lo pasajero para ganar lo permanente.',
  '[{"id": "q_costo_1", "texto": "¿Qué significa “negarse a sí mismo” en tu contexto?"}, {"id": "q_costo_2", "texto": "¿Qué cosa te cuesta más soltar para seguir a Jesús?"}, {"id": "q_costo_3", "texto": "¿Cómo podés tomar tu cruz cada día esta semana?"}]'::jsonb,
  'Identificá algo que te impide seguir a Jesús con libertad y tomá una decisión concreta al respecto esta semana.',
  'Leé Lucas 14:25-33 sobre el costo de ser discípulo.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

insert into public.studies (titulo, descripcion, etapa, pasaje_biblico, objetivo, contenido, preguntas, actividad, material_complementario, creador_id, fecha_creacion)
values (
  'Fidelidad en lo poco',
  'Jesús enseña que quien es fiel en lo poco, también lo será en lo mucho.',
  'compromiso',
  'Lucas 16:10-12',
  'Desarrollar la fidelidad en las pequeñas responsabilidades como preparación para mayores.',
  'La fidelidad no se mide por la magnitud de la tarea, sino por la constancia en ella. Jesús enseña que quien es fiel en lo menos, también lo es en lo más. Las pequeñas responsabilidades son el campo de entrenamiento para las grandes.

Dios no nos confía más hasta que seamos fieles en lo que ya tenemos. La fidelidad en lo poco revela nuestro carácter y nuestra confianza en Dios.

Ser fiel en lo cotidiano es un acto de adoración. No esperes una gran oportunidad para ser fiel; sé fiel hoy en lo que Dios te puso en las manos.',
  '[{"id": "q_fidelidad_1", "texto": "¿Qué significa ser fiel en lo poco?"}, {"id": "q_fidelidad_2", "texto": "¿En qué área pequeña de tu vida podés ser más fiel esta semana?"}, {"id": "q_fidelidad_3", "texto": "¿Cómo se relaciona la fidelidad con el compromiso cristiano?"}]'::jsonb,
  'Esta semana, cumplí con una responsabilidad pequeña que venías postergando. Hacelo con excelencia y sin buscar reconocimiento.',
  'Leé Mateo 25:14-30 sobre los talentos y la fidelidad.',
  (select id from public.profiles where email = 'hugoarcuri@gmail.com'),
  now()
);

commit;
