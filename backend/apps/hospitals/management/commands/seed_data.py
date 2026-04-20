"""
Management command to seed the database with test data.
Run with: python manage.py seed_data
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.hospitals.models import Hospital, Department, Specialization, Disease
from apps.doctors.models import DoctorProfile, AvailabilitySlot
from apps.accounts.models import UserRole
from decimal import Decimal


User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with test data for MediKit'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding database with test data...\n')
        
        # Create specializations
        self.stdout.write('Creating specializations...')
        specializations = self.create_specializations()
        
        # Create diseases
        self.stdout.write('Creating diseases...')
        diseases = self.create_diseases(specializations)
        
        # Create hospitals
        self.stdout.write('Creating hospitals...')
        hospitals = self.create_hospitals(diseases)
        
        # Create departments
        self.stdout.write('Creating departments...')
        departments = self.create_departments(hospitals, specializations)
        
        # Create doctors
        self.stdout.write('Creating doctors...')
        self.create_doctors(hospitals, departments, specializations, diseases)
        
        # Create a test patient
        self.stdout.write('Creating test patient...')
        self.create_test_patient()
        
        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write('\nTest accounts created:')
        self.stdout.write('  📧 Patient: patient@test.com / password123')
        self.stdout.write('  📧 Doctor: doctor1@test.com / password123')
        self.stdout.write('  📧 Super Admin: admin@medikit.com / password123\n')

    def create_specializations(self):
        specializations_data = [
            {'name': 'Cardiology', 'slug': 'cardiology', 'description': 'Heart and cardiovascular system', 'icon': 'heart'},
            {'name': 'Neurology', 'slug': 'neurology', 'description': 'Brain and nervous system', 'icon': 'brain'},
            {'name': 'Orthopedics', 'slug': 'orthopedics', 'description': 'Bones, joints, and muscles', 'icon': 'bone'},
            {'name': 'Dermatology', 'slug': 'dermatology', 'description': 'Skin conditions', 'icon': 'skin'},
            {'name': 'Pediatrics', 'slug': 'pediatrics', 'description': 'Children\'s health', 'icon': 'child'},
            {'name': 'Ophthalmology', 'slug': 'ophthalmology', 'description': 'Eye care', 'icon': 'eye'},
            {'name': 'ENT', 'slug': 'ent', 'description': 'Ear, Nose, and Throat', 'icon': 'ear'},
            {'name': 'General Medicine', 'slug': 'general-medicine', 'description': 'General health conditions', 'icon': 'stethoscope'},
            {'name': 'Gastroenterology', 'slug': 'gastroenterology', 'description': 'Digestive system', 'icon': 'stomach'},
            {'name': 'Endocrinology', 'slug': 'endocrinology', 'description': 'Hormones and metabolic disorders', 'icon': 'gland'},
        ]
        
        specializations = {}
        for data in specializations_data:
            spec, created = Specialization.objects.get_or_create(
                slug=data['slug'],
                defaults=data
            )
            specializations[spec.slug] = spec
            if created:
                self.stdout.write(f'  ✓ Created specialization: {spec.name}')
        
        return specializations

    def create_diseases(self, specializations):
        diseases_data = [
            {
                'name': 'Type 2 Diabetes Mellitus',
                'slug': 'diabetes',
                'description': 'A metabolic disease causing high blood sugar due to insulin resistance',
                'symptoms': ['frequent urination', 'increased thirst', 'fatigue', 'blurred vision', 'slow wound healing'],
                'specializations': ['endocrinology', 'general-medicine']
            },
            {
                'name': 'Hypertension (High Blood Pressure)',
                'slug': 'hypertension',
                'description': 'A chronic condition where blood pressure is persistently elevated',
                'symptoms': ['headache', 'shortness of breath', 'nosebleeds', 'dizziness', 'chest pain'],
                'specializations': ['cardiology', 'general-medicine']
            },
            {
                'name': 'Coronary Heart Disease',
                'slug': 'heart-disease',
                'description': 'Narrowing of coronary arteries that supply blood to the heart muscle',
                'symptoms': ['chest pain', 'shortness of breath', 'fatigue', 'irregular heartbeat', 'heart palpitations'],
                'specializations': ['cardiology']
            },
            {
                'name': 'Chronic Migraine',
                'slug': 'migraine',
                'description': 'Recurring severe headaches often accompanied by nausea and light sensitivity',
                'symptoms': ['severe headache', 'nausea', 'sensitivity to light', 'visual disturbances', 'vomiting'],
                'specializations': ['neurology']
            },
            {
                'name': 'Rheumatoid Arthritis',
                'slug': 'arthritis',
                'description': 'An autoimmune disease causing chronic inflammation of joints',
                'symptoms': ['joint pain', 'stiffness', 'swelling', 'reduced range of motion', 'fatigue'],
                'specializations': ['orthopedics']
            },
            {
                'name': 'Bronchial Asthma',
                'slug': 'asthma',
                'description': 'A chronic respiratory condition causing airway inflammation',
                'symptoms': ['wheezing', 'coughing', 'shortness of breath', 'chest tightness', 'difficulty breathing'],
                'specializations': ['general-medicine']
            },
            {
                'name': 'Atopic Dermatitis (Eczema)',
                'slug': 'eczema',
                'description': 'A chronic skin condition causing inflammation and itching',
                'symptoms': ['itchy skin', 'red patches', 'dry skin', 'rash', 'skin thickening'],
                'specializations': ['dermatology']
            },
            {
                'name': 'Age-Related Cataracts',
                'slug': 'cataracts',
                'description': 'Clouding of the natural lens of the eye causing vision impairment',
                'symptoms': ['blurred vision', 'faded colors', 'sensitivity to light', 'double vision', 'poor night vision'],
                'specializations': ['ophthalmology']
            },
            {
                'name': 'Chronic Gastritis',
                'slug': 'gastritis',
                'description': 'Long-term inflammation of the stomach lining',
                'symptoms': ['stomach pain', 'nausea', 'bloating', 'loss of appetite', 'indigestion'],
                'specializations': ['gastroenterology']
            },
            {
                'name': 'Upper Respiratory Tract Infection',
                'slug': 'common-cold',
                'description': 'Viral infection affecting the nose, throat, and sinuses',
                'symptoms': ['runny nose', 'sore throat', 'cough', 'congestion', 'sneezing'],
                'specializations': ['general-medicine', 'ent']
            },
            {
                'name': 'Dengue Fever',
                'slug': 'dengue',
                'description': 'Mosquito-borne viral infection causing high fever',
                'symptoms': ['high fever', 'severe headache', 'muscle pain', 'joint pain', 'skin rash'],
                'specializations': ['general-medicine']
            },
            {
                'name': 'Typhoid Fever',
                'slug': 'typhoid',
                'description': 'Bacterial infection caused by Salmonella typhi',
                'symptoms': ['high fever', 'weakness', 'stomach pain', 'headache', 'loss of appetite'],
                'specializations': ['general-medicine', 'gastroenterology']
            },
            {
                'name': 'Chronic Kidney Disease',
                'slug': 'kidney-disease',
                'description': 'Progressive loss of kidney function over time',
                'symptoms': ['fatigue', 'swelling', 'nausea', 'decreased urination', 'muscle cramps'],
                'specializations': ['general-medicine']
            },
            {
                'name': 'Lumbar Spondylosis',
                'slug': 'back-pain',
                'description': 'Degenerative condition affecting the spine',
                'symptoms': ['lower back pain', 'stiffness', 'numbness', 'leg pain', 'difficulty walking'],
                'specializations': ['orthopedics', 'neurology']
            },
            {
                'name': 'Allergic Rhinitis',
                'slug': 'allergic-rhinitis',
                'description': 'Inflammation of the nasal passages due to allergies',
                'symptoms': ['sneezing', 'runny nose', 'itchy eyes', 'nasal congestion', 'post-nasal drip'],
                'specializations': ['ent', 'general-medicine']
            },
            {
                'name': 'Thyroid Disorders',
                'slug': 'thyroid',
                'description': 'Conditions affecting the thyroid gland function',
                'symptoms': ['fatigue', 'weight changes', 'hair loss', 'mood changes', 'temperature sensitivity'],
                'specializations': ['endocrinology']
            },
            {
                'name': 'Peptic Ulcer Disease',
                'slug': 'peptic-ulcer',
                'description': 'Open sores in the stomach or upper small intestine',
                'symptoms': ['burning stomach pain', 'bloating', 'nausea', 'heartburn', 'loss of appetite'],
                'specializations': ['gastroenterology']
            },
            {
                'name': 'Pneumonia',
                'slug': 'pneumonia',
                'description': 'Infection that inflames the air sacs in the lungs',
                'symptoms': ['cough', 'fever', 'difficulty breathing', 'chest pain', 'fatigue'],
                'specializations': ['general-medicine']
            },
            {
                'name': 'Conjunctivitis (Pink Eye)',
                'slug': 'conjunctivitis',
                'description': 'Inflammation of the conjunctiva of the eye',
                'symptoms': ['red eyes', 'itching', 'discharge', 'tearing', 'sensitivity to light'],
                'specializations': ['ophthalmology']
            },
            {
                'name': 'Sinusitis',
                'slug': 'sinusitis',
                'description': 'Inflammation of the sinuses causing pain and congestion',
                'symptoms': ['facial pain', 'nasal congestion', 'headache', 'post-nasal drip', 'reduced sense of smell'],
                'specializations': ['ent']
            },
        ]
        
        diseases = {}
        for data in diseases_data:
            spec_slugs = data.pop('specializations')
            disease, created = Disease.objects.get_or_create(
                slug=data['slug'],
                defaults=data
            )
            
            # Link to specializations
            for slug in spec_slugs:
                if slug in specializations:
                    disease.specializations.add(specializations[slug])
            
            diseases[disease.slug] = disease
            if created:
                self.stdout.write(f'  ✓ Created disease: {disease.name}')
        
        return diseases

    def create_hospitals(self, diseases):
        hospitals_data = [
            {
                'name': 'Grande International Hospital',
                'slug': 'grande-international',
                'description': 'A leading multi-specialty hospital in Kathmandu with state-of-the-art facilities and internationally trained medical professionals.',
                'email': 'info@grande.com.np',
                'phone': '+977-01-5159266',
                'website': 'https://www.grandehospital.com',
                'address': 'Tokha Road, Dhapasi',
                'city': 'Kathmandu',
                'state': 'Bagmati',
                'country': 'Nepal',
                'latitude': Decimal('27.7417'),
                'longitude': Decimal('85.3200'),
                'established_year': 2010,
                'bed_count': 300,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'ICU', 'Pharmacy', 'Laboratory', 'Radiology', 'Surgery', 'Dialysis'],
                'diseases': ['diabetes', 'hypertension', 'heart-disease', 'migraine', 'arthritis', 'thyroid', 'kidney-disease']
            },
            {
                'name': 'Norvic International Hospital',
                'slug': 'norvic-international',
                'description': 'Premium healthcare services with modern technology and experienced cardiologists.',
                'email': 'info@norvic.com.np',
                'phone': '+977-01-4258554',
                'website': 'https://www.norvichospital.com',
                'address': 'Thapathali',
                'city': 'Kathmandu',
                'state': 'Bagmati',
                'country': 'Nepal',
                'latitude': Decimal('27.6915'),
                'longitude': Decimal('85.3147'),
                'established_year': 2001,
                'bed_count': 200,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'Cardiology', 'Oncology', 'Dialysis', 'Cardiac Surgery'],
                'diseases': ['heart-disease', 'hypertension', 'diabetes', 'cataracts', 'kidney-disease']
            },
            {
                'name': 'Bir Hospital',
                'slug': 'bir-hospital',
                'description': 'The oldest and largest government hospital in Nepal, established in 1889.',
                'email': 'info@birhospital.gov.np',
                'phone': '+977-01-4221119',
                'website': 'https://www.birhospital.gov.np',
                'address': 'Kantipath, Ratna Park',
                'city': 'Kathmandu',
                'state': 'Bagmati',
                'country': 'Nepal',
                'latitude': Decimal('27.7052'),
                'longitude': Decimal('85.3120'),
                'established_year': 1889,
                'bed_count': 500,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'Surgery', 'Medicine', 'Orthopedics', 'ENT'],
                'diseases': ['common-cold', 'asthma', 'gastritis', 'arthritis', 'migraine', 'dengue', 'typhoid', 'pneumonia']
            },
            {
                'name': 'Tribhuvan University Teaching Hospital',
                'slug': 'tuth-hospital',
                'description': 'The premier teaching hospital affiliated with Tribhuvan University Institute of Medicine.',
                'email': 'info@tuth.edu.np',
                'phone': '+977-01-4412707',
                'website': 'https://www.tuth.edu.np',
                'address': 'Maharajgunj',
                'city': 'Kathmandu',
                'state': 'Bagmati',
                'country': 'Nepal',
                'latitude': Decimal('27.7394'),
                'longitude': Decimal('85.3312'),
                'established_year': 1983,
                'bed_count': 700,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'Surgery', 'ICU', 'NICU', 'All Specialties'],
                'diseases': ['diabetes', 'hypertension', 'heart-disease', 'kidney-disease', 'arthritis', 'asthma', 'pneumonia', 'typhoid']
            },
            {
                'name': 'Nepal Mediciti Hospital',
                'slug': 'nepal-mediciti',
                'description': 'A state-of-the-art tertiary care hospital with advanced diagnostic and treatment facilities.',
                'email': 'info@nepalmediciti.com',
                'phone': '+977-01-4217766',
                'website': 'https://www.nepalmediciti.com',
                'address': 'Bhaisepati, Lalitpur',
                'city': 'Lalitpur',
                'state': 'Bagmati',
                'country': 'Nepal',
                'latitude': Decimal('27.6592'),
                'longitude': Decimal('85.3012'),
                'established_year': 2015,
                'bed_count': 400,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'ICU', 'Cardiac Care', 'Neurology', 'Oncology'],
                'diseases': ['heart-disease', 'diabetes', 'migraine', 'back-pain', 'thyroid', 'hypertension']
            },
            {
                'name': 'Patan Hospital',
                'slug': 'patan-hospital',
                'description': 'A renowned community hospital providing quality healthcare in Lalitpur.',
                'email': 'info@patanhospital.org.np',
                'phone': '+977-01-5522266',
                'website': 'https://www.patanhospital.org.np',
                'address': 'Lagankhel, Lalitpur',
                'city': 'Lalitpur',
                'state': 'Bagmati',
                'country': 'Nepal',
                'latitude': Decimal('27.6681'),
                'longitude': Decimal('85.3248'),
                'established_year': 1956,
                'bed_count': 350,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'Maternity', 'Pediatrics', 'Surgery'],
                'diseases': ['common-cold', 'gastritis', 'asthma', 'dengue', 'typhoid', 'pneumonia']
            },
            {
                'name': 'Om Hospital and Research Center',
                'slug': 'om-hospital',
                'description': 'A multispecialty hospital known for neurosurgery and orthopedics.',
                'email': 'info@omhospital.com.np',
                'phone': '+977-01-4476225',
                'website': 'https://www.omhospital.com.np',
                'address': 'Chabahil',
                'city': 'Kathmandu',
                'state': 'Bagmati',
                'country': 'Nepal',
                'latitude': Decimal('27.7189'),
                'longitude': Decimal('85.3489'),
                'established_year': 2006,
                'bed_count': 150,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'Neurosurgery', 'Orthopedics', 'Spine Surgery'],
                'diseases': ['migraine', 'back-pain', 'arthritis']
            },
            {
                'name': 'Nepal Eye Hospital',
                'slug': 'nepal-eye-hospital',
                'description': 'The premier specialized eye care center in Nepal with advanced eye surgery facilities.',
                'email': 'info@nepaleyehospital.org.np',
                'phone': '+977-01-4261399',
                'website': 'https://www.nepaleyehospital.org.np',
                'address': 'Tripureshwor',
                'city': 'Kathmandu',
                'state': 'Bagmati',
                'country': 'Nepal',
                'latitude': Decimal('27.6947'),
                'longitude': Decimal('85.3088'),
                'established_year': 1993,
                'bed_count': 100,
                'is_emergency_available': False,
                'is_ambulance_available': False,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Eye Surgery', 'Cataract Treatment', 'Glaucoma Treatment', 'LASIK'],
                'diseases': ['cataracts', 'conjunctivitis']
            },
            {
                'name': 'Tilganga Institute of Ophthalmology',
                'slug': 'tilganga-eye',
                'description': 'World-renowned eye hospital specializing in affordable cataract surgeries.',
                'email': 'info@tilganga.org',
                'phone': '+977-01-4493775',
                'website': 'https://www.tilganga.org',
                'address': 'Gaushala, Tilganga',
                'city': 'Kathmandu',
                'state': 'Bagmati',
                'country': 'Nepal',
                'latitude': Decimal('27.7012'),
                'longitude': Decimal('85.3456'),
                'established_year': 1994,
                'bed_count': 120,
                'is_emergency_available': False,
                'is_ambulance_available': False,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Cataract Surgery', 'Cornea Transplant', 'Eye Bank'],
                'diseases': ['cataracts', 'conjunctivitis']
            },
            {
                'name': 'Hams Hospital',
                'slug': 'hams-hospital',
                'description': 'Modern private hospital with comprehensive healthcare services.',
                'email': 'info@hamshospital.com',
                'phone': '+977-01-4240805',
                'website': 'https://www.hamshospital.com',
                'address': 'Dhumbarahi',
                'city': 'Kathmandu',
                'state': 'Bagmati',
                'country': 'Nepal',
                'latitude': Decimal('27.7298'),
                'longitude': Decimal('85.3401'),
                'established_year': 2012,
                'bed_count': 100,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'General Medicine', 'Dermatology', 'ENT'],
                'diseases': ['eczema', 'allergic-rhinitis', 'sinusitis', 'common-cold', 'gastritis']
            },
            # Itahari and Eastern Nepal Hospitals
            {
                'name': 'Nobel Medical College and Teaching Hospital',
                'slug': 'nobel-medical-college',
                'description': 'A premier medical college and teaching hospital in Eastern Nepal providing comprehensive healthcare services.',
                'email': 'info@nobelmedicalcollege.com.np',
                'phone': '+977-025-585195',
                'website': 'https://www.nobelmedicalcollege.com.np',
                'address': 'Kanchanbari, Biratnagar',
                'city': 'Biratnagar',
                'state': 'Province 1',
                'country': 'Nepal',
                'latitude': Decimal('26.4525'),
                'longitude': Decimal('87.2718'),
                'established_year': 2008,
                'bed_count': 750,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'ICU', 'Surgery', 'Cardiology', 'Neurology', 'Dialysis'],
                'diseases': ['diabetes', 'hypertension', 'heart-disease', 'kidney-disease', 'typhoid', 'dengue']
            },
            {
                'name': 'B.P. Koirala Institute of Health Sciences (BPKIHS)',
                'slug': 'bpkihs-dharan',
                'description': 'Autonomous health sciences university and hospital providing tertiary care in Eastern Nepal.',
                'email': 'info@bpkihs.edu',
                'phone': '+977-025-525555',
                'website': 'https://www.bpkihs.edu',
                'address': 'Ghopa Camp, Dharan',
                'city': 'Dharan',
                'state': 'Province 1',
                'country': 'Nepal',
                'latitude': Decimal('26.8124'),
                'longitude': Decimal('87.2836'),
                'established_year': 1993,
                'bed_count': 900,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'ICU', 'NICU', 'Cardiac Care', 'Oncology', 'All Specialties'],
                'diseases': ['diabetes', 'hypertension', 'heart-disease', 'migraine', 'arthritis', 'kidney-disease', 'pneumonia', 'typhoid', 'dengue']
            },
            {
                'name': 'Koshi Hospital',
                'slug': 'koshi-hospital',
                'description': 'Government zonal hospital providing affordable healthcare to the people of Eastern Nepal.',
                'email': 'info@koshihospital.gov.np',
                'phone': '+977-021-525222',
                'website': 'https://www.koshihospital.gov.np',
                'address': 'Biratnagar',
                'city': 'Biratnagar',
                'state': 'Province 1',
                'country': 'Nepal',
                'latitude': Decimal('26.4620'),
                'longitude': Decimal('87.2830'),
                'established_year': 1965,
                'bed_count': 300,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'Surgery', 'Medicine', 'Pediatrics', 'Obstetrics'],
                'diseases': ['common-cold', 'gastritis', 'typhoid', 'dengue', 'pneumonia', 'asthma']
            },
            {
                'name': 'Itahari Sub-Metropolitan Hospital',
                'slug': 'itahari-hospital',
                'description': 'Modern community hospital serving the growing population of Itahari and surrounding areas.',
                'email': 'info@itaharihospital.com.np',
                'phone': '+977-025-586789',
                'website': 'https://www.itaharihospital.com.np',
                'address': 'Main Road, Itahari',
                'city': 'Itahari',
                'state': 'Province 1',
                'country': 'Nepal',
                'latitude': Decimal('26.6660'),
                'longitude': Decimal('87.2740'),
                'established_year': 2015,
                'bed_count': 100,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'General Medicine', 'Surgery', 'Pediatrics', 'Maternity'],
                'diseases': ['common-cold', 'gastritis', 'typhoid', 'dengue', 'asthma', 'hypertension', 'diabetes']
            },
            {
                'name': 'Life Care Hospital Itahari',
                'slug': 'lifecare-itahari',
                'description': 'Private multispecialty hospital with modern facilities in the heart of Itahari.',
                'email': 'info@lifecareitahari.com.np',
                'phone': '+977-025-587654',
                'website': 'https://www.lifecareitahari.com.np',
                'address': 'Itahari-6, Main Chowk',
                'city': 'Itahari',
                'state': 'Province 1',
                'country': 'Nepal',
                'latitude': Decimal('26.6670'),
                'longitude': Decimal('87.2800'),
                'established_year': 2018,
                'bed_count': 75,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'Cardiology', 'Orthopedics', 'Gynecology', 'Pathology'],
                'diseases': ['heart-disease', 'arthritis', 'back-pain', 'diabetes', 'hypertension']
            },
            {
                'name': 'Birat Medical College Teaching Hospital',
                'slug': 'birat-medical-college',
                'description': 'Leading medical college and hospital in Biratnagar offering quality medical education and healthcare.',
                'email': 'info@biratmedicalcollege.edu.np',
                'phone': '+977-021-471333',
                'website': 'https://www.biratmedicalcollege.edu.np',
                'address': 'Tankisinwari, Biratnagar',
                'city': 'Biratnagar',
                'state': 'Province 1',
                'country': 'Nepal',
                'latitude': Decimal('26.4732'),
                'longitude': Decimal('87.2567'),
                'established_year': 2015,
                'bed_count': 500,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'ICU', 'Surgery', 'Medicine', 'Pediatrics', 'Orthopedics'],
                'diseases': ['diabetes', 'hypertension', 'arthritis', 'gastritis', 'pneumonia', 'typhoid']
            },
            {
                'name': 'Nepal Eye Hospital Itahari',
                'slug': 'nepal-eye-itahari',
                'description': 'Specialized eye care center in Itahari providing comprehensive eye treatment services.',
                'email': 'itahari@nepaleyehospital.org.np',
                'phone': '+977-025-582211',
                'website': 'https://www.nepaleyehospital.org.np',
                'address': 'Itahari-5, Sunsari',
                'city': 'Itahari',
                'state': 'Province 1',
                'country': 'Nepal',
                'latitude': Decimal('26.6640'),
                'longitude': Decimal('87.2710'),
                'established_year': 2010,
                'bed_count': 30,
                'is_emergency_available': False,
                'is_ambulance_available': False,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Eye Surgery', 'Cataract Treatment', 'Glaucoma Treatment', 'Optical Shop'],
                'diseases': ['cataracts', 'conjunctivitis']
            },
            {
                'name': 'Siddhi Memorial Hospital Itahari',
                'slug': 'siddhi-memorial-itahari',
                'description': 'Community hospital focused on providing affordable healthcare to local residents.',
                'email': 'info@siddhimemorial.com.np',
                'phone': '+977-025-580123',
                'website': 'https://www.siddhimemorial.com.np',
                'address': 'Itahari-7, Bus Park Road',
                'city': 'Itahari',
                'state': 'Province 1',
                'country': 'Nepal',
                'latitude': Decimal('26.6695'),
                'longitude': Decimal('87.2765'),
                'established_year': 2012,
                'bed_count': 50,
                'is_emergency_available': True,
                'is_ambulance_available': True,
                'status': Hospital.Status.ACTIVE,
                'is_verified': True,
                'services': ['Emergency', 'General Medicine', 'Pediatrics', 'Pharmacy'],
                'diseases': ['common-cold', 'gastritis', 'dengue', 'typhoid', 'asthma']
            },
        ]
        
        hospitals = {}
        for data in hospitals_data:
            disease_slugs = data.pop('diseases')
            hospital, created = Hospital.objects.get_or_create(
                slug=data['slug'],
                defaults=data
            )
            
            # Link diseases
            for slug in disease_slugs:
                if slug in diseases:
                    hospital.diseases_treated.add(diseases[slug])
            
            hospitals[hospital.slug] = hospital
            if created:
                self.stdout.write(f'  ✓ Created hospital: {hospital.name}')
        
        return hospitals

    def create_departments(self, hospitals, specializations):
        departments_data = {
            'grande-international': [
                ('Cardiology', 'cardiology'),
                ('Neurology', 'neurology'),
                ('Orthopedics', 'orthopedics'),
                ('General Medicine', 'general-medicine'),
                ('Endocrinology', 'endocrinology'),
                ('Gastroenterology', 'gastroenterology'),
            ],
            'norvic-international': [
                ('Cardiology', 'cardiology'),
                ('Ophthalmology', 'ophthalmology'),
                ('Endocrinology', 'endocrinology'),
                ('General Medicine', 'general-medicine'),
            ],
            'bir-hospital': [
                ('General Medicine', 'general-medicine'),
                ('Orthopedics', 'orthopedics'),
                ('ENT', 'ent'),
                ('Gastroenterology', 'gastroenterology'),
                ('Dermatology', 'dermatology'),
            ],
            'tuth-hospital': [
                ('Cardiology', 'cardiology'),
                ('Neurology', 'neurology'),
                ('Orthopedics', 'orthopedics'),
                ('General Medicine', 'general-medicine'),
                ('Gastroenterology', 'gastroenterology'),
                ('Endocrinology', 'endocrinology'),
                ('Pediatrics', 'pediatrics'),
            ],
            'nepal-mediciti': [
                ('Cardiology', 'cardiology'),
                ('Neurology', 'neurology'),
                ('General Medicine', 'general-medicine'),
                ('Endocrinology', 'endocrinology'),
                ('Orthopedics', 'orthopedics'),
            ],
            'patan-hospital': [
                ('General Medicine', 'general-medicine'),
                ('Pediatrics', 'pediatrics'),
                ('Gastroenterology', 'gastroenterology'),
            ],
            'om-hospital': [
                ('Neurology', 'neurology'),
                ('Orthopedics', 'orthopedics'),
            ],
            'nepal-eye-hospital': [
                ('Ophthalmology', 'ophthalmology'),
            ],
            'tilganga-eye': [
                ('Ophthalmology', 'ophthalmology'),
            ],
            'hams-hospital': [
                ('Dermatology', 'dermatology'),
                ('ENT', 'ent'),
                ('General Medicine', 'general-medicine'),
            ],
            # Itahari and Eastern Nepal Hospital Departments
            'nobel-medical-college': [
                ('Cardiology', 'cardiology'),
                ('Neurology', 'neurology'),
                ('General Medicine', 'general-medicine'),
                ('Gastroenterology', 'gastroenterology'),
                ('Endocrinology', 'endocrinology'),
            ],
            'bpkihs-dharan': [
                ('Cardiology', 'cardiology'),
                ('Neurology', 'neurology'),
                ('Orthopedics', 'orthopedics'),
                ('General Medicine', 'general-medicine'),
                ('Gastroenterology', 'gastroenterology'),
                ('Endocrinology', 'endocrinology'),
                ('Dermatology', 'dermatology'),
            ],
            'koshi-hospital': [
                ('General Medicine', 'general-medicine'),
                ('Pediatrics', 'pediatrics'),
                ('Gastroenterology', 'gastroenterology'),
            ],
            'itahari-hospital': [
                ('General Medicine', 'general-medicine'),
                ('Pediatrics', 'pediatrics'),
                ('Gastroenterology', 'gastroenterology'),
            ],
            'lifecare-itahari': [
                ('Cardiology', 'cardiology'),
                ('Orthopedics', 'orthopedics'),
                ('General Medicine', 'general-medicine'),
            ],
            'birat-medical-college': [
                ('General Medicine', 'general-medicine'),
                ('Orthopedics', 'orthopedics'),
                ('Gastroenterology', 'gastroenterology'),
                ('Pediatrics', 'pediatrics'),
            ],
            'nepal-eye-itahari': [
                ('Ophthalmology', 'ophthalmology'),
            ],
            'siddhi-memorial-itahari': [
                ('General Medicine', 'general-medicine'),
                ('Pediatrics', 'pediatrics'),
            ],
        }
        
        departments = {}
        for hospital_slug, dept_list in departments_data.items():
            if hospital_slug not in hospitals:
                continue
            hospital = hospitals[hospital_slug]
            for dept_name, dept_slug in dept_list:
                dept, created = Department.objects.get_or_create(
                    hospital=hospital,
                    slug=dept_slug,
                    defaults={'name': dept_name}
                )
                departments[(hospital_slug, dept_slug)] = dept
                if created:
                    self.stdout.write(f'  ✓ Created department: {dept_name} at {hospital.name}')
        
        return departments

    def create_doctors(self, hospitals, departments, specializations, diseases):
        doctors_data = [
            # Grande International Hospital Doctors
            {
                'email': 'dr.ramesh.sharma@grande.com.np',
                'first_name': 'Ramesh',
                'last_name': 'Sharma',
                'phone': '+977-9801234567',
                'hospital_slug': 'grande-international',
                'department_slug': 'cardiology',
                'specialization_slug': 'cardiology',
                'license_number': 'NMC-12345',
                'qualification': 'MD Cardiology (AIIMS Delhi), FACC',
                'experience_years': 18,
                'bio': 'Dr. Ramesh Sharma is a senior interventional cardiologist with 18 years of experience. He specializes in complex angioplasty, pacemaker implantation, and heart failure management.',
                'consultation_fee': Decimal('2000.00'),
                'follow_up_fee': Decimal('1200.00'),
                'diseases': ['heart-disease', 'hypertension']
            },
            {
                'email': 'dr.sita.poudel@grande.com.np',
                'first_name': 'Sita',
                'last_name': 'Poudel',
                'phone': '+977-9802345678',
                'hospital_slug': 'grande-international',
                'department_slug': 'endocrinology',
                'specialization_slug': 'endocrinology',
                'license_number': 'NMC-23456',
                'qualification': 'DM Endocrinology (PGIMER), MBBS',
                'experience_years': 14,
                'bio': 'Dr. Sita Poudel is a renowned endocrinologist specializing in diabetes management, thyroid disorders, and hormonal imbalances.',
                'consultation_fee': Decimal('1500.00'),
                'follow_up_fee': Decimal('900.00'),
                'diseases': ['diabetes', 'thyroid']
            },
            {
                'email': 'dr.sunil.basnet@grande.com.np',
                'first_name': 'Sunil',
                'last_name': 'Basnet',
                'phone': '+977-9807890123',
                'hospital_slug': 'grande-international',
                'department_slug': 'neurology',
                'specialization_slug': 'neurology',
                'license_number': 'NMC-78901',
                'qualification': 'DM Neurology (IOM), MBBS',
                'experience_years': 16,
                'bio': 'Dr. Sunil Basnet is a consultant neurologist specializing in headache disorders, epilepsy, and stroke management.',
                'consultation_fee': Decimal('1800.00'),
                'follow_up_fee': Decimal('1100.00'),
                'diseases': ['migraine', 'back-pain']
            },
            
            # Norvic International Hospital Doctors
            {
                'email': 'dr.bikash.thapa@norvic.com.np',
                'first_name': 'Bikash',
                'last_name': 'Thapa',
                'phone': '+977-9803456789',
                'hospital_slug': 'norvic-international',
                'department_slug': 'cardiology',
                'specialization_slug': 'cardiology',
                'license_number': 'NMC-34567',
                'qualification': 'DM Cardiology, MD Internal Medicine',
                'experience_years': 12,
                'bio': 'Dr. Bikash Thapa is an expert interventional cardiologist known for complex coronary interventions and structural heart disease treatment.',
                'consultation_fee': Decimal('2200.00'),
                'follow_up_fee': Decimal('1400.00'),
                'diseases': ['heart-disease', 'hypertension']
            },
            {
                'email': 'dr.maya.lama@norvic.com.np',
                'first_name': 'Maya',
                'last_name': 'Lama',
                'phone': '+977-9812345678',
                'hospital_slug': 'norvic-international',
                'department_slug': 'endocrinology',
                'specialization_slug': 'endocrinology',
                'license_number': 'NMC-44567',
                'qualification': 'DM Endocrinology, MD',
                'experience_years': 10,
                'bio': 'Dr. Maya Lama specializes in diabetic care, insulin pump therapy, and metabolic syndrome management.',
                'consultation_fee': Decimal('1600.00'),
                'follow_up_fee': Decimal('1000.00'),
                'diseases': ['diabetes', 'thyroid', 'kidney-disease']
            },
            
            # Bir Hospital Doctors
            {
                'email': 'dr.anita.gurung@birhospital.gov.np',
                'first_name': 'Anita',
                'last_name': 'Gurung',
                'phone': '+977-9804567890',
                'hospital_slug': 'bir-hospital',
                'department_slug': 'general-medicine',
                'specialization_slug': 'general-medicine',
                'license_number': 'NMC-45678',
                'qualification': 'MD Internal Medicine (IOM)',
                'experience_years': 9,
                'bio': 'Dr. Anita Gurung is a dedicated internist treating infectious diseases, respiratory conditions, and general health issues.',
                'consultation_fee': Decimal('500.00'),
                'follow_up_fee': Decimal('300.00'),
                'diseases': ['common-cold', 'asthma', 'pneumonia', 'dengue', 'typhoid']
            },
            {
                'email': 'dr.kamala.shrestha@birhospital.gov.np',
                'first_name': 'Kamala',
                'last_name': 'Shrestha',
                'phone': '+977-9808901234',
                'hospital_slug': 'bir-hospital',
                'department_slug': 'orthopedics',
                'specialization_slug': 'orthopedics',
                'license_number': 'NMC-89012',
                'qualification': 'MS Orthopedics (TU), Fellowship Joint Replacement',
                'experience_years': 15,
                'bio': 'Dr. Kamala Shrestha is a senior orthopedic surgeon specializing in hip and knee replacement surgeries.',
                'consultation_fee': Decimal('800.00'),
                'follow_up_fee': Decimal('500.00'),
                'diseases': ['arthritis', 'back-pain']
            },
            {
                'email': 'dr.krishna.adhikari@birhospital.gov.np',
                'first_name': 'Krishna',
                'last_name': 'Adhikari',
                'phone': '+977-9815678901',
                'hospital_slug': 'bir-hospital',
                'department_slug': 'gastroenterology',
                'specialization_slug': 'gastroenterology',
                'license_number': 'NMC-55678',
                'qualification': 'DM Gastroenterology (BPKIHS)',
                'experience_years': 11,
                'bio': 'Dr. Krishna Adhikari is a gastroenterologist with expertise in endoscopy, liver diseases, and digestive disorders.',
                'consultation_fee': Decimal('700.00'),
                'follow_up_fee': Decimal('400.00'),
                'diseases': ['gastritis', 'peptic-ulcer', 'typhoid']
            },
            
            # TUTH Hospital Doctors
            {
                'email': 'dr.hari.khadka@tuth.edu.np',
                'first_name': 'Hari',
                'last_name': 'Khadka',
                'phone': '+977-9823456789',
                'hospital_slug': 'tuth-hospital',
                'department_slug': 'cardiology',
                'specialization_slug': 'cardiology',
                'license_number': 'NMC-66789',
                'qualification': 'DM Cardiology (IOM), MBBS',
                'experience_years': 20,
                'bio': 'Professor Dr. Hari Khadka is the head of cardiology at TUTH with extensive experience in treating complex cardiac conditions.',
                'consultation_fee': Decimal('1000.00'),
                'follow_up_fee': Decimal('600.00'),
                'diseases': ['heart-disease', 'hypertension']
            },
            {
                'email': 'dr.gita.karki@tuth.edu.np',
                'first_name': 'Gita',
                'last_name': 'Karki',
                'phone': '+977-9834567890',
                'hospital_slug': 'tuth-hospital',
                'department_slug': 'pediatrics',
                'specialization_slug': 'pediatrics',
                'license_number': 'NMC-77890',
                'qualification': 'MD Pediatrics (TU)',
                'experience_years': 12,
                'bio': 'Dr. Gita Karki is a compassionate pediatrician specializing in childhood illnesses and developmental disorders.',
                'consultation_fee': Decimal('800.00'),
                'follow_up_fee': Decimal('500.00'),
                'diseases': ['common-cold', 'asthma', 'dengue']
            },
            
            # Nepal Mediciti Doctors
            {
                'email': 'dr.binod.maharjan@mediciti.com.np',
                'first_name': 'Binod',
                'last_name': 'Maharjan',
                'phone': '+977-9845678901',
                'hospital_slug': 'nepal-mediciti',
                'department_slug': 'neurology',
                'specialization_slug': 'neurology',
                'license_number': 'NMC-88901',
                'qualification': 'DM Neurology, Fellowship Stroke Medicine (UK)',
                'experience_years': 14,
                'bio': 'Dr. Binod Maharjan is a stroke specialist and neurologist trained in the UK with expertise in acute stroke intervention.',
                'consultation_fee': Decimal('2500.00'),
                'follow_up_fee': Decimal('1500.00'),
                'diseases': ['migraine', 'back-pain']
            },
            {
                'email': 'dr.sunita.rai@mediciti.com.np',
                'first_name': 'Sunita',
                'last_name': 'Rai',
                'phone': '+977-9856789012',
                'hospital_slug': 'nepal-mediciti',
                'department_slug': 'endocrinology',
                'specialization_slug': 'endocrinology',
                'license_number': 'NMC-99012',
                'qualification': 'DM Endocrinology (AIIMS)',
                'experience_years': 10,
                'bio': 'Dr. Sunita Rai specializes in advanced diabetes care including insulin pump therapy and continuous glucose monitoring.',
                'consultation_fee': Decimal('2000.00'),
                'follow_up_fee': Decimal('1200.00'),
                'diseases': ['diabetes', 'thyroid']
            },
            
            # Patan Hospital Doctors
            {
                'email': 'dr.dipendra.pandey@patanhospital.org.np',
                'first_name': 'Dipendra',
                'last_name': 'Pandey',
                'phone': '+977-9867890123',
                'hospital_slug': 'patan-hospital',
                'department_slug': 'general-medicine',
                'specialization_slug': 'general-medicine',
                'license_number': 'NMC-10123',
                'qualification': 'MD Internal Medicine (TU)',
                'experience_years': 8,
                'bio': 'Dr. Dipendra Pandey is a dedicated physician treating a wide range of medical conditions at Patan Hospital.',
                'consultation_fee': Decimal('600.00'),
                'follow_up_fee': Decimal('400.00'),
                'diseases': ['common-cold', 'gastritis', 'pneumonia', 'dengue', 'typhoid']
            },
            
            # Om Hospital Doctors
            {
                'email': 'dr.rajesh.neupane@omhospital.com.np',
                'first_name': 'Rajesh',
                'last_name': 'Neupane',
                'phone': '+977-9878901234',
                'hospital_slug': 'om-hospital',
                'department_slug': 'neurology',
                'specialization_slug': 'neurology',
                'license_number': 'NMC-11234',
                'qualification': 'MS Neurosurgery (IOM), MCh Spine Surgery',
                'experience_years': 17,
                'bio': 'Dr. Rajesh Neupane is a renowned neurosurgeon specializing in spine surgery and brain tumor removal.',
                'consultation_fee': Decimal('1800.00'),
                'follow_up_fee': Decimal('1000.00'),
                'diseases': ['back-pain', 'migraine']
            },
            {
                'email': 'dr.sarita.tamang@omhospital.com.np',
                'first_name': 'Sarita',
                'last_name': 'Tamang',
                'phone': '+977-9889012345',
                'hospital_slug': 'om-hospital',
                'department_slug': 'orthopedics',
                'specialization_slug': 'orthopedics',
                'license_number': 'NMC-12345',
                'qualification': 'MS Orthopedics, Fellowship Sports Medicine',
                'experience_years': 9,
                'bio': 'Dr. Sarita Tamang is an orthopedic surgeon specializing in sports injuries and arthroscopic surgery.',
                'consultation_fee': Decimal('1500.00'),
                'follow_up_fee': Decimal('900.00'),
                'diseases': ['arthritis', 'back-pain']
            },
            
            # Nepal Eye Hospital Doctors
            {
                'email': 'dr.prakash.koirala@nepaleyehospital.org.np',
                'first_name': 'Prakash',
                'last_name': 'Koirala',
                'phone': '+977-9805678901',
                'hospital_slug': 'nepal-eye-hospital',
                'department_slug': 'ophthalmology',
                'specialization_slug': 'ophthalmology',
                'license_number': 'NMC-56789',
                'qualification': 'MS Ophthalmology (IOM), Fellowship Retina',
                'experience_years': 22,
                'bio': 'Dr. Prakash Koirala is a senior ophthalmologist with 22 years of experience in cataract and retinal surgery.',
                'consultation_fee': Decimal('1200.00'),
                'follow_up_fee': Decimal('600.00'),
                'diseases': ['cataracts', 'conjunctivitis']
            },
            
            # Tilganga Eye Hospital Doctors
            {
                'email': 'dr.sanduk.ruit@tilganga.org',
                'first_name': 'Sanduk',
                'last_name': 'Ruit',
                'phone': '+977-9890123456',
                'hospital_slug': 'tilganga-eye',
                'department_slug': 'ophthalmology',
                'specialization_slug': 'ophthalmology',
                'license_number': 'NMC-00001',
                'qualification': 'MS Ophthalmology, Ramon Magsaysay Award Recipient',
                'experience_years': 35,
                'bio': 'Dr. Sanduk Ruit is a world-renowned ophthalmologist and pioneer of small-incision cataract surgery. He has restored sight to over 100,000 people.',
                'consultation_fee': Decimal('800.00'),
                'follow_up_fee': Decimal('400.00'),
                'diseases': ['cataracts']
            },
            
            # Hams Hospital Doctors
            {
                'email': 'dr.meena.rai@hamshospital.com',
                'first_name': 'Meena',
                'last_name': 'Rai',
                'phone': '+977-9806789012',
                'hospital_slug': 'hams-hospital',
                'department_slug': 'dermatology',
                'specialization_slug': 'dermatology',
                'license_number': 'NMC-67890',
                'qualification': 'MD Dermatology (BPKIHS)',
                'experience_years': 8,
                'bio': 'Dr. Meena Rai is a dermatologist specializing in eczema, psoriasis, and cosmetic dermatology.',
                'consultation_fee': Decimal('1000.00'),
                'follow_up_fee': Decimal('600.00'),
                'diseases': ['eczema']
            },
            {
                'email': 'dr.puskar.ghimire@hamshospital.com',
                'first_name': 'Puskar',
                'last_name': 'Ghimire',
                'phone': '+977-9901234567',
                'hospital_slug': 'hams-hospital',
                'department_slug': 'ent',
                'specialization_slug': 'ent',
                'license_number': 'NMC-13456',
                'qualification': 'MS ENT (TU)',
                'experience_years': 11,
                'bio': 'Dr. Puskar Ghimire is an ENT specialist treating sinus problems, hearing disorders, and throat conditions.',
                'consultation_fee': Decimal('900.00'),
                'follow_up_fee': Decimal('550.00'),
                'diseases': ['allergic-rhinitis', 'sinusitis']
            },
            
            # Itahari and Eastern Nepal Hospital Doctors
            # Nobel Medical College Doctors
            {
                'email': 'dr.binod.karki@nobelmedical.edu.np',
                'first_name': 'Binod',
                'last_name': 'Karki',
                'phone': '+977-9842123456',
                'hospital_slug': 'nobel-medical-college',
                'department_slug': 'cardiology',
                'specialization_slug': 'cardiology',
                'license_number': 'NMC-20001',
                'qualification': 'MD Cardiology (BPKIHS), FACC',
                'experience_years': 15,
                'bio': 'Dr. Binod Karki is a senior cardiologist specializing in interventional cardiology and heart failure management.',
                'consultation_fee': Decimal('1500.00'),
                'follow_up_fee': Decimal('900.00'),
                'diseases': ['heart-disease', 'hypertension']
            },
            {
                'email': 'dr.gita.chaudhary@nobelmedical.edu.np',
                'first_name': 'Gita',
                'last_name': 'Chaudhary',
                'phone': '+977-9852234567',
                'hospital_slug': 'nobel-medical-college',
                'department_slug': 'general-medicine',
                'specialization_slug': 'general-medicine',
                'license_number': 'NMC-20002',
                'qualification': 'MD Internal Medicine (BPKIHS)',
                'experience_years': 10,
                'bio': 'Dr. Gita Chaudhary is an internal medicine specialist treating a wide range of medical conditions.',
                'consultation_fee': Decimal('800.00'),
                'follow_up_fee': Decimal('500.00'),
                'diseases': ['diabetes', 'typhoid', 'dengue', 'hypertension']
            },
            
            # BPKIHS Doctors
            {
                'email': 'dr.arun.subedi@bpkihs.edu',
                'first_name': 'Arun',
                'last_name': 'Subedi',
                'phone': '+977-9862345678',
                'hospital_slug': 'bpkihs-dharan',
                'department_slug': 'neurology',
                'specialization_slug': 'neurology',
                'license_number': 'NMC-20003',
                'qualification': 'DM Neurology (AIIMS), MBBS',
                'experience_years': 18,
                'bio': 'Dr. Arun Subedi is a renowned neurologist at BPKIHS specializing in stroke, epilepsy, and neurodegenerative diseases.',
                'consultation_fee': Decimal('1200.00'),
                'follow_up_fee': Decimal('800.00'),
                'diseases': ['migraine', 'back-pain']
            },
            {
                'email': 'dr.prabha.bhattarai@bpkihs.edu',
                'first_name': 'Prabha',
                'last_name': 'Bhattarai',
                'phone': '+977-9872456789',
                'hospital_slug': 'bpkihs-dharan',
                'department_slug': 'cardiology',
                'specialization_slug': 'cardiology',
                'license_number': 'NMC-20004',
                'qualification': 'DM Cardiology (BPKIHS)',
                'experience_years': 12,
                'bio': 'Dr. Prabha Bhattarai is an interventional cardiologist with expertise in angioplasty and cardiac imaging.',
                'consultation_fee': Decimal('1400.00'),
                'follow_up_fee': Decimal('900.00'),
                'diseases': ['heart-disease', 'hypertension']
            },
            {
                'email': 'dr.manish.koirala@bpkihs.edu',
                'first_name': 'Manish',
                'last_name': 'Koirala',
                'phone': '+977-9822567890',
                'hospital_slug': 'bpkihs-dharan',
                'department_slug': 'gastroenterology',
                'specialization_slug': 'gastroenterology',
                'license_number': 'NMC-20005',
                'qualification': 'DM Gastroenterology (AIIMS)',
                'experience_years': 14,
                'bio': 'Dr. Manish Koirala is a gastroenterologist specializing in liver diseases, endoscopy, and GI disorders.',
                'consultation_fee': Decimal('1100.00'),
                'follow_up_fee': Decimal('700.00'),
                'diseases': ['gastritis', 'peptic-ulcer', 'typhoid']
            },
            
            # Koshi Hospital Doctors
            {
                'email': 'dr.laxmi.yadav@koshihospital.gov.np',
                'first_name': 'Laxmi',
                'last_name': 'Yadav',
                'phone': '+977-9812678901',
                'hospital_slug': 'koshi-hospital',
                'department_slug': 'general-medicine',
                'specialization_slug': 'general-medicine',
                'license_number': 'NMC-20006',
                'qualification': 'MD Internal Medicine (IOM)',
                'experience_years': 8,
                'bio': 'Dr. Laxmi Yadav is a dedicated physician at Koshi Hospital treating common medical conditions.',
                'consultation_fee': Decimal('400.00'),
                'follow_up_fee': Decimal('250.00'),
                'diseases': ['common-cold', 'gastritis', 'typhoid', 'dengue', 'pneumonia', 'asthma']
            },
            
            # Itahari Hospital Doctors
            {
                'email': 'dr.suresh.limbu@itaharihospital.com.np',
                'first_name': 'Suresh',
                'last_name': 'Limbu',
                'phone': '+977-9842789012',
                'hospital_slug': 'itahari-hospital',
                'department_slug': 'general-medicine',
                'specialization_slug': 'general-medicine',
                'license_number': 'NMC-20007',
                'qualification': 'MD Internal Medicine (BPKIHS)',
                'experience_years': 7,
                'bio': 'Dr. Suresh Limbu is a general physician serving the Itahari community with comprehensive medical care.',
                'consultation_fee': Decimal('500.00'),
                'follow_up_fee': Decimal('300.00'),
                'diseases': ['common-cold', 'gastritis', 'typhoid', 'dengue', 'asthma', 'diabetes', 'hypertension']
            },
            {
                'email': 'dr.rita.shrestha@itaharihospital.com.np',
                'first_name': 'Rita',
                'last_name': 'Shrestha',
                'phone': '+977-9852890123',
                'hospital_slug': 'itahari-hospital',
                'department_slug': 'pediatrics',
                'specialization_slug': 'pediatrics',
                'license_number': 'NMC-20008',
                'qualification': 'MD Pediatrics (IOM)',
                'experience_years': 9,
                'bio': 'Dr. Rita Shrestha is a pediatrician dedicated to child healthcare in Itahari.',
                'consultation_fee': Decimal('600.00'),
                'follow_up_fee': Decimal('400.00'),
                'diseases': ['common-cold', 'dengue', 'typhoid']
            },
            
            # Life Care Hospital Itahari Doctors
            {
                'email': 'dr.kumar.rai@lifecareitahari.com.np',
                'first_name': 'Kumar',
                'last_name': 'Rai',
                'phone': '+977-9862901234',
                'hospital_slug': 'lifecare-itahari',
                'department_slug': 'cardiology',
                'specialization_slug': 'cardiology',
                'license_number': 'NMC-20009',
                'qualification': 'MD Cardiology (BPKIHS)',
                'experience_years': 10,
                'bio': 'Dr. Kumar Rai is a cardiologist providing heart care services in Itahari.',
                'consultation_fee': Decimal('1200.00'),
                'follow_up_fee': Decimal('800.00'),
                'diseases': ['heart-disease', 'hypertension']
            },
            {
                'email': 'dr.sunita.magar@lifecareitahari.com.np',
                'first_name': 'Sunita',
                'last_name': 'Magar',
                'phone': '+977-9872012345',
                'hospital_slug': 'lifecare-itahari',
                'department_slug': 'orthopedics',
                'specialization_slug': 'orthopedics',
                'license_number': 'NMC-20010',
                'qualification': 'MS Orthopedics (TU)',
                'experience_years': 8,
                'bio': 'Dr. Sunita Magar is an orthopedic surgeon specializing in joint and bone disorders.',
                'consultation_fee': Decimal('1000.00'),
                'follow_up_fee': Decimal('600.00'),
                'diseases': ['arthritis', 'back-pain']
            },
            
            # Birat Medical College Doctors
            {
                'email': 'dr.bijay.shah@biratmedical.edu.np',
                'first_name': 'Bijay',
                'last_name': 'Shah',
                'phone': '+977-9812123456',
                'hospital_slug': 'birat-medical-college',
                'department_slug': 'general-medicine',
                'specialization_slug': 'general-medicine',
                'license_number': 'NMC-20011',
                'qualification': 'MD Internal Medicine (Nobel)',
                'experience_years': 6,
                'bio': 'Dr. Bijay Shah is an internist at Birat Medical College treating various medical conditions.',
                'consultation_fee': Decimal('700.00'),
                'follow_up_fee': Decimal('450.00'),
                'diseases': ['diabetes', 'hypertension', 'gastritis', 'pneumonia', 'typhoid']
            },
            {
                'email': 'dr.nirmala.tharu@biratmedical.edu.np',
                'first_name': 'Nirmala',
                'last_name': 'Tharu',
                'phone': '+977-9822234567',
                'hospital_slug': 'birat-medical-college',
                'department_slug': 'orthopedics',
                'specialization_slug': 'orthopedics',
                'license_number': 'NMC-20012',
                'qualification': 'MS Orthopedics (BPKIHS)',
                'experience_years': 11,
                'bio': 'Dr. Nirmala Tharu is an orthopedic surgeon specializing in trauma and joint replacement.',
                'consultation_fee': Decimal('900.00'),
                'follow_up_fee': Decimal('550.00'),
                'diseases': ['arthritis', 'back-pain']
            },
            
            # Nepal Eye Hospital Itahari Doctor
            {
                'email': 'dr.hari.rai@nepaleyeitahari.org.np',
                'first_name': 'Hari',
                'last_name': 'Rai',
                'phone': '+977-9842345678',
                'hospital_slug': 'nepal-eye-itahari',
                'department_slug': 'ophthalmology',
                'specialization_slug': 'ophthalmology',
                'license_number': 'NMC-20013',
                'qualification': 'MS Ophthalmology (Tilganga)',
                'experience_years': 12,
                'bio': 'Dr. Hari Rai is an ophthalmologist providing eye care services in Eastern Nepal.',
                'consultation_fee': Decimal('800.00'),
                'follow_up_fee': Decimal('500.00'),
                'diseases': ['cataracts', 'conjunctivitis']
            },
            
            # Siddhi Memorial Hospital Itahari Doctor
            {
                'email': 'dr.deepak.bhandari@siddhimemorial.com.np',
                'first_name': 'Deepak',
                'last_name': 'Bhandari',
                'phone': '+977-9852456789',
                'hospital_slug': 'siddhi-memorial-itahari',
                'department_slug': 'general-medicine',
                'specialization_slug': 'general-medicine',
                'license_number': 'NMC-20014',
                'qualification': 'MBBS, MD (General Medicine)',
                'experience_years': 5,
                'bio': 'Dr. Deepak Bhandari is a general physician providing affordable healthcare in Itahari.',
                'consultation_fee': Decimal('400.00'),
                'follow_up_fee': Decimal('250.00'),
                'diseases': ['common-cold', 'gastritis', 'dengue', 'typhoid', 'asthma']
            },
        ]
        
        for data in doctors_data:
            hospital_slug = data.pop('hospital_slug')
            department_slug = data.pop('department_slug')
            specialization_slug = data.pop('specialization_slug')
            disease_slugs = data.pop('diseases')
            
            hospital = hospitals.get(hospital_slug)
            department = departments.get((hospital_slug, department_slug))
            specialization = specializations.get(specialization_slug)
            
            if not hospital:
                continue
            
            # Create user
            user, user_created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'phone': data['phone'],
                    'role': UserRole.DOCTOR,
                    'hospital': hospital,
                    'is_active': True,
                    'is_verified': True,
                }
            )
            
            if user_created:
                user.set_password('password123')
                user.save()
            
            # Create doctor profile
            doctor, created = DoctorProfile.objects.get_or_create(
                user=user,
                defaults={
                    'hospital': hospital,
                    'department': department,
                    'specialization': specialization,
                    'license_number': data['license_number'],
                    'qualification': data['qualification'],
                    'experience_years': data['experience_years'],
                    'bio': data['bio'],
                    'consultation_fee': data['consultation_fee'],
                    'follow_up_fee': data['follow_up_fee'],
                    'is_active': True,
                    'is_accepting_appointments': True,
                }
            )
            
            # Link diseases
            for slug in disease_slugs:
                if slug in diseases:
                    doctor.diseases.add(diseases[slug])
            
            # Create availability slots (Mon-Fri, 9AM-5PM)
            if created:
                for day in range(1, 6):  # Monday to Friday
                    AvailabilitySlot.objects.get_or_create(
                        doctor=doctor,
                        day_of_week=day,
                        start_time='09:00:00',
                        end_time='12:00:00',
                        defaults={'max_appointments': 10, 'is_active': True}
                    )
                    AvailabilitySlot.objects.get_or_create(
                        doctor=doctor,
                        day_of_week=day,
                        start_time='14:00:00',
                        end_time='17:00:00',
                        defaults={'max_appointments': 10, 'is_active': True}
                    )
                
                self.stdout.write(f'  ✓ Created doctor: Dr. {user.get_full_name()} at {hospital.name}')

    def create_test_patient(self):
        user, created = User.objects.get_or_create(
            email='patient@test.com',
            defaults={
                'first_name': 'Test',
                'last_name': 'Patient',
                'phone': '+977-9812345678',
                'role': UserRole.PATIENT,
                'is_active': True,
                'is_verified': True,
            }
        )
        
        if created:
            user.set_password('password123')
            user.save()
            self.stdout.write(f'  ✓ Created test patient: {user.email}')
        
        # Create super admin
        admin, admin_created = User.objects.get_or_create(
            email='admin@medikit.com',
            defaults={
                'first_name': 'Super',
                'last_name': 'Admin',
                'role': UserRole.SUPER_ADMIN,
                'is_active': True,
                'is_verified': True,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        
        if admin_created:
            admin.set_password('password123')
            admin.save()
            self.stdout.write(f'  ✓ Created super admin: {admin.email}')
