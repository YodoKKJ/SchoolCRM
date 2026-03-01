# 🎓 DomGestão — School Management System

A full-stack school management system built with **Java Spring Boot** and **React**, designed to digitalize academic operations. Covers students, teachers, classes, subjects, grades, attendance, schedules, and tardiness — all with role-based access control.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [User Roles](#-user-roles)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Deploy (Railway)](#-deploy-railway)
- [Database Setup](#-database-setup)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)

---

## ✨ Features

- **JWT authentication** with 7-day or 30-day tokens ("remember me")
- **User management** — create, edit, activate/deactivate directors, teachers, and students
- **Classes & grade levels** — manage series and classes with school year
- **Subjects** — register subjects and link them to teachers and classes
- **Assignments** — enroll students in classes and assign teachers to class+subject
- **Grades** — record grades per assessment (Exam, Assignment, Simulation) with weight and bonus support
- **Attendance** — track presence per lesson period with full history
- **Schedules** — build class timetables with bulk creation support
- **Tardiness** — register and query tardiness incidents per student
- **Report card PDF** — generate downloadable PDF report cards with averages and absences
- **Role-based dashboards** — separate interfaces for Director, Teacher, and Student

---

## 🛠 Tech Stack

### Backend
| Technology | Version |
|---|---|
| Java | 17 |
| Spring Boot | 3.2.5 |
| Spring Security | 6.2.4 |
| Spring Data JPA / Hibernate | 3.2.5 |
| PostgreSQL | — |
| JWT (jjwt) | 0.11.5 |
| BCrypt | via Spring Security |

### Frontend
| Technology | Description |
|---|---|
| React | 19.2.0 |
| React Router DOM | 7.13.0 |
| Vite | 7.3.1 |
| Tailwind CSS | 3.4.19 |
| Axios | 1.13.5 |
| Lucide React | 0.575.0 (icons) |
| html2canvas + jsPDF | Report card PDF generation |

---

## 👥 User Roles

| Role | Description |
|---|---|
| `DIRECAO` | Full access — manages users, classes, subjects, assignments, schedules, and tardiness |
| `PROFESSOR` | Records grades and attendance, views schedule and students for assigned classes |
| `ALUNO` | Views own grades, attendance, schedule, and downloads report card PDF |

---

## 🏗 Architecture

The backend follows a layered MVC architecture with stateless JWT security:

```
src/
├── controller/     # REST endpoints
├── entity/         # JPA entities
├── repository/     # Spring Data JPA interfaces
├── config/         # WebConfig (SPA routing fallback)
└── security/       # JwtFilter, JwtUtil, SecurityConfig
```

The frontend is a React SPA with role-based routing. The Vite build output is embedded into the Spring Boot JAR so everything is served from a single service.

---

## 🚀 Getting Started

### Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven

### 1. Clone the repository

```bash
git clone https://github.com/YodoKKJ/SchoolCRM.git
cd SchoolCRM
```

### 2. Configure the database

Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/postgres
spring.datasource.username=your_username
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update

jwt.secret=your-secret-key-here
cors.allowed-origins=http://localhost:5173
```

### 3. Start the backend

```bash
./mvnw spring-boot:run
```

API available at `http://localhost:8080`.

### 4. Start the frontend

```bash
cd schoolcrm-front
npm install
npm run dev
```

App available at `http://localhost:5173`.

### 5. Default login

| Field | Value |
|---|---|
| Login | `admin` |
| Password | `123456` |
| Role | `DIRECAO` |

---

## 🐳 Deploy (Railway)

The project uses a multi-stage Docker build:

1. **Stage 1 (Node 20)** — builds the frontend with Vite (`VITE_API_URL=""` for same-origin requests)
2. **Stage 2 (Maven 3.9)** — copies the `dist/` output into `src/main/resources/static/` and packages the Spring Boot JAR
3. **Stage 3 (JRE 21 Alpine)** — minimal production image

### Required environment variables

| Variable | Example |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://host:5432/db` |
| `SPRING_DATASOURCE_USERNAME` | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | `password` |
| `CORS_ALLOWED_ORIGINS` | `https://myapp.up.railway.app` |
| `JWT_SECRET` | a secure 256-bit key |

```bash
docker build -t schoolcrm .
docker run -p 8080:8080 --env-file .env schoolcrm
```

---

## 🗄 Database Setup

Hibernate creates/updates tables automatically (`ddl-auto=update`). For manual setup:

```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id              BIGSERIAL PRIMARY KEY,
    nome            VARCHAR(255) NOT NULL,
    login           VARCHAR(255) NOT NULL UNIQUE,
    senha_hash      VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL,
    ativo           BOOLEAN      NOT NULL DEFAULT TRUE,
    data_nascimento DATE,
    nome_pai        VARCHAR(255),
    nome_mae        VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS series (
    id   BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS turmas (
    id         BIGSERIAL PRIMARY KEY,
    nome       VARCHAR(255) NOT NULL,
    serie_id   BIGINT REFERENCES series(id),
    ano_letivo INTEGER
);

CREATE TABLE IF NOT EXISTS materias (
    id   BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS aluno_turma (
    aluno_id BIGINT NOT NULL REFERENCES usuarios(id),
    turma_id BIGINT NOT NULL REFERENCES turmas(id),
    PRIMARY KEY (aluno_id, turma_id)
);

CREATE TABLE IF NOT EXISTS professor_turma_materia (
    professor_id BIGINT NOT NULL REFERENCES usuarios(id),
    turma_id     BIGINT NOT NULL REFERENCES turmas(id),
    materia_id   BIGINT NOT NULL REFERENCES materias(id),
    PRIMARY KEY (professor_id, turma_id, materia_id)
);

CREATE TABLE IF NOT EXISTS avaliacoes (
    id             BIGSERIAL PRIMARY KEY,
    turma_id       BIGINT        REFERENCES turmas(id),
    materia_id     BIGINT        REFERENCES materias(id),
    tipo           VARCHAR(50)   NOT NULL,  -- PROVA, TRABALHO, SIMULADO
    descricao      VARCHAR(255),
    data_aplicacao DATE,
    peso           NUMERIC(5,2)  DEFAULT 1.0,
    bonificacao    BOOLEAN       DEFAULT FALSE,
    bimestre       INTEGER
);

CREATE TABLE IF NOT EXISTS notas (
    id           BIGSERIAL PRIMARY KEY,
    avaliacao_id BIGINT       NOT NULL REFERENCES avaliacoes(id),
    aluno_id     BIGINT       NOT NULL REFERENCES usuarios(id),
    valor        NUMERIC(5,2) NOT NULL,
    lancado_em   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS presencas (
    id             BIGSERIAL PRIMARY KEY,
    aluno_id       BIGINT  NOT NULL REFERENCES usuarios(id),
    turma_id       BIGINT  NOT NULL REFERENCES turmas(id),
    materia_id     BIGINT  NOT NULL REFERENCES materias(id),
    data           DATE    NOT NULL,
    presente       BOOLEAN NOT NULL,
    ordem_aula     INTEGER,
    horario_inicio VARCHAR(5)
);

CREATE TABLE IF NOT EXISTS horarios (
    id             BIGSERIAL PRIMARY KEY,
    turma_id       BIGINT     NOT NULL REFERENCES turmas(id),
    materia_id     BIGINT     NOT NULL REFERENCES materias(id),
    professor_id   BIGINT     REFERENCES usuarios(id),
    dia_semana     VARCHAR(3) NOT NULL,  -- SEG, TER, QUA, QUI, SEX
    horario_inicio VARCHAR(5) NOT NULL,  -- HH:mm
    ordem_aula     INTEGER
);

CREATE TABLE IF NOT EXISTS atrasos (
    id            BIGSERIAL PRIMARY KEY,
    aluno_id      BIGINT    NOT NULL REFERENCES usuarios(id),
    turma_id      BIGINT    REFERENCES turmas(id),
    registrado_em TIMESTAMP NOT NULL,
    observacao    VARCHAR(500)
);

-- Default admin user (password: 123456)
INSERT INTO usuarios (nome, login, senha_hash, role, ativo)
VALUES ('Administrador', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'DIRECAO', TRUE)
ON CONFLICT (login) DO NOTHING;
```

---

## 📡 API Reference

### Authentication — `/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login — returns JWT token |
| GET | `/auth/me` | Authenticated | Returns current user login and role |

### Users — `/usuarios`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/usuarios` | DIRECAO | Create user |
| GET | `/usuarios` | DIRECAO | List all users |
| GET | `/usuarios/buscar` | DIRECAO, PROFESSOR | Search by name/role |
| PUT | `/usuarios/{id}` | DIRECAO | Update user |
| DELETE | `/usuarios/{id}` | DIRECAO | Delete user (only if no active bindings) |
| PATCH | `/usuarios/{id}/status` | DIRECAO | Toggle active/inactive |
| GET | `/usuarios/com-vinculos` | DIRECAO | IDs of users with active assignments |

### Classes & Grade Levels — `/turmas`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/turmas` | DIRECAO | Create class |
| GET | `/turmas` | DIRECAO | List all classes |
| GET | `/turmas/buscar` | DIRECAO, PROFESSOR | Search by name/grade level |
| PUT | `/turmas/{id}` | DIRECAO | Update class |
| DELETE | `/turmas/{id}` | DIRECAO | Delete class (cascades) |
| POST | `/turmas/series` | DIRECAO | Create grade level |
| GET | `/turmas/series` | DIRECAO | List grade levels |
| DELETE | `/turmas/series/{id}` | DIRECAO | Delete grade level (only if empty) |

### Subjects — `/materias`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/materias` | DIRECAO | Create subject |
| GET | `/materias` | DIRECAO, PROFESSOR | List all subjects |
| GET | `/materias/buscar` | DIRECAO, PROFESSOR | Search by name |
| DELETE | `/materias/{id}` | DIRECAO | Delete subject |

### Assignments — `/vinculos`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/vinculos/aluno-turma` | DIRECAO | Enroll student in class |
| DELETE | `/vinculos/aluno-turma` | DIRECAO | Remove enrollment |
| GET | `/vinculos/aluno-turma` | DIRECAO | List all student-class bindings |
| GET | `/vinculos/aluno-turma/turma/{turmaId}` | DIRECAO, PROFESSOR | Students in a class |
| GET | `/vinculos/aluno-turma/minhas` | ALUNO, DIRECAO | Logged-in student's classes |
| GET | `/vinculos/aluno-turma/historico/{alunoId}` | DIRECAO | A student's full class history |
| GET | `/vinculos/aluno-turma/ocupados-no-ano/{year}` | DIRECAO | Students already enrolled in a given year |
| POST | `/vinculos/professor-turma-materia` | DIRECAO | Assign teacher to class+subject |
| DELETE | `/vinculos/professor-turma-materia` | DIRECAO | Remove teacher assignment |
| GET | `/vinculos/professor-turma-materia` | DIRECAO | List all teacher assignments |
| GET | `/vinculos/professor-turma-materia/turma/{turmaId}` | DIRECAO | Teachers in a class |
| GET | `/vinculos/professor-turma-materia/minhas` | PROFESSOR, DIRECAO | Logged-in teacher's class+subject assignments |

### Grades — `/notas`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/notas/avaliacao` | PROFESSOR, DIRECAO | Create assessment |
| DELETE | `/notas/avaliacao/{id}` | PROFESSOR, DIRECAO | Delete assessment and its grades |
| POST | `/notas/lancar` | PROFESSOR, DIRECAO | Record a student's grade |
| GET | `/notas/avaliacoes` | PROFESSOR, DIRECAO | Assessments + grades for a class/subject |
| GET | `/notas/media/{alunoId}/{turmaId}/{materiaId}` | All | Calculated average for a student |
| GET | `/notas/boletim/{alunoId}/{turmaId}` | PROFESSOR, DIRECAO | Full report card (all subjects) |
| GET | `/notas/minhas` | ALUNO | Logged-in student's own grades |

**Assessment types:**
- `PROVA` / `TRABALHO` — grade 0–10, configurable weight
- `SIMULADO` — bonus 0–1 added to the final average (capped at 10)

### Attendance — `/presencas`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/presencas/lancar` | PROFESSOR, DIRECAO | Record attendance |
| GET | `/presencas/{alunoId}/{turmaId}/{materiaId}` | All | Attendance summary for a student |
| GET | `/presencas/turma/{turmaId}/materia/{materiaId}` | PROFESSOR, DIRECAO | Roll call grouped by date |
| GET | `/presencas/minhas/{turmaId}/{materiaId}` | ALUNO | Logged-in student's own attendance |

### Schedules — `/horarios`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/horarios` | DIRECAO | Create single schedule entry |
| POST | `/horarios/lote` | DIRECAO | Bulk-create a full class timetable |
| GET | `/horarios/minhas` | All | Schedule filtered by the logged-in user's role |
| GET | `/horarios` | All | List all schedules |
| GET | `/horarios/turma/{turmaId}` | All | Schedule for a class |
| GET | `/horarios/turma/{turmaId}/dia/{day}` | DIRECAO, PROFESSOR | Schedule for a class on a specific day |
| DELETE | `/horarios/{id}` | DIRECAO | Delete single entry |
| DELETE | `/horarios/turma/{turmaId}` | DIRECAO | Delete entire class schedule |

**Valid days:** `SEG`, `TER`, `QUA`, `QUI`, `SEX`

### Tardiness — `/atrasos`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/atrasos` | DIRECAO | Register tardiness incident |
| GET | `/atrasos/hoje` | DIRECAO | Today's tardiness records |
| GET | `/atrasos/historico` | DIRECAO | Full history (optional date filter) |
| GET | `/atrasos/aluno/{alunoId}` | DIRECAO | History for a specific student |
| DELETE | `/atrasos/{id}` | DIRECAO | Delete tardiness record |

---

## 📁 Project Structure

```
SchoolCRM/
├── Dockerfile                         # Multi-stage build (Node → Maven → JRE)
├── pom.xml
├── src/main/
│   ├── java/com/dom/schoolcrm/
│   │   ├── config/
│   │   │   └── WebConfig.java         # Forwards unknown routes to React
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── AtrasoController.java
│   │   │   ├── HorarioController.java
│   │   │   ├── MateriaController.java
│   │   │   ├── NotaController.java
│   │   │   ├── PresencaController.java
│   │   │   ├── TurmaController.java
│   │   │   ├── UsuarioController.java
│   │   │   └── VinculoController.java
│   │   ├── entity/
│   │   │   ├── AlunoTurma.java
│   │   │   ├── Atraso.java
│   │   │   ├── Avaliacao.java
│   │   │   ├── Horario.java
│   │   │   ├── Materia.java
│   │   │   ├── Nota.java
│   │   │   ├── Presenca.java
│   │   │   ├── ProfessorTurmaMateria.java
│   │   │   ├── Serie.java
│   │   │   ├── Turma.java
│   │   │   └── Usuario.java
│   │   ├── repository/                # Spring Data JPA interfaces
│   │   └── security/
│   │       ├── JwtFilter.java
│   │       ├── JwtUtil.java
│   │       └── SecurityConfig.java
│   └── resources/
│       ├── application.properties           # Base config (local dev)
│       ├── application-dev.properties
│       └── application-prod.properties      # Railway config (env vars)
└── schoolcrm-front/
    ├── package.json
    └── src/
        ├── App.jsx                    # Role-based routing
        ├── main.jsx
        └── pages/
            ├── Login.jsx              # Login screen
            ├── DirecaoDashboard.jsx   # Director full dashboard
            ├── ProfessorDashboard.jsx # Teacher dashboard
            ├── AlunoDashboard.jsx     # Student portal
            └── BoletimPDF.jsx         # PDF report card generator
```

---

## 📝 License

Built as a real-world school management system. Free to use and adapt.
