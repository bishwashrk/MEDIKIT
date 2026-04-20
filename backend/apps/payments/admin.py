from django.contrib import admin
from .models import Invoice, Payment


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'patient', 'hospital', 'total', 'status', 'issued_at']
    list_filter = ['status', 'hospital']
    search_fields = ['invoice_number', 'patient__email']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'invoice', 'amount', 'gateway', 'status', 'created_at']
    list_filter = ['status', 'gateway']
    search_fields = ['transaction_id']
