from credentials_celery import *
from celery import Celery
from global_web_instances import app

def make_celery(app):
    celery = Celery(app.name, 
                    broker=CELERY_BROKER,
                    )
    
#    celery.conf.update(app.config)
    TaskBase = celery.Task

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask

    return celery

global celery
celery = make_celery(app)