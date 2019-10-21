import traceback
from global_celery_instances import celery 
from task_worker import TaskWorker
from models import Task

@celery.task
def emit_message_queue_create():
    try:
        task_worker = TaskWorker.getInstance()
        task_worker.message_queue_create()

        app.logger.info("emit_taskWorker_create")
    except Exception as e:
        app.logger.info("emit_taskWorker_create EXCEPTION traceback: {0}".format(traceback.format_exc()))

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
def emit_post_messages():
    try:
        task_worker = TaskWorker.getInstance()
        task_worker.post_messages()

        app.logger.info("emit_post_message")
    except Exception as e:
        app.logger.info("emit_post_message EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True


@celery.task
def emit_deactivate_activity(adv_id):
    try:
        taskWorker = TaskWorker.getInstance()
        taskWorker.deactivate_adv_activity(adv_id)

        app.logger.info("emit_deactivate_activity")
    except Exception as e:
        app.logger.info("emit_deactivate_activity EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True


@celery.task
def emit_create_transaction(task_id, user_tg_id, transactionType, actionType, transactionStatus, price):
    try:
        task = Task.query.filter_by(id=task_id).first()
        Transaction.create_transaction(task, user_tg_id, transactionType, actionType, transactionStatus, price)

        app.logger.info("emit_create_transaction")
    except Exception as e:
        app.logger.info("emit_create_transaction EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True
