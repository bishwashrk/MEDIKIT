"""
Payment and Invoice models (MVP)
"""

from django.db import models
from django.conf import settings
import uuid


class Invoice(models.Model):
    """
    Invoice for appointment/consultation.
    """
    
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        PENDING = 'pending', 'Pending Payment'
        PAID = 'paid', 'Paid'
        CANCELLED = 'cancelled', 'Cancelled'
        REFUNDED = 'refunded', 'Refunded'
    
    invoice_number = models.CharField(max_length=50, unique=True, editable=False)
    
    appointment = models.ForeignKey(
        'appointments.Appointment',
        on_delete=models.CASCADE,
        related_name='invoices'
    )
    patient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='invoices'
    )
    hospital = models.ForeignKey(
        'hospitals.Hospital',
        on_delete=models.CASCADE,
        related_name='invoices'
    )
    
    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Line items as JSON
    items = models.JSONField(
        default=list,
        help_text='Invoice line items'
    )
    
    notes = models.TextField(blank=True)
    
    # Timestamps
    issued_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-issued_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number}"
    
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            from datetime import datetime
            date_part = datetime.now().strftime('%Y%m%d')
            count = Invoice.objects.filter(
                invoice_number__startswith=f'INV-{date_part}'
            ).count() + 1
            self.invoice_number = f'INV-{date_part}-{count:04d}'
        super().save(*args, **kwargs)


class Payment(models.Model):
    """
    Payment record with gateway integration placeholder.
    """
    
    class Gateway(models.TextChoices):
        ESEWA = 'esewa', 'eSewa'
        KHALTI = 'khalti', 'Khalti'
        CASH = 'cash', 'Cash'
        CARD = 'card', 'Card'
    
    class Status(models.TextChoices):
        INITIATED = 'initiated', 'Initiated'
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'
    
    transaction_id = models.CharField(max_length=100, unique=True, editable=False)
    
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    gateway = models.CharField(max_length=20, choices=Gateway.choices)
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.INITIATED
    )
    
    # Gateway response data
    gateway_reference = models.CharField(max_length=255, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.transaction_id}"
    
    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = str(uuid.uuid4()).replace('-', '')[:16].upper()
        super().save(*args, **kwargs)
