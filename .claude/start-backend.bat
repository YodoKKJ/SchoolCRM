@echo off
set JAVA_HOME=C:\Users\Admin\.jdks\corretto-25.0.2
cd /d "%~dp0.."
call mvnw.cmd spring-boot:run
