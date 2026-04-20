"""
URL routes for chat (MVP stub)
"""

from django.urls import path
from .views import (
    ChatThreadListView,
    StartChatThreadView,
    ThreadMessagesView,
    MarkThreadReadView,
)

app_name = 'chat'

urlpatterns = [
    path('threads/', ChatThreadListView.as_view(), name='thread-list'),
    path('threads/start/', StartChatThreadView.as_view(), name='thread-start'),
    path('threads/<int:thread_id>/messages/', ThreadMessagesView.as_view(), name='thread-messages'),
    path('threads/<int:thread_id>/mark-read/', MarkThreadReadView.as_view(), name='thread-mark-read'),
]
