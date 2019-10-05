import traceback
from global_celery_instances import celery 
from task_worker import TaskWorker

@celery.task
def emit_task_create():
    try:
        task_worker = TaskWorker.getInstance()
        task_worker.message_queue_create()

        app.logger.info("emit_task_create")
    except Exception as e:
        app.logger.info("emit_task_worker EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True
     
@celery.task
def emit_task_execute():
    try:
        task_worker = TaskWorker.getInstance()
        task_worker.task_execute()

        app.logger.info("emit_task_execute")
    except Exception as e:
        app.logger.info("emit_task_execute EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True
     

@celery.task
def emit_task_delete():
    try:
        task_worker = TaskWorker.getInstance()
        task_worker.task_delete()

        app.logger.info("emit_task_delete")
    except Exception as e:
        app.logger.info("emit_task_delete EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True

@celery.task
def emit_post_message():
    try:
        task_worker = TaskWorker.getInstance()
        task_worker.post_message()

        app.logger.info("emit_post_message")
    except Exception as e:
        app.logger.info("emit_post_message EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True
