"""
Chat API views for doctor-patient messaging.
"""

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.appointments.models import Appointment

from .models import ChatThread, Message
from .serializers import ChatThreadDetailSerializer, ChatThreadListSerializer, MessageSerializer


class ChatRoleAccessMixin:
    def _validate_chat_role(self, request):
        if request.user.role not in ['doctor', 'patient']:
            return Response(
                {
                    'success': False,
                    'message': 'Only doctor and patient accounts can use chat.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        return None

    def _is_thread_participant(self, thread, user):
        return user.id in [thread.patient_id, thread.doctor_id]


class ChatThreadListView(ChatRoleAccessMixin, APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role_error = self._validate_chat_role(request)
        if role_error:
            return role_error

        queryset = ChatThread.objects.filter(is_active=True).select_related(
            'appointment', 'patient', 'doctor'
        )

        if request.user.role == 'doctor':
            queryset = queryset.filter(doctor=request.user)
        else:
            queryset = queryset.filter(patient=request.user)

        serializer = ChatThreadListSerializer(queryset.order_by('-updated_at'), many=True, context={'request': request})
        return Response({'success': True, 'data': serializer.data})


class StartChatThreadView(ChatRoleAccessMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role_error = self._validate_chat_role(request)
        if role_error:
            return role_error

        appointment_id = request.data.get('appointment_id')
        if not appointment_id:
            return Response(
                {'success': False, 'message': 'appointment_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            appointment_id = int(appointment_id)
        except (TypeError, ValueError):
            return Response(
                {'success': False, 'message': 'appointment_id must be a valid integer.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            appointment = Appointment.objects.select_related('doctor__user', 'patient').get(id=appointment_id)
        except Appointment.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Appointment not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        is_patient = request.user.id == appointment.patient_id
        if not is_patient:
            return Response(
                {
                    'success': False,
                    'message': 'Only the patient who booked this appointment can start chat.',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if appointment.status == Appointment.Status.CANCELLED:
            return Response(
                {
                    'success': False,
                    'message': 'Chat cannot be started for a cancelled appointment.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if appointment.status not in [Appointment.Status.CONFIRMED, Appointment.Status.COMPLETED]:
            return Response(
                {
                    'success': False,
                    'message': 'Chat is available only after payment is completed and appointment is confirmed.',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        thread, created = ChatThread.objects.get_or_create(
            appointment=appointment,
            defaults={
                'patient': appointment.patient,
                'doctor': appointment.doctor.user,
            },
        )

        serializer = ChatThreadDetailSerializer(thread, context={'request': request})
        return Response(
            {
                'success': True,
                'message': 'Chat thread created.' if created else 'Chat thread fetched.',
                'data': serializer.data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ThreadMessagesView(ChatRoleAccessMixin, APIView):
    permission_classes = [IsAuthenticated]

    def _get_thread(self, thread_id):
        return ChatThread.objects.select_related('appointment', 'patient', 'doctor').filter(id=thread_id, is_active=True).first()

    def get(self, request, thread_id):
        role_error = self._validate_chat_role(request)
        if role_error:
            return role_error

        thread = self._get_thread(thread_id)
        if not thread:
            return Response({'success': False, 'message': 'Chat thread not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._is_thread_participant(thread, request.user):
            return Response({'success': False, 'message': 'You do not have access to this chat.'}, status=status.HTTP_403_FORBIDDEN)

        Message.objects.filter(thread=thread, is_read=False).exclude(sender=request.user).update(
            is_read=True,
            read_at=timezone.now(),
        )

        messages = thread.messages.select_related('sender').all()
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response({'success': True, 'data': serializer.data})

    def post(self, request, thread_id):
        role_error = self._validate_chat_role(request)
        if role_error:
            return role_error

        thread = self._get_thread(thread_id)
        if not thread:
            return Response({'success': False, 'message': 'Chat thread not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._is_thread_participant(thread, request.user):
            return Response({'success': False, 'message': 'You do not have access to this chat.'}, status=status.HTTP_403_FORBIDDEN)

        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({'success': False, 'message': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(thread=thread, sender=request.user, content=content)
        thread.save(update_fields=['updated_at'])

        serializer = MessageSerializer(message, context={'request': request})
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_201_CREATED)


class MarkThreadReadView(ChatRoleAccessMixin, APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, thread_id):
        role_error = self._validate_chat_role(request)
        if role_error:
            return role_error

        thread = ChatThread.objects.filter(id=thread_id, is_active=True).first()
        if not thread:
            return Response({'success': False, 'message': 'Chat thread not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._is_thread_participant(thread, request.user):
            return Response({'success': False, 'message': 'You do not have access to this chat.'}, status=status.HTTP_403_FORBIDDEN)

        updated = Message.objects.filter(thread=thread, is_read=False).exclude(sender=request.user).update(
            is_read=True,
            read_at=timezone.now(),
        )

        return Response({'success': True, 'data': {'updated': updated}})
