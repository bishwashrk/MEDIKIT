"""Payment views with eSewa integration."""

import base64
import hashlib
import hmac
import json
import os
import ssl
from decimal import Decimal, InvalidOperation
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import urlopen

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsHospitalAdmin
from apps.appointments.models import Appointment
from apps.chat.models import ChatThread
from .models import Invoice, Payment


def _url_available(url: str) -> bool:
    try:
        with urlopen(url, timeout=6) as response:
            status_code = response.getcode() or 0
            return status_code != 404 and status_code < 500
    except HTTPError as error:
        return error.code not in (404, 500, 502, 503, 504)
    except Exception:
        return False


def _resolve_esewa_urls(merchant_code: str) -> tuple[str | None, str]:
    env_form_url = os.getenv('ESEWA_FORM_URL', '').strip()
    env_status_base = os.getenv('ESEWA_STATUS_BASE_URL', '').strip()
    fallback_candidates = [
        url.strip()
        for url in os.getenv('ESEWA_FORM_URL_FALLBACKS', '').split(',')
        if url.strip()
    ]

    if merchant_code == 'EPAYTEST':
        default_form_candidates = [
            'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
            'https://epay.esewa.com.np/api/epay/main/v2/form',
        ]
        default_status_base = 'https://rc.esewa.com.np'
    else:
        default_form_candidates = [
            'https://epay.esewa.com.np/api/epay/main/v2/form',
            'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
        ]
        default_status_base = 'https://esewa.com.np'

    candidates = []
    if env_form_url:
        candidates.append(env_form_url)
    candidates.extend(default_form_candidates)
    candidates.extend(fallback_candidates)

    deduped_candidates = []
    seen = set()
    for candidate in candidates:
        if candidate not in seen:
            seen.add(candidate)
            deduped_candidates.append(candidate)

    probe_enabled = os.getenv('ESEWA_PROBE_FORM_URL', 'True').lower() in ('true', '1', 'yes')
    if probe_enabled:
        for candidate in deduped_candidates:
            if _url_available(candidate):
                return candidate, env_status_base or default_status_base
        # Keep payment flow usable even if probe fails due transient network/DNS limits.
        if deduped_candidates:
            return deduped_candidates[0], env_status_base or default_status_base
        return None, env_status_base or default_status_base

    return deduped_candidates[0], env_status_base or default_status_base


def _status_base_candidates(merchant_code: str, primary_base: str) -> list[str]:
    candidates = []
    if primary_base:
        candidates.append(primary_base.rstrip('/'))

    env_fallbacks = [
        url.strip().rstrip('/')
        for url in os.getenv('ESEWA_STATUS_BASE_URL_FALLBACKS', '').split(',')
        if url.strip()
    ]

    if merchant_code == 'EPAYTEST':
        defaults = ['https://rc.esewa.com.np', 'https://rc-epay.esewa.com.np']
    else:
        defaults = ['https://esewa.com.np', 'https://epay.esewa.com.np']

    candidates.extend(env_fallbacks)
    candidates.extend(defaults)

    deduped = []
    seen = set()
    for candidate in candidates:
        if candidate and candidate not in seen:
            seen.add(candidate)
            deduped.append(candidate)
    return deduped


def _esewa_ssl_context() -> ssl.SSLContext:
    verify_ssl = os.getenv('ESEWA_VERIFY_SSL', 'True').lower() in ('true', '1', 'yes')
    if verify_ssl:
        return ssl.create_default_context()
    return ssl._create_unverified_context()


def _fetch_json(url: str, timeout: int = 10) -> dict:
    with urlopen(url, timeout=timeout, context=_esewa_ssl_context()) as response:
        return json.loads(response.read().decode('utf-8'))


def _normalize_callback_payload(data_param: str) -> dict:
    normalized_data = str(data_param).strip().replace(' ', '+')
    padding = len(normalized_data) % 4
    if padding:
        normalized_data += '=' * (4 - padding)

    decoded = base64.b64decode(normalized_data).decode('utf-8')
    return json.loads(decoded)


class EsewaInitiatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        appointment_id = request.data.get('appointment_id')
        if not appointment_id:
            return Response(
                {'success': False, 'message': 'appointment_id is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            appointment = Appointment.objects.select_related('patient', 'hospital').get(id=appointment_id)
        except Appointment.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Appointment not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if appointment.patient_id != request.user.id:
            return Response(
                {'success': False, 'message': 'You can only pay for your own appointment'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if appointment.status == Appointment.Status.CANCELLED:
            return Response(
                {'success': False, 'message': 'Cannot pay for a cancelled appointment'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invoice, _ = Invoice.objects.get_or_create(
            appointment=appointment,
            patient=appointment.patient,
            hospital=appointment.hospital,
            defaults={
                'subtotal': appointment.consultation_fee,
                'tax': Decimal('0.00'),
                'discount': Decimal('0.00'),
                'total': appointment.consultation_fee,
                'status': Invoice.Status.PENDING,
                'items': [
                    {
                        'label': 'Consultation Fee',
                        'quantity': 1,
                        'unit_price': str(appointment.consultation_fee),
                        'total': str(appointment.consultation_fee),
                    }
                ],
            },
        )

        if invoice.status == Invoice.Status.PAID:
            return Response(
                {'success': False, 'message': 'This appointment is already paid'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        amount = invoice.total if invoice.total and invoice.total > 0 else appointment.consultation_fee
        payment = Payment.objects.create(
            invoice=invoice,
            amount=amount,
            gateway=Payment.Gateway.ESEWA,
            status=Payment.Status.INITIATED,
        )

        merchant_code = os.getenv('ESEWA_MERCHANT_CODE') or os.getenv('ESEWA_MERCHANT_ID', 'EPAYTEST')
        secret_key = os.getenv('ESEWA_SECRET_KEY', '8gBm/:&EnhH.1/q')
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        form_url, _ = _resolve_esewa_urls(merchant_code)

        if not form_url:
            return Response(
                {
                    'success': False,
                    'message': 'eSewa gateway is currently unavailable. Please try again shortly.',
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        total_amount = str(payment.amount)
        transaction_uuid = payment.transaction_id
        signed_field_names = 'total_amount,transaction_uuid,product_code'
        message = f'total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={merchant_code}'
        signature = base64.b64encode(
            hmac.new(secret_key.encode('utf-8'), message.encode('utf-8'), hashlib.sha256).digest()
        ).decode('utf-8')

        form_fields = {
            'amount': total_amount,
            'tax_amount': '0',
            'total_amount': total_amount,
            'transaction_uuid': transaction_uuid,
            'product_code': merchant_code,
            'product_service_charge': '0',
            'product_delivery_charge': '0',
            'success_url': f'{frontend_url}/payments/esewa/success?appointment_id={appointment.id}',
            'failure_url': f'{frontend_url}/payments/esewa/failure?appointment_id={appointment.id}',
            'signed_field_names': signed_field_names,
            'signature': signature,
        }

        return Response(
            {
                'success': True,
                'message': 'eSewa payment initiated',
                'data': {
                    'payment_id': payment.id,
                    'transaction_id': payment.transaction_id,
                    'payment_url': form_url,
                    'form_fields': form_fields,
                },
            }
        )


class EsewaVerifyPaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data_param = request.data.get('data')
        tx_uuid = request.data.get('transaction_uuid')
        total_amount = request.data.get('total_amount')
        product_code = request.data.get('product_code')
        transaction_code = ''

        if data_param:
            try:
                parsed = _normalize_callback_payload(data_param)
                tx_uuid = parsed.get('transaction_uuid') or tx_uuid
                total_amount = parsed.get('total_amount') or total_amount
                product_code = parsed.get('product_code') or product_code
                transaction_code = parsed.get('transaction_code', '')
            except Exception:
                return Response(
                    {'success': False, 'message': 'Invalid eSewa callback payload'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not tx_uuid or not total_amount:
            return Response(
                {'success': False, 'message': 'transaction_uuid and total_amount are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        merchant_code = product_code or os.getenv('ESEWA_MERCHANT_CODE') or os.getenv('ESEWA_MERCHANT_ID', 'EPAYTEST')
        _, status_base_url = _resolve_esewa_urls(merchant_code)

        try:
            payment = Payment.objects.select_related('invoice', 'invoice__appointment').get(
                transaction_id=tx_uuid,
                gateway=Payment.Gateway.ESEWA,
            )
        except Payment.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Payment transaction not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user.is_authenticated and payment.invoice.patient_id != request.user.id:
            return Response(
                {'success': False, 'message': 'You do not have access to this payment'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            expected_amount = Decimal(str(payment.amount)).quantize(Decimal('0.01'))
            callback_amount = Decimal(str(total_amount)).quantize(Decimal('0.01'))
            if callback_amount != expected_amount:
                return Response(
                    {'success': False, 'message': 'Amount mismatch in payment verification'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except (InvalidOperation, TypeError):
            return Response(
                {'success': False, 'message': 'Invalid amount format in callback'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        status_bases = _status_base_candidates(merchant_code, status_base_url)
        gateway_response = None
        last_error = None

        for base in status_bases:
            status_url = (
                f"{base}/api/epay/transaction/status/?"
                f"{urlencode({'product_code': merchant_code, 'total_amount': str(callback_amount), 'transaction_uuid': tx_uuid})}"
            )
            try:
                gateway_response = _fetch_json(status_url, timeout=10)
                break
            except Exception as exc:
                last_error = str(exc)

        if gateway_response is None:
            payment.status = Payment.Status.PENDING
            payment.save(update_fields=['status'])
            return Response(
                {
                    'success': False,
                    'message': 'Unable to verify payment with eSewa at the moment',
                    'details': {'attempted_hosts': status_bases, 'last_error': last_error},
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        gateway_status = str(gateway_response.get('status', '')).upper()
        payment.gateway_reference = transaction_code or gateway_response.get('ref_id', '')
        payment.gateway_response = gateway_response

        if gateway_status == 'COMPLETE':
            payment.status = Payment.Status.COMPLETED
            payment.completed_at = timezone.now()
            payment.save(update_fields=['status', 'completed_at', 'gateway_reference', 'gateway_response'])

            invoice = payment.invoice
            if invoice.status != Invoice.Status.PAID:
                invoice.status = Invoice.Status.PAID
                invoice.paid_at = timezone.now()
                invoice.save(update_fields=['status', 'paid_at'])

            appointment = invoice.appointment
            if appointment.status == Appointment.Status.PENDING:
                appointment.status = Appointment.Status.CONFIRMED
                appointment.save(update_fields=['status', 'updated_at'])

            ChatThread.objects.get_or_create(
                appointment=appointment,
                defaults={
                    'patient': appointment.patient,
                    'doctor': appointment.doctor.user,
                    'is_active': True,
                },
            )

            return Response(
                {
                    'success': True,
                    'message': 'Payment verified successfully',
                    'data': {
                        'payment_status': payment.status,
                        'appointment_status': appointment.status,
                        'reference_number': appointment.reference_number,
                        'gateway_status': gateway_status,
                    },
                }
            )

        if gateway_status in ('PENDING', 'NOT_FOUND'):
            payment.status = Payment.Status.PENDING
            payment.save(update_fields=['status', 'gateway_reference', 'gateway_response'])
            return Response(
                {
                    'success': False,
                    'message': 'Payment is not completed yet',
                    'data': {
                        'payment_status': payment.status,
                        'gateway_status': gateway_status,
                    },
                },
                status=status.HTTP_202_ACCEPTED,
            )

        payment.status = Payment.Status.FAILED
        payment.save(update_fields=['status', 'gateway_reference', 'gateway_response'])

        return Response(
            {
                'success': False,
                'message': 'Payment verification failed',
                'data': {
                    'payment_status': payment.status,
                    'gateway_status': gateway_status,
                },
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class MyPaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        payments = (
            Payment.objects.select_related('invoice', 'invoice__appointment', 'invoice__hospital')
            .filter(invoice__patient=request.user)
            .order_by('-created_at')
        )

        data = [
            {
                'id': payment.id,
                'transaction_id': payment.transaction_id,
                'gateway': payment.gateway,
                'status': payment.status,
                'amount': str(payment.amount),
                'created_at': payment.created_at,
                'completed_at': payment.completed_at,
                'invoice_number': payment.invoice.invoice_number,
                'appointment_reference': payment.invoice.appointment.reference_number,
                'hospital_name': payment.invoice.hospital.name,
                'appointment_date': payment.invoice.appointment.appointment_date,
            }
            for payment in payments
        ]

        return Response({'success': True, 'data': data, 'count': len(data)})


class HospitalPaymentHistoryView(APIView):
    permission_classes = [IsHospitalAdmin]

    def get(self, request):
        if not request.user.hospital_id:
            return Response(
                {'success': False, 'message': 'Hospital admin is not linked to a hospital'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payments = (
            Payment.objects.select_related('invoice', 'invoice__appointment', 'invoice__patient')
            .filter(invoice__hospital_id=request.user.hospital_id)
            .order_by('-created_at')
        )

        data = [
            {
                'id': payment.id,
                'transaction_id': payment.transaction_id,
                'gateway': payment.gateway,
                'status': payment.status,
                'amount': str(payment.amount),
                'created_at': payment.created_at,
                'completed_at': payment.completed_at,
                'invoice_number': payment.invoice.invoice_number,
                'appointment_reference': payment.invoice.appointment.reference_number,
                'appointment_date': payment.invoice.appointment.appointment_date,
                'patient_name': payment.invoice.patient.get_full_name(),
                'patient_email': payment.invoice.patient.email,
            }
            for payment in payments
        ]

        return Response({'success': True, 'data': data, 'count': len(data)})
