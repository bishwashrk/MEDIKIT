"""
Utility functions for accounts app
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response


def custom_exception_handler(exc, context):
    """
    Custom exception handler that returns consistent error responses.
    """
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response = {
            'success': False,
            'message': 'An error occurred',
            'errors': {}
        }
        
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                custom_response['message'] = str(response.data['detail'])
            else:
                custom_response['errors'] = response.data
                # Try to create a summary message
                first_error = next(iter(response.data.values()), None)
                if isinstance(first_error, list) and first_error:
                    custom_response['message'] = str(first_error[0])
                elif first_error:
                    custom_response['message'] = str(first_error)
        elif isinstance(response.data, list):
            custom_response['message'] = str(response.data[0]) if response.data else 'Error'
        else:
            custom_response['message'] = str(response.data)
        
        response.data = custom_response
    
    return response
