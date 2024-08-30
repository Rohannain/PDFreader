from django.urls import path
from . import views

urlpatterns = [
    path('api/store-documents/', views.store_documents_view, name='store_documents_view'),
    path('api/verify-key/', views.verify_key, name='verify_key'),
]