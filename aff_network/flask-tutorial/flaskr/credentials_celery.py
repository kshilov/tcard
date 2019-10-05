CELERY_BROKER = 'amqp://guest:guest@localhost:5672//'

BROKER_TRANSPORT_OPTIONS = {"max_retries": 3, "interval_start": 0, "interval_step": 0.2, "interval_max": 0.5}
