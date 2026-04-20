from django.contrib import admin
from .models import ChatThread, Message


@admin.register(ChatThread)
class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ['appointment', 'patient', 'doctor', 'is_active', 'created_at']
    list_filter = ['is_active']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['thread', 'sender', 'is_read', 'created_at']
    list_filter = ['is_read']
