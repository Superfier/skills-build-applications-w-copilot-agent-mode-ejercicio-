<div align="center">
  <img src="https://raw.githubusercontent.com/Superfier/octofit-tracker/main/octofit-tracker/frontend/public/logo192.png" width="120" alt="OctoFit Logo" />
  <h1>OctoFit Tracker</h1>
  <p>Tu viaje fitness comienza aquí. Registra actividades, compite en equipos y escala el leaderboard.</p>
</div>

---

## 🚀 Características

- Autenticación y perfiles de usuario
- Registro y seguimiento de actividades
- Creación y gestión de equipos
- Leaderboard competitivo
- Sugerencias personalizadas de entrenamientos

## 🛠️ Tecnologías
- Django + Django REST Framework
- Djongo + MongoDB
- React

## 📁 Estructura del proyecto

```
octofit-tracker/
├── backend/
│   ├── venv/
│   ├── octofit_tracker/
│   ├── api/
│   ├── requirements.txt
│   ├── manage.py
├── frontend/
│   ├── src/
│   ├── public/
│   ├── build/
│   ├── package.json
│   ├── README.md
```

## ⚡ Instalación rápida

### Backend
1. Crear entorno virtual:
   `python3 -m venv octofit-tracker/backend/venv`
2. Instalar dependencias:
   `source octofit-tracker/backend/venv/bin/activate && pip install -r octofit-tracker/backend/requirements.txt`
3. Migrar base de datos:
   `python octofit-tracker/backend/manage.py migrate`
4. Poblar base de datos:
   `python octofit-tracker/backend/manage.py populate_db`
5. Ejecutar backend:
   `python octofit-tracker/backend/manage.py runserver 0.0.0.0:8000`

### Frontend
1. Instalar dependencias:
   `cd octofit-tracker/frontend && npm install`
2. Ejecutar frontend:
   `npm start`

## 🧪 Pruebas
- Backend: `python octofit-tracker/backend/manage.py test`

## 🌐 Puertos
- Backend: 8000
- Frontend: 3000
- MongoDB: 27017

## 📄 Documentación
- [Backend](octofit-tracker/backend/README.md)
- [Frontend](octofit-tracker/frontend/README.md)

## 👤 Autor
- Superfier

---
