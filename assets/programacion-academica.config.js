/**
 * IBERO — ÚNICA FUENTE DE COHORTES PÚBLICAS.
 * Fechas YYYY-MM-DD; horas en Ecuador (America/Guayaquil).
 * Los cursos cortos cambian a la siguiente cohorte al comenzar el día de inicio en Ecuador.
 * Diplomados, máster y talleres conservan su cohorte durante la ejecución; el calendario mantiene los eventos activos.
 * Si no queda ninguna cohorte futura confirmada, las vistas muestran «Próxima cohorte por confirmar».
 * Agregar futuras cohortes SOLO en programs.<programa>.cohorts/postponedCohorts; no editar las páginas.
 * status: "confirmed" publica; "tentative" o "cancelled" NO publica.
 * diplomadoAppsAplazado: true activa la programación aplazada aprobada.
 * No contiene precios ni modifica inscripciones, certificados o temarios.
 */
window.IBERO_PROGRAMACION_CONFIG = {
  "version": "2026-09-12.1",
  "timeZone": "America/Guayaquil",
  "utcOffset": "-05:00",
  "diplomadoAppsAplazado": true,
  "programs": {
    "marketing": {
      "name": "Certificación en Marketing Digital con IA y Agentes",
      "url": "/marketing-digital-con-ia/",
      "aliases": [
        "marketing-digital-con-ia",
        "certificado-marketing-digital-inteligencia-artificial"
      ],
      "type": "curso",
      "calendarTitle": "CERTIFICACIÓN EN MARKETING DIGITAL CON INTELIGENCIA ARTIFICIAL Y AGENTES",
      "description": "Contenido, Meta Ads/Facebook Ads, embudos, automatización y crecimiento comercial.",
      "startTime": "19:00",
      "endTime": "21:00",
      "weekdays": [
        1,
        2,
        3,
        4
      ],
      "schedule": "Lun a Jue, 7:00 PM - 9:00 PM",
      "cohorts": [
        {
          "id": "marketing-2026-10-26",
          "start": "2026-10-26",
          "end": "2026-10-29",
          "status": "confirmed"
        }
      ],
      "postponedCohorts": [
        {
          "id": "marketing-2026-10-05",
          "start": "2026-10-05",
          "end": "2026-10-08",
          "status": "confirmed"
        },
        {
          "id": "marketing-2026-11-02",
          "start": "2026-11-02",
          "end": "2026-11-05",
          "status": "confirmed"
        },
        {
          "id": "marketing-2026-11-23",
          "start": "2026-11-23",
          "end": "2026-11-26",
          "status": "confirmed"
        }
      ],
      "registrationDaysBefore": 14
    },
    "agents": {
      "name": "Certificación en Productividad y Automatización de Procesos con IA",
      "url": "/productividad-automatizacion-procesos-ia/",
      "aliases": [
        "productividad-automatizacion-procesos-ia",
        "certificado-productividad-automatizacion-procesos-ia"
      ],
      "type": "curso",
      "calendarTitle": "CERTIFICACIÓN EN PRODUCTIVIDAD Y AUTOMATIZACIÓN DE PROCESOS CON INTELIGENCIA ARTIFICIAL",
      "description": "Crea agentes, diseña loops y automatiza tareas repetitivas para negocios con Codex, Antigravity y Goatify.",
      "startTime": "19:00",
      "endTime": "21:00",
      "weekdays": [
        1,
        2,
        3,
        4
      ],
      "schedule": "Lun a Jue, 7:00 PM - 9:00 PM",
      "cohorts": [
        {
          "id": "agents-2026-09-07",
          "start": "2026-09-07",
          "end": "2026-09-10",
          "status": "confirmed"
        },
        {
          "id": "agents-2026-11-02",
          "start": "2026-11-02",
          "end": "2026-11-05",
          "status": "confirmed"
        }
      ],
      "postponedCohorts": [
        {
          "id": "agents-2026-09-28",
          "start": "2026-09-28",
          "end": "2026-10-01",
          "status": "confirmed"
        },
        {
          "id": "agents-2026-10-26",
          "start": "2026-10-26",
          "end": "2026-10-29",
          "status": "confirmed"
        },
        {
          "id": "agents-2026-11-16",
          "start": "2026-11-16",
          "end": "2026-11-19",
          "status": "confirmed"
        },
        {
          "id": "agents-2027-01-11",
          "start": "2027-01-11",
          "end": "2027-01-14",
          "status": "confirmed"
        }
      ],
      "registrationDaysBefore": 14
    },
    "courses": {
      "name": "Certificación en Creación de Cursos Online y Academias Digitales",
      "url": "/crea-tu-academia/",
      "aliases": [
        "crea-tu-academia",
        "certificado-diseno-produccion-cursos-online-ia"
      ],
      "type": "curso",
      "calendarTitle": "CERTIFICACIÓN EN CREACIÓN DE CURSOS ONLINE Y ACADEMIAS DIGITALES",
      "description": "Estructura currículo, contenido, agentes, soporte, captación y lanzamiento de un curso online.",
      "startTime": "19:00",
      "endTime": "21:00",
      "weekdays": [
        1,
        2,
        3,
        4
      ],
      "schedule": "Lun a Jue, 7:00 PM - 9:00 PM",
      "cohorts": [
        {
          "id": "courses-2026-09-14",
          "start": "2026-09-14",
          "end": "2026-09-17",
          "status": "confirmed"
        }
      ],
      "registrationDaysBefore": 14
    },
    "communication": {
      "name": "Certificación en Comunicación Efectiva y Hablar en Público",
      "url": "/comunicacion-efectiva/",
      "aliases": [
        "comunicacion-efectiva",
        "certificado-comunicacion-efectiva-oratoria-profesional"
      ],
      "type": "taller",
      "calendarTitle": "CERTIFICACIÓN EN COMUNICACIÓN EFECTIVA Y HABLAR EN PÚBLICO",
      "description": "Taller práctico presencial.",
      "startTime": "09:00",
      "endTime": "13:00",
      "weekdays": [
        6
      ],
      "schedule": "Sábado, 9:00 AM a 1:00 PM",
      "cohorts": [
        {
          "id": "communication-2026-10-10",
          "start": "2026-10-10",
          "end": "2026-10-10",
          "status": "confirmed"
        }
      ],
      "registrationDaysBefore": 14
    },
    "appsDiploma": {
      "name": "Diplomado en Desarrollo de Aplicaciones y Gestión de Productos Digitales con IA",
      "url": "/diplomado-ia-negocios-marketing/",
      "aliases": [
        "diplomado-ia-negocios-marketing",
        "diplomado-desarrollo-aplicaciones-productos-digitales-ia"
      ],
      "type": "diplomado",
      "calendarTitle": "DIPLOMADO EN DESARROLLO DE APLICACIONES Y GESTIÓN DE PRODUCTOS DIGITALES CON INTELIGENCIA ARTIFICIAL",
      "description": "Construye, lanza y vende una App Web/PWA o MVP con IA.",
      "startTime": "19:00",
      "endTime": "21:00",
      "weekdays": [
        1,
        2,
        3,
        4
      ],
      "schedule": "Lun a Jue · Semanas 1, 2 y 5: 7:00 PM - 9:00 PM · Semanas 3 y 4: 5:00 PM - 7:00 PM (hora Ecuador)",
      "cohorts": [
        {
          "id": "appsDiploma-2026-09-21",
          "start": "2026-09-21",
          "end": "2026-10-22",
          "status": "confirmed"
        }
      ],
      "postponedCohorts": [
        {
          "id": "appsDiploma-2026-10-12",
          "start": "2026-10-12",
          "end": "2026-11-12",
          "status": "confirmed",
          "startTime": "19:00",
          "endTime": "21:00",
          "schedule": "Lun a Jue · Semanas 1, 2 y 5: 7:00 PM - 9:00 PM · Semanas 3 y 4: 5:00 PM - 7:00 PM (hora Ecuador)",
          "scheduleRegional": "Lun–Jue · Semanas 1, 2 y 5: 7:00 PM–9:00 PM EC/CO/PE · 6:00 PM–8:00 PM MX · Semanas 3 y 4: 5:00 PM–7:00 PM EC/CO/PE · 4:00 PM–6:00 PM MX",
          "scheduleEC": "Semanas 1, 2 y 5: 7:00 PM a 9:00 PM · Semanas 3 y 4: 5:00 PM a 7:00 PM (Ecuador/Colombia/Perú)",
          "scheduleMX": "Semanas 1, 2 y 5: 6:00 PM a 8:00 PM · Semanas 3 y 4: 4:00 PM a 6:00 PM (México)",
          "modules": [
            {
              "start": "2026-10-12",
              "end": "2026-10-15",
              "startTime": "19:00",
              "endTime": "21:00",
              "schedule": "Lun a Jue · 7:00 PM - 9:00 PM EC/CO/PE · 6:00 PM - 8:00 PM MX"
            },
            {
              "start": "2026-10-19",
              "end": "2026-10-22",
              "startTime": "19:00",
              "endTime": "21:00",
              "schedule": "Lun a Jue · 7:00 PM - 9:00 PM EC/CO/PE · 6:00 PM - 8:00 PM MX"
            },
            {
              "start": "2026-10-26",
              "end": "2026-10-29",
              "startTime": "17:00",
              "endTime": "19:00",
              "schedule": "Lun a Jue · 5:00 PM - 7:00 PM EC/CO/PE · 4:00 PM - 6:00 PM MX"
            },
            {
              "start": "2026-11-02",
              "end": "2026-11-05",
              "startTime": "17:00",
              "endTime": "19:00",
              "schedule": "Lun a Jue · 5:00 PM - 7:00 PM EC/CO/PE · 4:00 PM - 6:00 PM MX"
            },
            {
              "start": "2026-11-09",
              "end": "2026-11-12",
              "startTime": "19:00",
              "endTime": "21:00",
              "schedule": "Lun a Jue · 7:00 PM - 9:00 PM EC/CO/PE · 6:00 PM - 8:00 PM MX"
            }
          ]
        }
      ],
      "moduleDescriptions": [
        "Módulo 1: Problema real, usuario, caso de uso, arquitectura agentic y alcance del MVP.",
        "Módulo 2: Codex, Antigravity, UX, estructura funcional y construcción asistida por agentes.",
        "Módulo 3: Pruebas, landing, demo, formularios, CRM y captación de leads.",
        "Módulo 4: Automatización, onboarding, soporte, agentes comerciales y operación.",
        "Módulo 5: Monetización, pricing, propuesta comercial, métricas, pitch y Demo Day."
      ],
      "registrationDaysBefore": 28,
      "scheduleRegional": "Lun–Jue · Semanas 1, 2 y 5: 7:00 PM–9:00 PM EC/CO/PE · 6:00 PM–8:00 PM MX · Semanas 3 y 4: 5:00 PM–7:00 PM EC/CO/PE · 4:00 PM–6:00 PM MX",
      "scheduleEC": "Semanas 1, 2 y 5: 7:00 PM a 9:00 PM · Semanas 3 y 4: 5:00 PM a 7:00 PM (Ecuador/Colombia/Perú)",
      "scheduleMX": "Semanas 1, 2 y 5: 6:00 PM a 8:00 PM · Semanas 3 y 4: 4:00 PM a 6:00 PM (México)"
    },
    "master": {
      "name": "Máster Ejecutivo en IA Aplicada y Dirección de Productos Digitales",
      "url": "/master-ejecutivo-ia/",
      "aliases": [
        "master-ejecutivo-ia",
        "master-ejecutivo-inteligencia-artificial",
        "master-ejecutivo-inteligencia-artificial-direccion-productos-digitales"
      ],
      "type": "master",
      "calendarTitle": "MÁSTER EJECUTIVO EN INTELIGENCIA ARTIFICIAL APLICADA Y DIRECCIÓN DE PRODUCTOS DIGITALES",
      "description": "Programa executive de 6 meses para construir, vender y escalar Apps, PWAs, automatizaciones y negocios digitales con IA.",
      "startTime": "21:00",
      "endTime": "22:00",
      "weekdays": [
        1,
        2,
        3,
        4,
        5
      ],
      "schedule": "Lun a Vie, 9:00 PM - 10:00 PM",
      "cohorts": [
        {
          "id": "master-2026-10-19",
          "start": "2026-10-19",
          "end": "2027-04-30",
          "status": "confirmed"
        }
      ],
      "registrationDaysBefore": 28
    },
    "managers": {
      "name": "Certificación en IA para Administradores y Gerentes",
      "url": "/ia-para-gerencia-y-administracion/",
      "aliases": [
        "ia-para-gerencia-y-administracion",
        "certificado-inteligencia-artificial-analitica-automatizacion-gestion-gerencial"
      ],
      "type": "curso",
      "calendarTitle": "CERTIFICACIÓN EN IA PARA ADMINISTRADORES Y GERENTES",
      "description": "Analítica, indicadores, finanzas, agentes y automatización para decisiones, procesos y control gerencial.",
      "startTime": "19:00",
      "endTime": "21:00",
      "weekdays": [
        1,
        2,
        3,
        4
      ],
      "schedule": "Lun a Jue, 7:00 PM - 9:00 PM",
      "cohorts": [
        {
          "id": "managers-2026-11-30",
          "start": "2026-11-30",
          "end": "2026-12-03",
          "status": "cancelled"
        }
      ],
      "registrationDaysBefore": 14
    },
    "marketingDiploma": {
      "name": "Diplomado en Marketing Digital con Inteligencia Artificial y Agentes",
      "url": "/diplomado-marketing-digital-ia-agentes/",
      "aliases": [
        "diplomado-marketing-digital-ia-agentes",
        "diplomado-marketing-digital-inteligencia-artificial-agentes"
      ],
      "type": "diplomado",
      "calendarTitle": "DIPLOMADO EN MARKETING DIGITAL CON INTELIGENCIA ARTIFICIAL Y AGENTES",
      "description": "Sistema integral de marketing digital con inteligencia artificial y agentes.",
      "startTime": "19:00",
      "endTime": "21:00",
      "weekdays": [
        1,
        2,
        3,
        4
      ],
      "schedule": "Lun a Jue, 7:00 PM - 9:00 PM",
      "cohorts": [],
      "registrationDaysBefore": 28
    }
  },
  "coursePublicRollover": "startDay"
};
