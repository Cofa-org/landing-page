import {TbCheckupList, TbCarCrane} from 'react-icons/tb'
import {CiMoneyBill, CiLocationArrow1} from 'react-icons/ci'
import {BsCreditCard, BsHouse, BsShieldCheck} from 'react-icons/bs'
import { PiUsersThreeLight, PiConfetti, PiBandaidsFill } from "react-icons/pi";
import { WiStars} from 'react-icons/wi'
import { MdComputer} from 'react-icons/md'
import { LuClipboardCheck } from "react-icons/lu";
import { IoRibbonOutline } from "react-icons/io5";


export const infoList = [
    {
        Icon: TbCheckupList,
        title: 'Pedí tu préstamo',
        content: 'Decinos cuánto necesitás y nosotros te ayudamos!\nOtorgamos préstamos online en el acto sólo con CBU.'
    },
    {
        Icon: CiMoneyBill,
        title: 'Elegí las cuotas',
        content: 'Simulá tu préstamo y elegí la opción que más se adapte a vos.\nDevolvé el préstamo en cuotas fijas y en pesos. Sin sorpresas.'
    },
    {
        Icon: BsCreditCard,
        title: 'Te depositamos en tu cuenta',
        content: 'Tené el dinero en tu cuenta en el momento.'
    },
    {
        Icon: WiStars,
        title: 'Disfrutalo',
        content: 'Gastá tu dinero para lo que quieras, sin dar explicaciones!'
    }
]

export const reasonsToChose = [
    {
        id: 1,
        content: 'Más de 95.000 clientes satisfechos.'
    },
    {
        id: 2,
        content: 'Empresa inscripta en el BCRA y en la SSN.'
    },
    {
        id: 3,
        content: 'Experiencia y trayectoria comprobada.'
    }
]



export const ourServices = [
    {
        name: 'Grúa',
        id:1,
        Icon: TbCarCrane
    },
    {
        name:'Salud',
        id:2,
        Icon: PiBandaidsFill
    },
    {
        name: 'Hogar',
        id:3,
        Icon: BsHouse
    },
    {
        name:'Desempleo',
        id:4,
        Icon: BsShieldCheck
    },
    {
        name: 'Tecnología',
        id:5,
        Icon: MdComputer
    },
]

export const frecuentQuestions = [
    {
        name: '¿Quién puede obtener un préstamo en COFA?',
        content: 'Brindamos préstamos online al instante a cualquier persona mayor de 18 años que trabaje en relación de dependencia con, al menos, 3 meses de antigüedad.',
        id: 1
    },
    {
        name: '¿Cuáles son los requisitos para obtener mi préstamo?',
        content: 'Para otorgarte un préstamo en línea al instante, todo lo que necesitás enviarnos es tu DNI para analizar tus antecedentes crediticios y tu CBU/CVU para transferirte el dinero.',
        id: 2
    },
    {
        name: '¿Qué analizan para darme el préstamo?',
        content: 'El análisis crediticio que realizamos está basado en tu historial financiero.\nUsamos un scoring crediticio propio, analizando decenas de variables, por lo que no importa si tenés antecedentes negativos en las agencias de información crediticia.\nCuanto mejor cumplimiento tenés, accedés a mejores condiciones en el préstamo.',
        id: 3
    },
    {
        name: '¿Cómo cobro mi préstamo?',
        content: 'A través de una transferencia al CBU/CVU informado.',
        id: 4
    },
    {
        name: '¿Cómo pago mi cuota?',
        content: 'Las cuotas podrán ser abonadas mediante transferencia o depósito bancario, débito interno o intrabancario y/o a través de los botones de pago habilitados.',
        id: 5
    },
    {
        name: '¿Y si ya tuve o tengo un préstamo con COFA?',
        content: 'Mejor! Ya te conocemos y obtener un nuevo préstamo es más fácil.',
        id: 6
    },
    {
        name: '¿Tenés otras preguntas?',
        content: 'Si tenés otras preguntas, escribinos a consultas@cofa.com.ar y responderemos tus dudas a la brevedad.',
        id: 7
    },
    {
        name: '¿Cuándo vencen las cuotas?',
        content: 'Podés optar por la fecha de vencimiento que más te convenga. Cuando solicitás el préstamo, nos avisas qué día te conviene pagar y ya queda registrado.',
        id: 8
    }
]


export const termsAndConditions = [
    {
        content: 'El Usuario reconoce y acepta que en los Términos y Condiciones se establecen las reglas de un contrato bilateral que se concertará mediante el uso, por los contratantes, de comunicaciones y mensajes recíprocos, a través de las herramientas de comunicación provistas en www.cofa.com.ar; en el que prevalecerán como principios rectores, y esenciales, la buena fe y el deber de colaboración entre el Usuario y COBRO FACIL S.R.L.'
    },
    {
        content: 'El acceso a www.cofa.com.ar sólo está disponible para las personas humanas que (i) sean mayores de dieciocho (18) años, (ii) tengan capacidad legal para contratar, y (iii)sean titulares de una cuenta bancaria en una Entidad Financiera supervisada por el Banco Central de la República Argentina o en un Proveedor de Servicios de Pago que ofrecen cuentas de pago (billeteras digitales). Por ello no podrán operar en www.cofa.com.ar las personas jurídicas, los menores de edad o las personas temporal o definitivamente inhabilitadas para contratar.'
    },
    {
        content: 'COBRO FACIL S.R.L. en cualquier momento y a su solo arbitrio, podrá disponer la suspensión o inhabilitación temporal o definitiva para el acceso del Usuario a www.cofa.com.ar.'
    },
    {
        content: 'Registro. El Usuario que cumpla con los requisitos precedentemente establecidos para utilizar la aplicación y/o los servicios de COFA deberá, como condición ineludible y de procedencia, completar el formulario de registración que se pone a su disposición en www.cofa.com.ar, informando, con el carácter de declaración jurada, los siguientes datos: nombre y apellido, sexo, fecha de nacimiento, número de documento nacional de identidad, domicilio real, dirección de correo electrónico y número de celular. Sin perjuicio de lo anterior, COBRO FACIL S.R.L. se reserva el derecho de requerir cualquier información y/o documentación adicional a los efectos del cumplimiento de cualquier normativa que resulte aplicable y/o que considere oportuna.'
    },
    {
        content: ' Registro. El Usuario que cumpla con los requisitos precedentemente establecidos para utilizar la aplicación y/o los servicios de COFA deberá, como condición ineludible y de procedencia, completar el formulario de registración que se pone a su disposición en www.cofa.com.ar, informando, con el carácter de declaración jurada, los siguientes datos: nombre y apellido, sexo, fecha de nacimiento, número de documento nacional de identidad, domicilio real, dirección de correo electrónico y número de celular. Sin perjuicio de lo anterior, COBRO FACIL S.R.L. se reserva el derecho de requerir cualquier información y/o documentación adicional a los efectos del cumplimiento de cualquier normativa que resulte aplicable y/o que considere oportuna.'
    },
    {
        content: 'CONSENTIMIENTO INFORMADO',
        subcontent: [
            {
                content:'El usuario, en su carácter de TÍTULAR DE LOS DATOS presta su CONSENTIMIENTO para que COBRO FACIL S.R.L. en su carácter de CESIONARIO confronte sus datos personales que se indican en párrafo siguiente con la base de datos del RENAPER, conforme a las especificaciones que a continuación se detallan:'
            },
            {
                content:'DATOS AUTORIZADOS: El presente consentimiento para el tratamiento de los datos personales alcanza a los incluidos en el Documento Nacional de Identidad (INCLUYENDO DATOS BIOMETRICOS DE HUELLA DACTILAR Y/O DE RECONOCIMIENTO FACIAL) en confronte con lo que informa el web service del REGISTRO NACIONAL DE LAS PERSONAS.'
            },
            {
                content:'INFORMACIÓN SOBRE EL TRATAMIENTO:',
                subcontent: [
                    {
                        content: 'Los datos serán tratados con la exclusiva finalidad de validar la identidad y verificar la vigencia del Documento Nacional de Identidad para COBRO FACIL S.R.L.'
                    },
                    {
                        content: 'Los datos son facilitados con carácter obligatorio, por cuanto es imprescindible identificar fehacientemente al titular, para asegurar el correcto proceso de identificación.'
                    },
                    {
                        content: 'El titular de los datos podrá ejercer los derechos de acceso, rectificación y supresión de sus datos en cualquier momento y a su sola solicitud ante el RENAPER'
                    },
                    {
                        content: 'En cumplimiento de la Resolución AAIP Nº 14/2018, le hacemos saber que la AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales'
                    },
                    {
                        content: 'COBRO FACIL S.R.L., a través de www.cofa.com.ar, comunicará al Usuario que ha remitido un enlace a la cuenta de correo electrónico designada por el Usuario, siempre que la funcionalidad de los sistemas de comunicación así se lo permitan, a fin de que éste proceda a Activar su Cuenta y esté en condiciones de proseguir con la utilización de los servicios ofrecidos.'
                    },
                    {
                        content: 'El Usuario que emita una Solicitud de Préstamo garantizará y responderá en cualquier caso por la veracidad, exactitud, vigencia y autenticidad de los datos facilitados y se comprometerá a mantenerlos debidamente actualizados. Adicionalmente, autorizará a COBRO FACIL S.R.L. a confirmar los datos suministrados acudiendo a entidades públicas, compañías especializadas o centrales de riesgo.'
                    },
                    {
                        content: 'COBRO FACIL S.R.L. podrá solicitar al Usuario la presentación o envío de cualquier comprobante y/o dato adicional que considere necesario a efectos de corroborar, confirmar y/o verificar los datos personales información provista por el Usuario, en igual sentido podrá verificar los datos personales y/o información suministrada – por si o a través de terceros- recurriendo a entidades públicas, compañías especializadas o centrales de riesgo, entre otros, lo que el Usuario consiente expresamente. COBRO FACIL S.R.L. podrá, en cualquier momento, suspender temporal o definitivamente al Usuario cuyos datos no hayan podido ser confirmados, sin que ello genere derecho alguno al Usuario.'
                    },
                    {
                        content: 'Una vez activada la cuenta del Usuario en los términos del punto 6 de estos términos, COBRO FACIL S.R.L. habilitará una cuenta personal, única e intransferible, a través de la cual el Usuario podrá acceder a la plataforma y/o los servicios mediante la introducción de su usuario y contraseña (en adelante la “Cuenta”).'
                    },
                    {
                        content: 'El Usuario podrá modificar o sustituir su contraseña en cualquier momento y se obliga a preservar tal contraseña bajo absoluta confidencialidad y a no revelarla o compartirla con otras personas bajo ningún concepto. A todo evento queda suficientemente establecido que el Usuario es exclusivo responsable por el uso de la contraseña en COFA y asume las consecuencias derivadas de ello. No obstante, el Usuario se obliga a notificar a COBRO FACIL S.R.L. en forma inmediata y por medio fehaciente de cualquier uso no autorizado de su contraseña y/o del ingreso a su Cuenta por terceros no autorizados por él.'
                    },
                    {
                        content: 'COBRO FACIL S.R.L. se reserva el derecho a rechazar cualquier Solicitud de Préstamo, así como el de cancelar una activación previamente aceptada, sin que esté obligado a comunicar o exponer las razones de su decisión y sin que ello genere derecho alguno a favor del Usuario.'
                    }
                ]
            }
        ]
    },
    {
        content: 'Acceso a la Cuenta y Datos Personales',
        subcontent: [
            {
                content: 'El Usuario tiene la facultad de ejercer el derecho de acceso a sus datos personales, almacenados por COFA, en forma gratuita a intervalos no inferiores a seis (6) meses, salvo que acredite un interés legítimo al efecto conforme lo establecido en el artículo 14 inciso 3 de la Ley N° 25.326. LA AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.'
            },
            {
                content: 'El Usuario en oportunidad del uso de www.cofa.com.ar se obliga a no ejecutar y/o realizar operaciones y/o actos que pongan en riesgo, o generen daños inmediatos o mediatos, a la operación normal y habitual de COFA. En tal evento COBRO FACIL S.R.L. podrá suspender temporal o definitivamente al Usuario y/o cancelar su Cuenta, sin perjuicio del cumplimiento de las obligaciones contraídas y de las acciones legales que pudieran corresponder, particularmente con relación a los daños causados'
            },
            {
                content: 'COBRO FACIL S.R.L., en un fiel reflejo de su responsabilidad empresarial, informa al Usuario que el acceso a www.cofa.com.ar es de acceso voluntario, sujeto a estos Términos y Condiciones y a la Política de Privacidad, para el uso y/o goce de los servicios, información o entretenimientos que COFA contiene y brinda. En consecuencia, COBRO FACIL S.R.L. informa al Usuario que no asume ninguna responsabilidad adicional a las que se fijan específicamente en los Términos y Condiciones y la Política de Privacidad.'
            }
        ]
    },
    {
        content: 'COBRO FACIL S.R.L. no garantiza el acceso y/o uso continuado o ininterrumpido de www.cofa.com.ar, ya que el sistema puede eventualmente no estar disponible debido a dificultades técnicas o fallas de Internet. No obstante, se compromete a realizar sus mejores esfuerzos para procurar restablecer el sistema con la mayor celeridad posible sin que por ello pueda imputársele algún tipo de responsabilidad.'
    },
    {
        content: 'COBRO FACIL S.R.L. no será responsable por las eventuales consecuencias, de cualquier tipo que fuera, resultantes de fallas en el sistema, en el servidor o en Internet que pudieran surgir del acceso y/o uso de www.cofa.com.ar bajo cualquier modalidad que el Usuario empleara ni será responsable por eventuales errores u omisiones contenidos en el uso de la página web.'
    },
    {
        content: 'El Usuario presta su consentimiento para que COBRO FACIL S.R.L. a través de www.cofa.com.ar pueda utilizar los datos aportados por el Usuario para enviar información y/o promociones y/o publicidad asociada a COFA y sus servicios.'
    },
    {
        content: 'La obtención de una Cuenta en www.cofa.com.ar por el Usuario es gratuita y constituye una condición de procedencia ineludible para el uso y/o goce de las aplicaciones y/o servicios que provee COBRO FACIL S.R.L.'
    },
    {
        content: 'Solicitud de Asistencia en Dinero, Propuesta de Asistencia y Aceptación.',
        subcontent: [
            {
                content: 'El Usuario, luego de ingresar a su Cuenta en www.cofa.com.ar, podrá solicitar a COBRO FACIL S.R.L., en todo momento, el otorgamiento de un préstamo en dinero -capital- (en adelante, la “Solicitud”), indicando (i) el monto del mismo, (ii) el plazo de devolución que propone, (iii) el CBU o CVU de la cuenta en la cual prefiere que se acredite el préstamo, debiendo ser esa cuenta de destino de titularidad del solicitante; y será la misma de la que se debitarán las cuotas pactadas. COFA se reserva el derecho de solicitar los datos de la tarjeta de débito vinculada a la cuenta (bancaria o digital), presente o futura, a fin de proceder a debitar las cuotas correspondientes.'
            },
            {
                content: ' Una vez recibida la Solicitud, COBRO FACIL S.R.L., en un plazo no mayor a 24 horas hábiles, comunicará al Usuario (i) el monto del préstamo susceptible de ser acordado, (ii) la tasa de interés efectiva anual aplicable y el costo financiero total, (iii) el monto y la fecha de la devolución del préstamo, (iv) el sistema de amortización del capital y cancelación de los intereses, dejándose expresa constancia que, salvo expresa indicación en contrario se utilizarán o el sistema directo o el sistema francés, (v) el número de cuenta bancaria o digital (identificadas por su CBU o CVU) en que acreditará el préstamo, (vi) la cantidad, periodicidad y monto de los pagos a realizar, (vii) los gastos extra, cargos, comisiones, seguros o adicionales, si los hubiere y (viii) los Intereses Punitorios (conforme dicho término se define más adelante) que resultarían aplicables en caso de mora (en adelante, la “Propuesta de Préstamo”). En igual plazo COBRO FACIL S.R.L. comunicará al Usuario el rechazo de la Solicitud, en caso de que suceda.'
            },
            {
                content: 'El Usuario, una vez recibida la aprobación de la Solicitud de Préstamo, comunicará a COBRO FACIL S.R.L., en www.cofa.com.ar, la aceptación de dicha aprobación (en adelante, la “Aceptación”).'
            },
            {
                content: 'La Aceptación obligará a COBRO FACIL S.R.L. a liquidar en un plazo no mayor a 24 horas hábiles el capital acordado, en la cuenta persona informada por el usuario y en las condiciones detalladas en la aprobación de la Solicitud de Préstamo; e implicará, de pleno derecho, el consentimiento y autorización del Usuario a que se debite automáticamente de la cuenta bancaria o digital correspondientes, el monto acordado de la devolución del préstamos en las fechas señaladas, conjuntamente con los intereses correspondientes, los gastos extra, punitorios, cargos, comisiones, seguros y/o adicionales, si los hubiere, todo ello conforme el sistema, cantidad, monto y periodicidad indicados en la aprobación de la Solicitud de Préstamo, a cuyos fines se obliga a mantener en la referida cuenta bancaria, en las fechas de vencimientos, los fondos suficientes para que el débito pueda hacerse efectivo. Esta autorización es irrevocable hasta que el ACREEDOR haya percibido el total del capital e intereses pactados.'
            },
            {
                content: 'En el caso de cambiar de cuenta bancaria y/o digital, el usuario se obliga a informar a COBRO FACIL SRL el nuevo número de CBU o CVU, a fin de permitir el débito de las cuotas adeudas. La información de un nuevo CBU o CVU, significa la autorización de débito automático contra la misma y en iguales condiciones que la anterior. El usuario renuncia y desiste de efectuar acciones tendientes a impedir el cobro, de las cuotas adeudadas, mediante débito automático en cuenta bancario o digital y/o en tarjeta de débito (como ser ORDEN DE NO PAGAR (R08), BAJA DE SERVICIO (R15), etc.), y asume el compromiso de evitar que el banco o PSP en el cual posee la cuenta referida efectúe cualquier medida que imposibilite el cobro de cualquier cuota o monto adeudado.'
            },
            {
                content: 'La tasa de interés compensatorio vigente es fija y varía según el perfil crediticio del solicitante del préstamo, el plazo de financiación elegido y la situación del mercado. A dicha tasa de interés compensatorio se le adicionará el IVA correspondiente. En www.cofa.com.ar existen ejemplos de tasas mínimas y máximas. Los intereses compensatorios se computarán desde la fecha de producido el desembolso hasta la fecha en la que el Usuario hiciera íntegra y efectiva devolución y reembolso de dicho monto, y en base a un año de trescientos sesenta y cinco días (365) días, para lo cual se incluirá el primer día del desembolso y se excluirá el último.'
            }
        ]
    },
    {
        content: `Política aplicable a los servicios prestados por COBRO FACIL S.R.L.
        El Usuario acepta la plena validez de las notificaciones enviadas entre las partes a través de www.cofa.com.ar y/o por correo electrónico, destacándose que el presente contrato se conviene sobre la base de la buena fe contractual y el deber de colaboración de las partes.`
    },
    {
        content: 'Intereses y cargos aplicables en caso de mora a los servicios prestados por COBRO FACIL S.R.L.',
        subcontent: [
            {
                content: 'El Usuario acepta que incurrirá en mora de pleno derecho y en forma automática, sin necesidad de interpelación judicial y/o extrajudicial previa alguna, en caso de no abonar íntegramente en tiempo y forma cualquiera de las sumas adeudadas a COBRO FACIL S.R.L. bajo cualquiera de los servicios prestados por COBRO FACIL S.R.L. y/o COFA. Producida la mora, COBRO FACIL S.R.L. podrá considerar la deuda de plazo vencido y exigir el inmediato e íntegro pago del saldo total adeudado con más los intereses compensatorios y punitorios, cuya tasa nominal anual resultará equivalente al 50% de los intereses compensatorios y será calculada por todo el tiempo que dure la mora, sobre la totalidad de las sumas impagas y en mora, y los cuales se computarán sobre el número real de días que hubiere durado la situación de mora, y en base a un año de trescientos sesenta y cinco (365) días, para lo cual se incluirá el primer día de mora y se excluirá el último.'
            },
            {
                content: ' Adicionalmente, COBRO FACIL S.R.L. podrá cobrar un cargo del 5% mensual sobre la deuda existente con más el IVA correspondiente (el cual será adicionado), por gastos administrativos iniciales que exige cualquier procedimiento de seguimiento de mora y gestión de cobranza.'
            }
        ]
    },
    {
        content: 'Se deja expresamente aclarado que COBRO FACIL S.R.L. es un Proveedor No Financiero de Crédito inscripto ante el Banco Central de la República Argentina bajo el Nº 55287, pero no presta al Usuario ningún servicio bancario ni cambiario.'
    },
    {
        content: `Actividad de Agente Institorio. Seguros.
        Se deja expresamente aclarado que COBRO FACIL S.R.L. es agente institorio inscripto ante la Superintendencia de Seguros de la Nación bajo el nro 334.`
    },
    {
        content: 'La Empresa provee al Usuario que lo solicite, un servicio gratuito de atención, asesoramiento y cotización de seguros sobre diferentes bienes y/o productos, provistos por diversas compañías de seguros debidamente autorizadas para funcionar (la “Compañía” o las "Compañías"), de modo que permite al Usuario optar por el producto que mejor se adapte a sus necesidades e intereses (los "Servicios").'
    },
    {
        content: 'La Empresa ofrece la intermediación de pólizas de seguros con entidades aseguradoras, la asesoría a las partes intervinientes en la contratación de seguros en la forma que establece la ley 22.400.- y los respectivos reglamentos, de pólizas de seguro, evaluaciones de riesgos y en general la asesoría amplia en la contratación de seguros y en la cobertura de riesgos. Se deja expresamente aclarado que LA EMPRESA NO ES UNA COMPAÑÍA DE SEGUROS, SINO QUE ES UNA EMPRESA HABILITADA PARA INTERMEDIAR ENTRE LAS ASEGURADORAS Y LOS ASEGURABLES / ASEGURADOS PARA LA CELEBRACION DE CONTRATOS DE SEGURO CUYA UNICA OBLIGADA AL CUMPLIMIENTO ES LA ASEGURADORA ELEGIDA POR EL USUARIO.'
    },
    {
        content: 'Actividad de Multiasistencias. La Empresa ofrece la intermediación de servicios de asistencia al automotor, motos, hogar y salud, entre otras, quedando la prestación de los servicios a cargo de las compañías contratadas a tal efecto y siendo estas las responsables por el cumplimiento de las asistencias contratadas, según lo dispuesto en los Términos y Condiciones especiales de cada asistencia.'
    },
    {
        content: `Conformidad para ceder.
        El Usuario presta desde ya su conformidad para que COBRO FACIL S.R.L. pueda ceder libremente, en fideicomiso o no, los derechos resultantes del uso de cualquiera de los productos ofrecidos por COFA, sin que ello pueda implicar modificación alguna de las obligaciones asumidas por el Usuario. En caso de que la cesión se realizara conforme a lo dispuesto en los arts. 70, 71 y 72 de la ley 24.441 (tal como la misma fuera modificada y complementada), no será requisito la notificación al Usuario`
    },
    {
        content: 'Aceptación de Términos y Condiciones',
        subcontent: [
            {
                content: 'El Usuario antes de aceptar los Términos y Condiciones ha tomado pleno conocimiento de estos, los ha tenido a la vista y leído con detenimiento y cuenta con copia de ellos a su disposición, pudiendo guardarla en su ordenador, imprimirlos o retirar copia firmada por COBRO FACIL S.R.L. en el domicilio especial fijado por la misma.'
            },
            {
                content: 'Estos Términos y Condiciones estarán regidos en todos sus puntos por las leyes vigentes en la República Argentina. Para todos los efectos de la presente, las partes se someten a la competencia de la Justicia Nacional en lo Comercial de la Capital Federal. COBRO FACIL S.R.L. constituye domicilio especial en Moreno 1628 piso 3° oficina 35 de la Ciudad Autónoma de Buenos Aires y el usuario en el domicilio denunciado en el formulario de registración.'
            }
        ]
    }
]


export const privacyPolicies = [
    {
        title: 'Información que es recogida',
        content: 'Nuestro sitio web podrá recoger información personal, por ejemplo: Nombre y apellido, información de contacto como número de teléfono o su dirección de correo electrónico, e información demográfica. Asimismo, cuando sea necesario, podrá ser requerida información específica para procesar algún pedido.'
    },
    {
        title: 'Uso de la información recogida',
        content: 'Nuestro sitio web emplea la información con el fin de proporcionar el mejor servicio posible, particularmente para procesar solicitudes y consultas, y para mejorar nuestro servicio. Es posible que sean enviados correos electrónicos o mensajes telefónicos a través de nuestro sitio con ofertas especiales, nuevos productos y otra información publicitaria que consideremos relevante para usted o que pueda brindarle algún beneficio, estas comunicaciones serán enviados a la dirección o teléfono que usted proporcione y podrán ser cancelados en cualquier momento. Usamos los sistemas más avanzados y los actualizamos constantemente para asegurarnos que no exista ningún acceso no autorizado.'
    },
    {
        title: 'Cookies',
        content: 'Una cookie se refiere a un fichero que es enviado con la finalidad de solicitar permiso para almacenarse en su ordenador, al aceptar dicho fichero se crea y la cookie sirve entonces para tener información respecto al tráfico web, y también facilita las futuras visitas a una web recurrente. Otra función que tienen las cookies es que con ellas las webs pueden reconocerte individualmente y por tanto brindarte el mejor servicio personalizado.\nNuestro sitio web puede emplear las cookies para poder identificar las páginas que son visitadas y su frecuencia. Esta información es empleada únicamente para análisis estadístico y después la información se elimina de forma permanente. Usted puede eliminar las cookies en cualquier momento desde su dispositivo. Sin embargo, las cookies ayudan a proporcionar un mejor servicio de los sitios web, estás no dan acceso a información de su dispositivo ni de usted, a menos de que usted así lo quiera y la proporcione directamente. Usted puede aceptar o negar el uso de cookies, sin embargo, la mayoría de los navegadores aceptan cookies automáticamente pues sirve para tener un mejor servicio. También usted puede cambiar la configuración de su ordenador para declinar las cookies. Si se declinan es posible que no pueda utilizar algunos de nuestros servicios.'
    },
    {
        title: 'Enlaces a Terceros',
        content: 'Este sitio web pudiera contener enlaces a otros sitios que pudieran ser de su interés. Una vez que usted hace click en estos enlaces y abandona nuestra página, ya no tenemos control sobre al sitio al que es redirigido y por lo tanto no somos responsables de los términos o privacidad ni de la protección de sus datos en esos otros sitios terceros. Dichos sitios están sujetos a sus propias políticas de privacidad por lo cual es recomendable que las consulte para confirmar que usted está de acuerdo con estas.'
    },
    {
        title: 'Control de su información personal',
        content: 'En cualquier momento usted puede restringir la recopilación o el uso de la información personal que es proporcionada a nuestro sitio web. Cada vez que se le solicite rellenar un formulario, como el de alta de usuario, consultas o solicitudes, puede marcar o desmarcar la opción de recibir información por correo electrónico y/o mensajes telefónicos. En caso de que haya marcado la opción de recibir nuestras comunicaciones y/o publicidades, usted puede cancelarla en cualquier momento. COFA no venderá, cederá ni distribuirá la información personal que es recopilada sin su consentimiento, salvo que sea requerido por orden judicial.\nAl utilizar cualquier formulario o la página web, el usuario autoriza expresamente a COBRO FACIL S.R.L., sus afiliadas y subsidiarias, en los términos requeridos por el art. 5 y 11 de la Ley 25.326 a usar sus datos personales para cumplimentar con la solicitud y/o consulta -incluyendo verificar identidad, realizar controles de fraude y de crédito y evaluar su capacidad para pagar el préstamo (análisis crediticio). A su vez, el usuario ha sido informado que, como titular de los datos personales, tiene la facultad de ejercer el derecho de acceso, rectificación y supresión de estos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La DIRECCIÓN NACIONAL DE PROTECCIÓN DE DATOS PERSONALES, Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.”\nCobro Facil SRL se reserva el derecho de cambiar los términos de la presente Política de Privacidad en cualquier momento.'
    }
]

export const howDoAddPoints = [
    {
        Icon: PiUsersThreeLight,
        title: 'Referir amigos',
        content: 'Compartí el nombre, número de celular y correo de tu referido, mayor de 18 años y sin historial en COFA para adquirir un préstamo y/o una asistencia.'
    },
    {
        Icon: LuClipboardCheck,
        title: 'Encuestas de satisfacción',
        content: 'Completá y enviá la encuesta de satisfacción que te va a llegar después de contratar un producto COFA.'
    },
    {
        Icon: IoRibbonOutline,
        title: 'Finalizar un préstamo',
        content: 'Cuando terminás un préstamo en el plazo acordado cuyas cuotas hayan sido abonadas en tiempo y forma, y sin atrasos mayores a 30 días corridos del vencimiento de cada una.'
    },
    {
        Icon: PiConfetti,
        title: 'Cumpleaños feliz',
        content: 'Para obtener puntos COFA, asegurate de tener al menos un producto activo el día de tu cumpleaños.'
    },
    {
        Icon: CiLocationArrow1,
        title: 'Seguirnos en las redes',
        content: 'Seguir a COFA en Instagram y/o Facebook e informar por Whatsapp o por mail el nombre de usuario y la red en la que nos siguen.'
    },
]

export const termsAndConditionsPoints = [
    {
        content: 'Participantes. Adhesión: Podrán participar del Programa las personas humanas mayores de edad titulares de, al menos, un (1) producto vigente con COFA (Clientes). La adhesión al Programa se efectúa con la primera acreditación de Puntos.'
    },
    {
        content: 'Puntos: COFA premiará a los Clientes que:',
        subcontent: [
            {
                content:'Referidos: Refieran a otras personas humanas mayores de edad (Referidos) con la asignación de puntos (Puntos), de acuerdo con lo dispuesto en la cláusula 15 del presente.',
                subcontent:[
                    {
                        content:'Para referir a un potencial cliente, el Cliente debe enviar a COFA, mediante WhatsApp o mail, un número de celular de contacto y/o un mail, y el nombre de la persona que desea referir.'
                    },
                    {
                        content:'COFA comunicará al Referido que se encuentra designado como tal mediante mail y/o contacto telefónico.'
                    },
                    {
                        content:'El “Cliente” puede tener más de un “Referido”, pero un “Referido” no puede ser referido por más de un “Cliente”.'
                    },
                    {
                        content:'COFA no se responsabiliza por los datos que hayan sido informados de manera incorrecta ni por aquellos cargados fuera de fecha que impidan su participación en la presente promoción.'
                    },
                    {
                        content:'Los Clientes consienten expresamente que serán los únicos responsables de obtener, previo a efectuar un referimiento a COFA de potenciales clientes (Referidos) mayores de edad, el consentimiento y autorización expresa previa de dichas personas, para proporcionar a COFA sus datos personales, para que COFA pueda efectuar el tratamiento de los mismos con la finalidad comercial de ofrecerles y en su caso, ofrecerles y otorgarles alguno de los productos comercializados por COFA, en el marco de la actividad que desarrolla, y solo en tal supuesto incorporarlos a sus bases de datos. El consentimiento que los Clientes deberán obtener de las personas humanas mayores de edad que refieran a COFA, será no obstante sin perjuicio de todos los derechos que le asisten a los mismos en virtud de la ley 25.326 de Protección de Datos Personales. Los datos personales de los Referidos serán confidenciales, y podrán ser utilizados y conservados por COFA de acuerdo con lo dispuesto en las Políticas de Privacidad de COFA (https://cofa.com.ar/politicas-de-privacidad). Se informa que COFA se encuentra inscripta en el Registro Nacional de Bases de Datos Personales. A requerimiento de cualquier interesado, los datos personales almacenados, serán corregidos, actualizados, rectificados o eliminados; para ello los Clientes y/o las personas por ellos referidas se podrán comunicar con COFA a la siguiente dirección de correo electrónico: contacto@cofa.com.ar.'
                    },
                    {
                        content:'Se aplica a los Referidos que:',
                        /* TO DO: este subcontent no se esta mostrando */
                        subcontent:[
                            {
                                content:'Soliciten, obtengan y mantengan vigente por más de diez (10) días corridos contados a partir de la fecha de celebración del respectivo contrato, un primer préstamo y no sean o hayan sido clientes de COFA.'
                            },
                            {
                                content:'Soliciten y mantengan vigente por el plazo de tres (03) meses contínuos una primera asistencia COFA (www.cofa.com.ar/asistencias).'
                            },
                        ]

                    }
                ]    
            },
            {
                content:'Completen y envíen la encuesta de satisfacción que se remite a cada Cliente luego del alta de algún producto o servicio en COFA. La misma debe ser enviada a contacto@cofa.com.ar desde el mail del Cliente.'
            },
            {
                content:'Finalicen un préstamo en el plazo acordado y hayan abonado todas las cuotas de un préstamo en tiempo y forma, y sin atrasos mayores a 30 días corridos del vencimiento de cada una.'
            },
            {
                content:'Quienes siendo clientes de COFA tengan 1 (un) producto activo el día de su cumpleaños y se encuentren al día en el pago de sus obligaciones.'
            }
        ]
    },
    {
        content: 'Validez y Vigencia: El Programa tendrá validez en todo el territorio de la República Argentina hasta el 31.12.2024, pudiendo ser prorrogado en forma automática por el término de 1 (un) año ante cada vencimiento, y, también, ser suspendido en los términos de la cláusula 11 del presente Reglamento. Los Puntos tendrán una vigencia máxima de doce (12) meses a partir de la fecha en que fueron otorgados; Los puntos COFA vencerán indefectiblemente si la Cuenta no registra movimientos por canje de puntos en un período de 12 (doce) meses. En caso de que el Programa se venciera y no fuera prorrogado por COFA, los Puntos susceptibles de ser canjeados que no hayan sido canjeados por los Clientes dentro del período de vigencia del Programa, podrán ser canjeados en los términos de lo dispuesto en la cláusula 11 más abajo, o en su defecto, se extinguirán de pleno derecho. Los restantes Puntos que no den derecho a un canje, no podrán ser canjeados ni otorgarán derecho alguno a sus titulares y se extinguirán de pleno derecho. Por el contrario, si el Programa fuera prorrogado, los Puntos de los Clientes que no hayan sido canjeados continuarán vigentes hasta lo primero entre (a) el vencimiento de su plazo de vigencia y (b) el vencimiento del plazo de vigencia del Programa.'
    },
    {
        content: 'Acreditación y Vencimiento de Puntos: Los Puntos acumulados bajo el Programa sólo podrán ser canjeados y/o utilizados por los Clientes para obtener como premio:',
        subcontent:[
            {
                content:' ',
                subcontent:[
                    {
                        content:'El descuento de hasta el 50% de una de las cuotas de un (1) préstamo vigente con COFA. En caso de que posea más de un (1) préstamo, el Cliente deberá indicar a qué préstamo desea aplicarlo, en su defecto, el beneficio será aplicable al préstamo de mayor plazo. (Ver cláusulas 14 y 15 del presente Reglamento).'
                    },
                    {
                        content:'El descuento de hasta el 50% en el precio mensual de una de las cuotas de una asistencia vigente con COFA y que tenga una antigüedad de al menos 3 (tres) meses.'
                    },
                ]
            },
            {
                content:'La acreditación de Puntos será efectuada en la Cuenta Única otorgada por COFA a cada cliente, a los quince (15) días hábiles contados a partir de:',
                subcontent:[
                    {
                        content:'La fecha en que el Referido haya firmado el contrato de préstamo con COFA.'
                    },
                    {
                        content:'La fecha en que el Referido haya abonado la tercera (3ra) cuota de la primera asistencia COFA otorgada.'
                    },
                    {
                        content:'La fecha en que completó y envió a COFA la encuesta de satisfacción.'
                    },
                    {
                        content:'Que se cumplan los requisitos previstos en la cláusula 2.3. del presente con relación a la finalización de un préstamo'
                    },
                    {
                        content:'La fecha del cumpleaños de su natalicio.'
                    },
                ]
            },
            {
                content: 'El canje se podrá solicitar en cualquier momento a partir de la acreditación siempre y cuando se cumplan los requisitos aplicables; si se efectúa del 1 al 15 de un mes, el premio se aplicará a la cuota cuyo vencimiento opere al mes siguiente, y si se solicitara del 16 al 31, el canje de puntos se efectuará y el premio se aplicará a la cuota cuyo vencimiento opere en el mes subsiguiente. Cada vez que se solicite un canje de puntos, se descontarán inmediatamente, de la Cuenta Única del Cliente, los puntos correspondientes.'
            }
        ]
    },
    {
        content:'Impedimentos: No podrán canjear sus Puntos aquellos Clientes que se encuentren en algún grado de incumplimiento con cualquiera de sus obligaciones contraídas con COFA (ej.: incumplimiento de pago, mora, causales de terminación o de exclusión, etc.).',
        subcontent:[
            {
                content:'Los Puntos no pueden ser canjeados para ser aplicados al pago de cuotas con más de 30 días de vencimiento.'
            },
            {
                content:'No podrán participar el programa aquellas personas o empresas que sean empleados de COFA, no proveedores, ni comercializadores de algún producto.'
            },
        ]
    },
    {
        content: 'Intransferibilidad: Los Puntos son de carácter estrictamente personal y como tales, no son transferibles a ninguna otra cuenta o Cliente que participe del Programa, ni a ninguna otra persona humana o jurídica, bajo ningún título o causa (ej.: cesión, endoso, fallecimiento, disolución de la sociedad conyugal, etc.).'
    },
    {
        content:'Descuento: COFA podrá descontar de la cuenta de los Clientes, sin notificación ni aviso previo, los Puntos acreditados por error o relacionados con una transacción que hubiere sido cancelada, revertida o ajustada, o que se hubieran sido obtenidos contrariando lo dispuesto en este Reglamento o de cualquier otra forma desleal, fraudulenta o engañosa.'
    },
    {
        content:'Comunicación: Los puntos deberán ser utilizados y/o canjeados por los Clientes enviado una solicitud expresa por mail a COFA a la siguiente dirección de correo electrónico: contacto@cofa.com.ar o a través de su cuenta personal en www.cofa.com.ar (Página Web de COFA).'
    },
    {
        content:'Publicidad: El presente Reglamento estará disponible para su consulta en www.cofa.com.ar Los puntos acumulados serán informados a los Clientes en forma mensual, sin perjuicio de lo cual el Cliente podrá consultar su estado de acumulación de puntos escribiendo por correo electrónico a COFA a contacto@cofa.com.ar.'
    },
    {
        content:'Modificación: COFA se reserva el derecho de modificar a su solo criterio, durante la vigencia del Programa, el Reglamento, como así también la grilla de productos y servicios que permiten sumar Puntos y el esquema de canje de Puntos. Dichas modificaciones, que se comunicarán en la forma prevista en la cláusula 11 más abajo, entrarán en vigor en forma inmediata, salvo que se estipule un plazo distinto, pero, en cualquier caso, no afectarán en forma adversa a los canjes de puntos ya recibidos por los Clientes con fecha anterior a su entrada en vigencia.'
    },
    {
        content:'Suspensión del Programa: COFA se reserva el derecho de postergar, suspender o discontinuar a su sólo criterio el Programa, comunicándolo previamente a los Clientes mediante el envío de un correo electrónico y/o la publicación de avisos en la Página Web de COFA: www.cofa.com.ar, por lo que todos los Clientes, por el sólo hecho de participar en el Programa reconocen expresamente conocer y aceptar el derecho de COFA de ejercer tal reserva y su forma de comunicación, renunciando a efectuar a COFA cualquier reclamo fundado en dicha circunstancia. Los Clientes podrán canjear los Puntos acumulados por los beneficios disponibles, por un plazo de noventa (90) días corridos desde la notificación de la discontinuidad definitiva del Programa siempre que cumplan con las demás condiciones aplicables.'
    },
    {
        content:'Autorización: La participación de los Clientes en el Programa implica la autorización expresa e irrevocable de los mismos a COFA para utilizar sus nombres, números de documentos, imágenes personales y/o voces para publicitar el Programa en cualquier medio, en la forma que COFA considere más conveniente y sin que esto genere derecho a compensación de ninguna especie, hasta transcurridos tres (3) años de su adhesión. COFA ejercerá este derecho en forma prudente y razonable, observando, en lo pertinente, las restricciones y prohibiciones que establezca la normativa aplicable vigente.'
    },
    {
        content:'Aceptación: La participación en el Programa implica el conocimiento y aceptación de todas las condiciones que se encuentran contenidas en este Reglamento e implica asumir la obligación de informarse acerca de las condiciones vigentes aplicables al mismo en cada momento, las que podrán ser consultadas en la Página Web de COFA: www.cofa.com.ar.'
    },
    {
        content:'Canje: El canje de Puntos sólo podrá ser efectuado por los tomadores de algún producto o servicio vigentes a la fecha de canje.',
        subcontent:[
            {
                content:'Los Puntos se pueden canjear por un premio consistente en cierto descuento (explicado más adelante) en el monto de una cuota de su préstamo, siempre y cuando el Cliente haya llegado al menos, a repagar la mitad del préstamo. Si tuviera más de un crédito activo, al momento de efectuar el canje tendrá que elegir uno respecto del cual efectuar el canje y acceder al premio. El canje no puede hacerse respecto de más de un préstamo, y no es susceptible de utilizarse en forma fraccionada entre dos o más préstamos. Solo puede utilizarse respecto de un solo préstamo vigente, que cumpla los criterios aplicables y que haya sido seleccionado por el Cliente; o en ausencia de tal indicación, será aplicable al préstamo vigente elegible de mayor plazo.'
            },
            {
                content:'Los Puntos se pueden canjear por un premio consistente en cierto descuento (explicado más adelante) en el monto de una cuota de su asistencia, siempre y cuando el Cliente haya llegado al menos, a pagar 3 (tres) cuotas de la misma. Si tuviera más de una asistencia activo, al momento de efectuar el canje tendrá que elegir una respecto de la cual efectuar el canje y acceder al premio. El canje no puede hacerse respecto de más de una asistencia, y no es susceptible de utilizarse en forma fraccionada entre dos o más asistencias. Solo puede utilizarse respecto de una sola asistencia vigente, que cumpla los criterios aplicables y que haya sido seleccionada por el Cliente; o en ausencia de tal indicación, será aplicable a la asistencia cuyo precio mensual sea menor.'
            },
            {
                content:'El premio resultante del canje será un descuento en favor del Cliente que no podrá superar el 50% de la cuota, sea de un préstamo o de una asistencia.'
            },
            {
                content:'Solo puede haber un (1) canje de Puntos por mes calendario para préstamo y otro para asistencia.'
            },
            {
                content:'Se pueden hacer hasta dos (2) canjes como máximo, por préstamo. En el caso de las asistencias es ilimitado.'
            },
            {
                content:'No podrán ser canjeados por dinero en efectivo ni por ningún otro bien o derecho.'
            },
            {
                content:'Todo impuesto, gravamen, carga, retención o similar (actual o futuro) que deba tributarse o se origine sobre o en relación con los puntos otorgados serán a cargo de los participantes ganadores.'
            },
        ]
    },
    {
        content: 'Valor de los Punto: 1 Punto canjeado equivale a un premio equivalente a la reducción en el pago del servicio elegido por la suma de ar$10. (sujeto a los requisitos detallados en el Reglamento).',
        subcontent: [
            {
                content:'Por cada referido que:',
                subcontent: [
                    {
                        content: 'Efectivamente solicite y firme un préstamo con COFA y mantenga vigente el mismo durante el plazo mínimo aplicable, sin ejercer derecho de arrepentimiento o revocación: 400 Puntos en el Programa.'
                    },
                    {
                        content: 'Efectivamente solicite una asistencia COFA y la mantenga activa y al día por al menos tres (03) meses consecutivos: 100 Puntos en el Programa.'
                    },
                ]
            },
            {
                content:'Por cada encuesta de satisfacción completada y enviada: 100 Puntos en el Programa.'
            },
            {
                content:'Finalicen en tiempo y forma un préstamo: 200 Puntos en el Programa'
            },
            {
                content:'Por cumplir años de su natalicio mientras tiene un producto activo y al día siendo cliente COFA: 100 Puntos en el Programa'
            },
            {
                content:'El cliente que haya referido a cinco (5) REFERIDOS que adquieran al menos un (1) préstamo cada uno, en el transcurso de un año calendario, recibirá el doble de puntos a partir del sexto Referido de préstamos. (conf. cláusula 15.1.a.)'
            },
            {
                content:'El cliente que haya referido a cinco (5) REFERIDOS que adquieran al menos una (1) asistencia, en el transcurso de un año calendario, recibirá el doble de puntos a partir del sexto Referido de asistencias (conf. cláusula 15.1.b.)'
            },
            {
                content:'No se computarán fracciones de Puntos.'
            },
            {
                content:'Los puntos son acumulables.'
            }
        ]
    },
    {
        content:'Equivalencia: La relación entre magnitud de descuento en una cuota (expresado en ar$) y puntaje acumulado, podrá ser modificada a criterio de COFA cuando lo considere conveniente, lo cual será previamente notificado a los Clientes y no afectará adversamente a los canjes solicitados y/o en curso.'
    },
    {
        content:'Exclusión: No se consideran elegibles para el otorgamiento de los Puntos:',
        subcontent: [
            {
                content:'Los Referidos que no soliciten y firmen un primer crédito con COFA o que habiendo solicitado y firmado el mismo hagan uso de su derecho a “baja de producto” (botón de arrepentimiento) o de revocación dentro de los diez días hábiles de dicha firma.',
            },
            {
                content:'Los Referidos que no obtengan una primera asistencia COFA o que habiéndola obtenido no hayan cumplido con el pago de tres meses consecutivos.',
            },
            {
                content:'Las encuestas que estuvieran vacías o completadas en forma parcial, o que no sean enviadas al mail que se indica al momento de enviar el formulario.',
            }
        ]
    },
    {
        content:'Baja del Programa: El Cliente podrá solicitar la baja del Programa en cualquier momento cuando lo crea conveniente, mediante el envío de una comunicación a COFA por correo electrónico a: contacto@cofa.com.ar; no siendo obligatorio para ello el canje de los Puntos acumulados no canjeados que existieran hasta el momento, los que ante el pedido de baja caducarán automáticamente y de pleno derecho, sin otorgar derecho al Cliente a compensación, premio o devolución de suma alguna. Una vez procesada la baja del Programa el Cliente podrá volver a adherirse y participar del mismo, si así lo dispone nuevamente y cumple con alguna de las condiciones para obtener Puntos, en las condiciones previstas en el Programa.'
    },
    {
        content:'Reserva: COFA se reserva el derecho de establecer y pronunciarse sobre aquellas situaciones o circunstancias que no estén expresamente previstas en este Reglamento, y adaptar o modificar las reglas del Programa en consecuencia con la única obligación de notificar los eventuales cambios a los Clientes por correo electrónico y/o a través de su Página Web, www.cofa.com.ar.'
    },
    {
        content:'Cesión: Cesión de datos. Los datos recopilados de los Clientes y Referidos son de utilización y aplicación de la actividad de COFA y/o cualquier sociedad que en el futuro sea vinculada y/o subsidiaria, para lo cual el Cliente presta su expresa conformidad. Los datos podrán ser incorporados a una base de datos en cualquier formato. El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establece el artículo 14, inciso 3 de la ley n°25.326. Asimismo, el titular brinda su expreso consentimiento para que conforme lo establecido en el art. 27 de la ley de Protección de Datos Personales COFA pueda recopilar domicilios, repartir documentos, publicidad o venta directa y otras actividades análogas, mediante el tratamiento de datos que sean aptos para establecer perfiles determinados con fines promocionales, comerciales o publicitarios; o permitan establecer hábitos de consumo, así como conforme el art. 27 del decreto reglamentario 1558/01 el Cliente y/o Referido brinda su expreso consentimiento para que COFA pueda recopilar, tratar y ceder sus datos como así también el de sus consumos con fines de publicidad y ofrecimiento de productos para la formación de perfiles determinados, que categoricen preferencias y comportamientos similares de las personas. Asimismo, los titulares de los datos autorizan y consienten que los mismos sean utilizados y/o cedidos con fines de marketing de conformidad con el art. 4 inc. 1 y 3 de la ley de propiedad de datos personales. Con la aceptación de los presentes Términos y Condiciones, el Cliente está autorizando a COFA y a todos aquellos que resulten necesarios para la continuidad del Programa, para que en caso de que en el futuro el Programa tenga un nuevo propietario, se ceda la información sobre el desarrollo de su cuenta y su historia en Puntos COFA al nuevo propietario.'
    },
    {
        content:'Derecho de Propiedad Intelectual: Los contenidos del Programa tales como texto, información, gráficos, imágenes, logos, marcas, programas de computación, bases de datos, diseños, arquitectura funcional, aplicaciones, páginas web y cualquier otro material, todos los derechos intelectuales e industriales, códigos, desarrollo, software, hardware, dominio, emblemas, logotipos, diseños, estructura, contenidos, información, etc. sobre Puntos COFA (el “Contenido"),son de propiedad de Cobro Fácil S.R.L, y están protegidos por las leyes vigentes en Argentina, incluyendo, pero sin limitación, las leyes sobre derechos de autor, patentes, marcas, modelos de utilidad, diseños industriales y nombres de dominio. El uso, adaptación, reproducción y/o comercialización del Contenido del programa Puntos COFA no se encuentra autorizada a terceros, lo que el Cliente reconoce y acepta. En ningún caso se entenderá que el Cliente, los Referidos, y/o algún otro tercero, tendrán algún tipo de derecho sobre el Contenido.'
    },
    {
        content:'Domicilio: Para todos los efectos legales del presente el Cliente constituye domicilio en el lugar establecido en el último préstamo que haya tomado con COFA, y COFA en Moreno 1628 piso 3° oficina 35 CABA. Ver x domicilio electrónico.'
    },
    {
        content:'Jurisdicción: Para cualquier cuestión judicial que pudiera derivarse del Programa, los canjes de Puntos, etc., los Clientes y COFA se someterán a la jurisdicción exclusiva de los Tribunales Ordinarios en lo comercial con asiento en la Ciudad Autónoma de Buenos Aires, con renuncia a cualquier otro fuero o jurisdicción.'
    }
]

export const clientReview = [
    {
        content: 'Muy claros a la hora de atenderme. Siempre están bien predispuestos a explicar cuando uno tiene alguna pregunta.',
        author: 'Pablo'
    },
    {
        content: 'La atención es muy buena; conozco el servicio y nunca tuve ningún problema.',
        author: 'Laura'
    },
    {
        content: 'Muy buena atención y excelente predisposición. Cumplieron con el préstamo y me depositaron en el día lo que necesitaba.',
        author: 'Ricardo'
    }
]