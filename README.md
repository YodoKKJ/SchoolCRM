# 🎓 DomGestão — School Management System

A full-stack School Management System built with **Java Spring Boot** and **React**, designed to digitalize academic management for schools. It handles students, teachers, classes, subjects, grades, and attendance — all with role-based access control.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Database Setup](#database-setup)
- [API Overview](#api-overview)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)

---

## ✨ Features

- **Role-based authentication** using JWT (Student, Teacher, Administrator)
- **Class & subject management** — create series, classes, and subjects
- **Grade management** — launch grades per assessment, automatic average calculation with bonus support
- **Attendance tracking** — track presence per student, class, and subject
- **Teacher & student assignment** — link teachers to classes/subjects and students to classes
- **Responsive dashboard** for the Administration role

---

## 🛠 Tech Stack

### Backend
| Technology | Version |
|---|---|
| Java | 17 |
| Spring Boot | 3.2.5 |
| Spring Security | 6.2.4 |
| Spring Data JPA | 3.2.5 |
| Hibernate | 6.4.4 |
| PostgreSQL | - |
| JWT (jjwt) | 0.11.5 |

### Frontend
| Technology | Description |
|---|---|
| React + Vite | UI framework |
| Tailwind CSS | Styling |
| Axios | HTTP client |
| Lucide React | Icons |

---

## 🏗 Architecture

The backend follows a layered MVC architecture:

```
src/
├── controller/     # REST endpoints
├── entity/         # JPA entities (database models)
├── repository/     # Spring Data JPA interfaces
└── security/       # JWT filter, utility, and security config
```

The frontend is a single-page React application with role-based routing.

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
```

### 3. Run the database setup script

Execute the SQL script below in your PostgreSQL client to create all tables:

```bash
psql -U postgres -d postgres -f schema.sql
```

> See [Database Setup](#database-setup) for the full script.

### 4. Start the backend

```bash
./mvnw spring-boot:run
```

The API will be available at `http://localhost:8080`.

### 5. Start the frontend

```bash
cd schoolcrm-front
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### 6. Default login

| Field | Value |
|---|---|
| Login | `admin` |
| Password | `123456` |
| Role | `DIRECAO` (Administrator) |

---

## 🗄 Database Setup

Run this script on your PostgreSQL database to create all required tables:

```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id         BIGSERIAL PRIMARY KEY,
    nome       VARCHAR(255) NOT NULL,
    login      VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL,
    ativo      BOOLEAN      NOT NULL DEFAULT TRUE
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
    tipo           VARCHAR(50)   NOT NULL,
    descricao      VARCHAR(255),
    data_aplicacao DATE,
    peso           NUMERIC(5, 2) DEFAULT 1.0,
    bonificacao    BOOLEAN       DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS notas (
    id           BIGSERIAL PRIMARY KEY,
    avaliacao_id BIGINT        NOT NULL REFERENCES avaliacoes(id),
    aluno_id     BIGINT        NOT NULL REFERENCES usuarios(id),
    valor        NUMERIC(5, 2) NOT NULL,
    lancado_em   TIMESTAMP
);

CREATE TABLE IF NOT EXISTS presencas (
    id         BIGSERIAL PRIMARY KEY,
    aluno_id   BIGINT  NOT NULL REFERENCES usuarios(id),
    turma_id   BIGINT  NOT NULL REFERENCES turmas(id),
    materia_id BIGINT  NOT NULL REFERENCES materias(id),
    data       DATE    NOT NULL,
    presente   BOOLEAN NOT NULL
);

-- Default admin user (password: 123456)
INSERT INTO usuarios (nome, login, senha_hash, role, ativo)
VALUES ('Administrador', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 'DIRECAO', TRUE)
ON CONFLICT (login) DO NOTHING;
```

---

## 📡 API Overview

### Authentication
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/login` | Login and get JWT token | Public |
| GET | `/auth/me` | Get current user info | Authenticated |

### Users
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/usuarios` | Create a new user | DIRECAO |
| GET | `/usuarios` | List all users | DIRECAO |

### Classes & Series
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/turmas/series` | Create a series | DIRECAO |
| GET | `/turmas/series` | List all series | DIRECAO |
| DELETE | `/turmas/series/{id}` | Delete a series | DIRECAO |
| POST | `/turmas` | Create a class | DIRECAO |
| GET | `/turmas` | List all classes | DIRECAO |
| DELETE | `/turmas/{id}` | Delete a class | DIRECAO |

### Subjects
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/materias` | Create a subject | DIRECAO |
| GET | `/materias` | List all subjects | DIRECAO, PROFESSOR |
| DELETE | `/materias/{id}` | Delete a subject | DIRECAO |

### Assignments (Vínculos)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/vinculos/aluno-turma` | Assign student to class | DIRECAO |
| DELETE | `/vinculos/aluno-turma` | Remove student from class | DIRECAO |
| POST | `/vinculos/professor-turma-materia` | Assign teacher to class/subject | DIRECAO |
| DELETE | `/vinculos/professor-turma-materia` | Remove teacher assignment | DIRECAO |

### Grades
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/notas/avaliacao` | Create an assessment | PROFESSOR, DIRECAO |
| POST | `/notas/lancar` | Submit a grade | PROFESSOR, DIRECAO |
| GET | `/notas/media/{alunoId}/{turmaId}/{materiaId}` | Calculate student average | All roles |
| GET | `/notas/minhas` | Get own grades | ALUNO |

### Attendance
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/presencas/lancar` | Record attendance | PROFESSOR, DIRECAO |
| GET | `/presencas/{alunoId}/{turmaId}/{materiaId}` | Get attendance report | All roles |
| GET | `/presencas/minhas/{turmaId}/{materiaId}` | Get own attendance | ALUNO |

---

## 👥 User Roles

| Role | Portuguese | Description |
|---|---|---|
| `DIRECAO` | Direção | Full access — manages users, classes, subjects, and assignments |
| `PROFESSOR` | Professor | Can submit grades and attendance for their classes |
| `ALUNO` | Aluno | Read-only access to own grades and attendance |

---

## 📁 Project Structure

```
SchoolCRM/
├── src/
│   └── main/
│       ├── java/com/dom/schoolcrm/
│       │   ├── controller/
│       │   │   ├── AuthController.java
│       │   │   ├── MateriaController.java
│       │   │   ├── NotaController.java
│       │   │   ├── PresencaController.java
│       │   │   ├── TurmaController.java
│       │   │   ├── UsuarioController.java
│       │   │   └── VinculoController.java
│       │   ├── entity/
│       │   │   ├── AlunoTurma.java
│       │   │   ├── Avaliacao.java
│       │   │   ├── Materia.java
│       │   │   ├── Nota.java
│       │   │   ├── Presenca.java
│       │   │   ├── ProfessorTurmaMateria.java
│       │   │   ├── Serie.java
│       │   │   ├── Turma.java
│       │   │   └── Usuario.java
│       │   ├── repository/
│       │   └── security/
│       │       ├── JwtFilter.java
│       │       ├── JwtUtil.java
│       │       └── SecurityConfig.java
│       └── resources/
│           └── application.properties
└── schoolcrm-front/
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   └── DirecaoDashboard.jsx
        └── App.jsx
```

---

## 📝 License

This project was built as a real-world learning experience for school academic management. Feel free to use and adapt it.
