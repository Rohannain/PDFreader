from django.db import models

class DocumentVector(models.Model):
    key = models.CharField(max_length=255, null=False)
    content = models.TextField(null=False)
    vector = models.JSONField(null=False)  # Assuming vector is stored as JSON in Django
    filename = models.TextField(null=False)
    page_number = models.IntegerField(null=False)



