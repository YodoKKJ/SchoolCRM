# ── Stage 1: build do frontend (React/Vite) ─────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app
COPY schoolcrm-front/package*.json ./
RUN npm ci
COPY schoolcrm-front/ ./
# VITE_API_URL vazio = mesmo origin (frontend e backend na mesma URL do Railway)
RUN VITE_API_URL="" npm run build

# ── Stage 2: build do backend (Spring Boot) ──────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS backend
ARG CACHEBUST=20260307b
RUN echo "cache bust: $CACHEBUST"
WORKDIR /app
COPY pom.xml ./
COPY src ./src
# Copia o build do frontend para dentro dos recursos estáticos do Spring Boot
COPY --from=frontend /app/dist ./src/main/resources/static
RUN mvn package -DskipTests -q

# ── Stage 3: imagem final (só JRE, imagem menor) ─────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=backend /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
