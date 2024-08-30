from django.apps import AppConfig


class InterfaceConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "interface"

    def ready(self):
        # Import signals or perform other initialization tasks here
        pass