from handlers_init import *
import traceback
from global_celery_instances import celery 
from models import Task, Transaction, User
from global_web_instances import app, db
from sqlalchemy import and_, or_
from constants import *


@celery.task
def emit_message_queue_create():
    from task_worker import TaskWorker
    try:
        task_worker = TaskWorker.getInstance()
        task_worker.message_queue_create()

        app.logger.info("emit_message_queue_create")
    except Exception as e:
        app.logger.info("emit_message_queue_create EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True
     

@celery.task
def emit_task_delete():
    from task_worker import TaskWorker
    try:
        task_worker = TaskWorker.getInstance()
        task_worker.task_delete()

        app.logger.info("emit_task_delete")
    except Exception as e:
        app.logger.info("emit_task_delete EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True


@celery.task
def emit_post_messages():
    from task_worker import TaskWorker
    try:
        task_worker = TaskWorker.getInstance()
        task_worker.post_messages()

        app.logger.info("emit_post_messages")
    except Exception as e:
        app.logger.info("emit_post_messages EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True


@celery.task
def emit_deactivate_activity(adv_id):
    from task_worker import TaskWorker
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


@celery.task
def emit_handle_paid_transaction():
    try:     
        transactions = Transaction.query.filter( and_(Transaction.transactionType==TRANSACTION_TYPE['DEPOSIT'], Transaction.transactionStatus==TRANSACTION_STATUS['HANDLED']) ).all()

        for t in transactions:
            try:
                user = User.query.filter_by(username=t.advId).first()
                user.replenish_balance(t.adv_amount)
                t.paid()

                # activate all activity if balance > 0
                if user.balance > 0:
                    taskWorker = TaskWorker.getInstance()
                    taskWorker.activate_adv_activity(user.id)
            except:
                pass

        db.session.commit()

        app.logger.info("emit_create_transaction")
    except Exception as e:
        app.logger.info("emit_handle_paid_transaction EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True


@celery.task
def emit_track_subscribe():
    from action_worker import ActionWorker
    try:
        action_worker = ActionWorker.getInstance()
        action_worker.update_subscribers_list()

        app.logger.info("emit_track_subscribe")
    except Exception as e:
        app.logger.info("emit_track_subscribe EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True


# Need to create periodic tasks, that will start periodicaly
# link to example: https://github.com/borosuman/flask-celery-periodic-task/blob/master/app.py
# NOT HERE, but to the place where celery configured
@celery.task(name="parse_subscribers")
def parse_subscribers():
    
    app.logger.info("--------------------Hello! from periodic task-------------------")


