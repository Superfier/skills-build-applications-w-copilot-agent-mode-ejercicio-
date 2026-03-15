# OctoFit Tracker Backend

Backend desarrollado en Django + Django REST Framework + Djongo (MongoDB).

## Funcionalidades
- Autenticación de usuarios
- Registro y seguimiento de actividades
- Gestión de equipos
- Leaderboard competitivo
- Sugerencias de entrenamientos

## Instalación
1. Crear entorno virtual:
   `python3 -m venv venv`
2. Instalar dependencias:
   `source venv/bin/activate && pip install -r requirements.txt`
3. Migrar base de datos:
   `python manage.py migrate`
4. Poblar base de datos:
   `python manage.py populate_db`
5. Ejecutar backend:
   `python manage.py runserver 0.0.0.0:8000`

## Pruebas
`python manage.py test`

## Estructura
```
backend/
├── venv/
├── octofit_tracker/
├── api/
├── requirements.txt
├── manage.py
```

## Documentación API
- Endpoints en `/api/`
- Autenticación por token

---
