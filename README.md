<p align="center">
  <img src="./docs/assets/image.png" alt="PresenceLink Banner" width="800">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge" alt="Build Status">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/version-v1.0.0-orange?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/Stack-React_19_|_Node_22-61dafb?style=for-the-badge" alt="Stack">
  <img src="https://img.shields.io/badge/White--Label-Ready-purple?style=for-the-badge" alt="White-Label Ready">
</p>

----

# 🔗 PresenceLink: The Enterprise Presence Engine

**PresenceLink** es la infraestructura definitiva para la gestión de presencia en equipos híbridos y distribuidos. En un mundo donde la oficina ya no es el único punto de encuentro, la visibilidad se convierte en el mayor desafío operativo. PresenceLink resuelve este caos mediante una plataforma **B2B White-Label** de alto rendimiento que centraliza la ubicación de cada talento, automatiza la comunicación interna y se integra en el flujo de trabajo existente.

### 🚩 El Problema: El Abismo de la Visibilidad Híbrida
Las empresas modernas pierden miles de horas al año en una pregunta constante: *"¿Quién está en la oficina mañana?"*. Los mensajes de Slack se pierden, los calendarios de Outlook son tediosos de actualizar y la falta de datos impide una optimización real del espacio de trabajo (Real Estate Optimization).

### 💡 La Solución: Sincronización Invisible
PresenceLink no es solo un calendario; es un **Motor de Inteligencia de Ubicación**. Permite a los empleados declarar su estado en segundos mediante algoritmos de autocompletado, mientras el backend sincroniza esa realidad con Microsoft Teams, WhatsApp y calendarios personales en tiempo real. 

---

## 📑 Índice Interactivo

1.  [🏗️ Arquitectura y Stack Tecnológico (Deep Dive)](#️-arquitectura-y-stack-tecnológico-deep-dive)
2.  [🚀 Catálogo Exhaustivo de Funcionalidades](#-catálogo-exhaustivo-de-funcionalidades)
    *   [Experiencia del Usuario](#experiencia-del-usuario)
    *   [Capacidades Administrativas](#capacidades-administrativas)
    *   [Motor de Notificaciones Inteligente](#motor-de-notificaciones-inteligente)
3.  [🎨 Guía de Marca Blanca (White-Labeling)](#-guía-de-marca-blanca-white-labeling)
4.  [⚙️ Instalación y Despliegue](#️-instalación-y-despliegue)
5.  [📊 Matriz de Variables de Entorno](#-matriz-de-variables-de-entorno)
6.  [🖥️ Troubleshooting & FAQ](#️-troubleshooting--faq)
7.  [📜 Licencia y Contribución](#-licencia-y-contribución)

---

## 🏗️ Arquitectura y Stack Tecnológico (Deep Dive)

PresenceLink ha sido diseñado bajo principios de **Alta Disponibilidad** y **Baja Latencia**. No es un simple CRUD; es un sistema distribuido que separa la lógica de interacción de la lógica de automatización.

```mermaid
graph TD
    subgraph "Frontend Layer (Client)"
        UI[React 19 + Vite]
        Store[Zustand State Engine]
    end

    subgraph "Backend Layer (Core)"
        API[Express API Node 22]
        Cron[Node-Cron Runner]
        ICal[iCal Generator]
        WA[WhatsApp Scraping Bot]
    end

    subgraph "Storage Layer"
        DB[(PostgreSQL)]
    end

    subgraph "External Integrations"
        Teams[MS Teams Webhooks]
        Outlook[Outlook/iCal Clients]
    end

    UI <--> Store
    Store <--> API
    API <--> DB
    Cron --> API
    Cron --> Teams
    Cron --> WA
    API --> ICal
    ICal --> Outlook
```

### ¿Por qué este Stack?
*   **React 19 + Vite:** Aprovechamos las últimas mejoras en el compilador de React y el renderizado concurrente para una interfaz que se siente instantánea.
*   **Node 22 (LTS):** Utilizado por su motor V8 optimizado y soporte nativo para las últimas especificaciones de ESM, garantizando un backend seguro y veloz.
*   **Zustand:** Elegido sobre Redux para evitar re-renderizados innecesarios. Su arquitectura atómica permite que los componentes del calendario se actualicen de forma independiente, algo vital al manejar meses con cientos de presencias.
*   **PostgreSQL:** El estándar de la industria para integridad de datos. Su robustez nos permite manejar relaciones complejas entre departamentos, usuarios y categorías dinámicas.
*   **Node-cron:** Motor de orquestación para el envío masivo de notificaciones diarias, permitiendo una personalización granular de los horarios por zona horaria.

---

## 🚀 Catálogo Exhaustivo de Funcionalidades

### Experiencia del Usuario
*   **Magic Fill🪄 (Autocompletado Predictivo):** El sistema aprende de las rutinas. Los usuarios pueden definir patrones semanales (ej. Lunes/Miércoles en oficina, Martes/Jueves en casa) y rellenar meses enteros con un solo clic. El algoritmo ignora automáticamente festivos y fines de semana no laborables.
*   **Sincronización iCal Real-Time:** Cada usuario dispone de un endpoint privado `.ics`. Esto permite que su presencia en PresenceLink aparezca como eventos en **Outlook, Google Calendar o Apple Calendar**, sin necesidad de intervención manual.
*   **Estados de Presencia (Confirmado vs. Predicho):** Los iconos en el calendario diferencian visualmente entre una presencia confirmada por el usuario y una presencia sugerida por el sistema basada en su configuración base.

### Capacidades Administrativas
*   **Gestión de Roles (RBAC):** Sistema de permisos multinivel:
    *   **User:** Gestiona su propia presencia y ve la de su equipo.
    *   **Admin:** Gestiona los usuarios y webhooks de su departamento.
    *   **SuperAdmin:** Control total sobre categorías, departamentos globales y configuraciones del sistema.
*   **Categorías Dinámicas:** Los administradores pueden crear "Ubicaciones" personalizadas (ej. "Cliente A", "Hub Creativo", "En Vuelo") con iconos y colores específicos que se reflejan en toda la plataforma.
*   **Gestión de Fines de Semana Laborables:** Permisos granulares para permitir que ciertos roles (ej. Soporte 24/7) puedan registrar presencia en días tradicionalmente no laborables.

### Motor de Notificaciones Inteligente
*   **Microsoft Teams Webhooks:** Generación automática de **Adaptive Cards** altamente visuales enviadas a canales específicos de departamento cada mañana. Muestra quién está en la oficina, quién trabaja remoto y quién está de baja.
*   **WhatsApp Scraping Engine:** A diferencia de las APIs oficiales restrictivas, PresenceLink utiliza un motor basado en `whatsapp-web.js` para automatizar notificaciones a través de la web, permitiendo a las empresas enviar resúmenes diarios directamente al móvil de los empleados sin costes adicionales por mensaje.

---

## 🎨 Guía de Marca Blanca (White-Labeling)

PresenceLink es **Brand-Agnostic**. Ha sido construido para que otras empresas lo adopten como su herramienta interna oficial en menos de 60 segundos.

> [!IMPORTANT]
> **No es necesario tocar código React.** Todo el rebranding se gestiona a través de la inyección de variables de entorno en el proceso de build.

### Pasos para el Rebranding Express:
1.  **Nombre de la App:** Cambia `VITE_APP_NAME` para renombrar toda la plataforma (Títulos, Pestañas del navegador, correos).
2.  **Identidad Visual:** Proporciona una URL en `VITE_APP_LOGO_URL`. El sistema inyectará tu logotipo en la barra de navegación y páginas de login automáticamente.
3.  **Color Corporativo:** Ajusta `VITE_APP_PRIMARY_COLOR` con tu Hexadecimal (ej. `#FF5733`). El sistema de Tailwind generará una paleta de sombras y estados de hover basada en tu color de marca.
4.  **Copyright Personalizado:** Modifica `VITE_APP_COMPANY_NAME` para que el pie de página y los términos legales reflejen tu entidad legal.

---

## ⚙️ Instalación y Despliegue

### 🐳 Opción A: Docker (Producción - El camino fácil)
Ideal para despliegues rápidos en AWS, Azure o DigitalOcean.

```bash
# 1. Clonar el repositorio profesional
git clone https://github.com/puyi27/CALENDAR.git && cd CALENDAR

# 2. Configurar el entorno
# Edita el archivo docker-compose.yml o crea archivos .env específicos

# 3. Lanzar la infraestructura
docker-compose up -d --build
```
*La plataforma estará disponible inmediatamente en `http://localhost:3000`.*

### 🛠️ Opción B: Manual (Desarrollo Local)
Para desarrolladores que necesiten extender la funcionalidad.

1.  **Instalar dependencias del monorepo:**
    ```bash
    npm install
    npm run install:all # Instala frontend y backend simultáneamente
    ```
2.  **Configurar Variables de Entorno:**
    Copia los archivos `.env.example` a `.env` en las carpetas `frontend` y `backend`.
3.  **Ejecutar en modo vigilancia:**
    ```bash
    # En terminales separadas o usando un runner:
    npm run dev --prefix backend
    npm run dev --prefix frontend
    ```

---

## 📊 Matriz de Variables de Entorno

### Frontend (`/frontend/.env`)
| Variable | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | String | Sí | Endpoint de la API REST | `https://api.tudominio.com/api` |
| `VITE_APP_NAME` | String | No | Nombre público de la aplicación | `PresenceLink` |
| `VITE_APP_LOGO_URL` | URL | No | Logotipo de marca (SVG/PNG) | `https://cdn.com/logo.svg` |
| `VITE_APP_PRIMARY_COLOR` | Hex | No | Color de acento del UI | `#4f46e5` |
| `VITE_APP_COMPANY_NAME` | String | No | Nombre para Copyright/Footer | `Acme Inc.` |

### Backend (`/backend/.env`)
| Variable | Tipo | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | URL | Sí | String de conexión PostgreSQL | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | String | Sí | Semilla para cifrado de sesiones | `super-secret-key-12345` |
| `PORT` | Int | No | Puerto de escucha del servidor | `4000` |
| `CRON_TIME` | Cron | No | Horario de envío de notificaciones | `0 9 * * 1-5` (9:00 AM) |
| `ENABLE_WHATSAPP_BOT` | Bool | No | Activa el motor de WhatsApp | `true` |

---

## 🖥️ Troubleshooting & FAQ

### 1. ❌ El código QR de WhatsApp no aparece
**Causa:** El backend no tiene permisos para lanzar el navegador Chromium o las dependencias de Linux faltan.
**Solución:** Si usas Docker, esto ya está incluido. En local, asegúrate de tener Chrome/Chromium instalado y que el usuario tenga permisos de ejecución.

### 2. ❌ Error de conexión a PostgreSQL (ECONNREFUSED)
**Causa:** El servicio de base de datos no ha arrancado o la URL en `.env` es incorrecta.
**Solución:** Verifica que el contenedor de la DB esté `UP` o que tu instancia de Neon/RDS permita conexiones desde la IP de tu servidor.

### 3. ❌ Los cambios en .env no se reflejan en el Frontend
**Causa:** Vite cachea las variables durante el build.
**Solución:** Detén el servidor de desarrollo, ejecuta `npm run build` o limpia la caché de Vite borrando la carpeta `node_modules/.vite`.

### 4. ❌ El iCal no se sincroniza en Outlook
**Causa:** El token de usuario es inválido o el firewall bloquea las peticiones externas al backend.
**Solución:** Genera un nuevo token desde el perfil del usuario y asegúrate de que el backend sea accesible públicamente.

### 5. ❌ Fallo en el envío de Webhooks de Teams
**Causa:** La URL del webhook ha expirado o el formato de la Adaptive Card ha sido rechazado.
**Solución:** Valida la URL en el panel de Admin de PresenceLink y pulsa el botón "Test Webhook".

---

## 📜 Licencia y Contribución

Este proyecto está bajo la licencia **MIT**. Si deseas contribuir, por favor abre un Pull Request detallando los cambios. Para reportar bugs de seguridad, contacta directamente con el equipo de arquitectura.

---

<p align="center">
  <b>PresenceLink — Eliminando la fricción del trabajo moderno.</b><br>
  Construido con ❤️ por <a href="https://github.com/puyi27">puyi27</a>
</p>
