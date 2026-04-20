# MediKit - Smart Hospital Management & Appointment Platform

A centralized platform connecting hospitals, doctors, and patients with role-based access control.

## 🏥 Features

- **Multi-Hospital Support**: Manage multiple hospitals from a single platform
- **Role-Based Access**: Super Admin, Hospital Admin, Doctor, Patient
- **Appointment Booking**: Search hospitals/doctors, book appointments
- **Location Services**: Find nearby hospitals using maps
- **Medical Records**: Secure patient health records
- **Online Payments**: Integrated payment system (eSewa/Khalti ready)
- **Chat/Consultation**: Patient-doctor messaging

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Django 5.0, Django REST Framework
- **Database**: MySQL 8.0
- **Auth**: JWT (SimpleJWT)
- **Maps**: Leaflet + OpenStreetMap

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

### Using Docker (Recommended)

```bash
# Clone and navigate
cd medikit

# Copy environment variables
cp .env.example .env

# Start all services
docker-compose up --build

# Access:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:8000/api/v1/
# - Admin: http://localhost:8000/admin/
```

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superadmin
python manage.py createsuperuser

# Start server
python manage.py runserver
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
medikit/
├── backend/                    # Django + DRF
│   ├── medikit/               # Project settings
│   ├── apps/
│   │   ├── accounts/          # User, Auth, RBAC
│   │   ├── hospitals/         # Hospital, Department, Disease
│   │   ├── doctors/           # DoctorProfile, Availability
│   │   ├── patients/          # PatientProfile
│   │   ├── appointments/      # Booking system
│   │   ├── records/           # Medical records
│   │   ├── payments/          # Billing
│   │   └── chat/              # Messaging
│   └── manage.py
├── frontend/                   # Next.js
│   ├── app/                   # Pages (App Router)
│   ├── components/            # UI components
│   ├── lib/                   # Utilities
│   └── types/                 # TypeScript types
└── docker-compose.yml
```

## 🔐 Default Credentials (Development)

- **Super Admin**: Created via `createsuperuser` command
- **MySQL**: root / medikit_password

## 📝 API Documentation

API docs available at: `http://localhost:8000/api/v1/docs/`

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| Super Admin | Full platform access, register hospitals |
| Hospital Admin | Manage own hospital, doctors, appointments |
| Doctor | View schedule, manage appointments, add records |
| Patient | Book appointments, view records, make payments |

## 📄 License

This project is for educational purposes.
# MEDIKIT
# MEDIKIT
