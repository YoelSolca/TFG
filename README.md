<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/5f711415-4d5a-4e1d-983f-00f0702ab715" />
    <img width="100" height="100" alt="Logo del sistema" src="https://github.com/user-attachments/assets/5f711415-4d5a-4e1d-983f-00f0702ab715" />
  </picture>
</p>

<h1 align="center">Sistema de seguimiento psicopedagógico infantil</h1>

<p align="center">
  Aplicación web para acompañar la terapia psicopedagógica de niños con dificultades de aprendizaje.<br/>
  Permite organizar a los pacientes, planificar sesiones con ejercicios interactivos, registrar sus resultados y observaciones,<br/>
  y generar informes conceptuales del avance de cada paciente con inteligencia artificial (Claude, de Anthropic).
</p>

<p align="center">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt=".NET 10" src="https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white" />
  <img alt="SQL Server" src="https://img.shields.io/badge/SQL%20Server-CC2927?logo=microsoftsqlserver&logoColor=white" />
  <img alt="Claude" src="https://img.shields.io/badge/IA-Claude-D97757?logo=anthropic&logoColor=white" />
</p>


---

## Video demostrativo

▶️ **[Ver el recorrido por la aplicación](PEGAR_AQUI_EL_ENLACE_DEL_VIDEO)**

El video muestra las principales funcionalidades del sistema: registro y aprobación de cuentas, ingreso al sistema, gestión de pacientes, catálogo de ejercicios, planificación y realización de sesiones, seguimiento de la evolución y generación de informes con IA.

---

## Funcionalidades

### Psicopedagogo
- **Registro** con datos personales y matrícula profesional. La cuenta queda pendiente hasta que la aprueba el administrador.
- **Ingreso con verificación en dos pasos**: después del correo y la contraseña, se envía un código de 6 dígitos al correo registrado, que vence a los 5 minutos y se puede volver a pedir pasados 30 segundos.
- **Bloqueo temporal** de la cuenta durante 15 minutos después de 5 intentos fallidos.
- **Recuperación de contraseña** mediante un enlace enviado por correo, que vence a las 24 horas.
- **Página principal** con un resumen de pacientes activos, sesiones, ejercicios realizados e informes generados.
- **Pacientes**: alta, edición, objetivos de la intervención, tipos de dificultad, historial y evolución.
- **Sesiones**: planificación con ejercicios interactivos (atención, memoria, lectoescritura y cálculo), realización y registro de resultados y observaciones.
- **Informes con IA**: a partir de las sesiones y observaciones de un período, Claude genera un informe conceptual con avances, dificultades y áreas que requieren mayor atención.
- **Perfil**: datos personales, imagen y cambio de contraseña.

### Administrador
- Revisión de las **solicitudes de registro** (pendientes, aprobadas, rechazadas y suspendidas).
- **Aprobación, rechazo, suspensión y reactivación** de cuentas, con registro del motivo y del historial de cambios de estado.

---

## Tecnologías

| Capa | Tecnologías |
|---|---|
| Frontend | React 19, TypeScript, Vite, Material UI (MUI), Tailwind CSS, Axios |
| Backend | .NET 10 (C#), ASP.NET Core Web API, arquitectura limpia, Entity Framework Core |
| Base de datos | SQL Server |
| Seguridad | JWT, contraseñas con bcrypt, verificación en dos pasos por correo, bloqueo por intentos, HTTPS |
| Correo | SMTP con MailKit |
| Inteligencia artificial | Claude Sonnet 5.5 (API de Anthropic) |
| Gestión | Git |

---

## Estructura del repositorio

```
├── Backend/
│   ├── Backend.Api/              # Controladores, configuración, autenticación (punto de entrada)
│   ├── Backend.Application/      # Servicios, DTO, interfaces y casos de uso
│   ├── Backend.Domain/           # Entidades y reglas de negocio
│   └── Backend.Infrastructure/   # EF Core, repositorios, migraciones, correo, IA y seguridad
└── Frontend/
    └── src/
        ├── pages/                # Pantallas (auth, admin, pacientes, sesiones, juegos, informes…)
        ├── components/           # Componentes reutilizables
        ├── layout/               # Estructuras de página
        ├── actions/              # Llamadas a la API
        ├── Model/                # Tipos de datos
        └── utils/                # Funciones auxiliares
```

El backend sigue los principios de **arquitectura limpia**: el dominio no depende de ninguna otra capa, y la infraestructura (base de datos, correo, IA) se conecta mediante interfaces definidas en la capa de aplicación.

---

## Requisitos

- [.NET SDK 10](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js](https://nodejs.org/) 20.19 o superior (o 22.12 o superior)
- [SQL Server](https://www.microsoft.com/es-es/sql-server/sql-server-downloads) (Express, Developer o LocalDB)
- Herramienta de Entity Framework Core:
  ```bash
  dotnet tool install --global dotnet-ef
  ```
- Una clave de la [API de Anthropic](https://console.anthropic.com/) para generar los informes con IA
- Una cuenta de correo con acceso SMTP para enviar los códigos de verificación y los enlaces de recuperación (por ejemplo, Gmail con una [contraseña de aplicación](https://support.google.com/accounts/answer/185833))

---

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/YoelSolca/TFG.git
cd TFG
```

### 2. Configurar el backend

Crear el archivo `Backend/Backend.Api/appsettings.Local.json`. Este archivo **no se sube al repositorio** (está en el `.gitignore`) y es donde van las claves:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=PsicoDB;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
  },
  "Jwt": {
    "Key": "UNA_CLAVE_SECRETA_DE_AL_MENOS_32_CARACTERES"
  },
  "Anthropic": {
    "ApiKey": "TU_CLAVE_DE_ANTHROPIC"
  },
  "Email": {
    "Host": "smtp.gmail.com",
    "Port": 465,
    "UseSsl": true,
    "User": "tu_correo@gmail.com",
    "Password": "TU_CONTRASEÑA_DE_APLICACION",
    "FromAddress": "tu_correo@gmail.com",
    "FromName": "Soporte"
  }
}
```

> En `Server=` poné el nombre de tu instancia de SQL Server (por ejemplo `localhost\SQLEXPRESS` o `(localdb)\MSSQLLocalDB`).

### 3. Crear la base de datos

```bash
cd Backend
dotnet ef database update --project Backend.Infrastructure --startup-project Backend.Api
```

Las migraciones crean todas las tablas y cargan los catálogos (tipos de ejercicio, ejercicios, métricas y tipos de dificultad).

### 4. Ejecutar el backend

```bash
dotnet run --project Backend.Api --launch-profile https
```

La API queda disponible en `https://localhost:7053`, y su documentación (Swagger) en `https://localhost:7053/swagger`.

Al ejecutarse en modo desarrollo, se cargan automáticamente **datos de prueba**: un administrador, un psicopedagogo con tres pacientes, sesiones, resultados e informes.

### 5. Configurar y ejecutar el frontend

En otra terminal:

```bash
cd Frontend
npm install
```

Revisar el archivo `Frontend/.env` y dejarlo apuntando a la API local:

```
VITE_API_URL=https://localhost:7053
```

Ejecutar:

```bash
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

### 6. Usuarios de prueba (solo en desarrollo)

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@demo.com | Admin1234! |
| Psicopedagogo | psico@demo.com | Demo1234! |

> Si no se configura el servidor de correo, en desarrollo el código de verificación se muestra en la pantalla y en la consola del navegador, para poder probar el ingreso.


---

## Autor

**Yoel Cristian Carreras Solca**
Ingeniería en Software, Universidad Siglo 21
Trabajo Final de Grado, 2026
