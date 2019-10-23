from handlers_init import *
import traceback
from global_celery_instances import celery 
from models import Task, Transaction, User
from global_web_instances import app, db
from sqlalchemy import and_, or_
from constants import *


@celery.task
def emit_message_queue_create():
    try:
        task_worker = TaskWorker.getInstance()
        task_worker.message_queue_create()

        app.logger.info("emit_message_queue_create")
    except Exception as e:
        app.logger.info("emit_message_queue_create EXCEPTION traceback: {0}".format(traceback.format_exc()))

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


@celery.task
def emit_handle_paid_transaction():
    try:     
        transactions = Transaction.query.filter( and_(Transaction.transactionType==TRANSACTION_TYPE['DEPOSIT'], Transaction.transactionStatus==TRANSACTION_STATUS['HANDLED']) ).all()

        for t in transactions:
            user = User.query.filter_by(username=t.advId).first()
            user.replenish_balance(t.adv_amount)

            # activate all activity if balance > 0
            if user.balance > 0:
                taskWorker = TaskWorker.getInstance()
                taskWorker.activate_adv_activity(user.id)

        Transaction.query.filter( and_(Transaction.transactionType==TRANSACTION_TYPE['DEPOSIT'], Transaction.transactionStatus==TRANSACTION_STATUS['HANDLED']) ).update({'transactionStatus': TRANSACTION_STATUS['PAID']})
        db.session.commit()

        app.logger.info("emit_create_transaction")
    except Exception as e:
        app.logger.info("emit_handle_paid_transaction EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True


@celery.task
def emit_track_subscribe():
    try:
        #balance_worker = BalanceWorker.getInstance()
        transactions = Transaction.query.filter_by(actionType=OFFER_TYPE['PRESUBSCRIBE']).all()

        for t in transactions:
            task = t.task
            if track_subscriber(t.id, task, t.userTgId):
                if local_check_balance(task.offer.advertId, task.offer.price):
                    local_check_balance(task.affilId, task.offer.price)

                    t.update({'actionType': OFFER_TYPE['SUBSCRIBE']}, {'transactionStatus': TRANSACTION_STATUS['HANDLED']})
                    #t.update({'transactionStatus': TRANSACTION_STATUS['HANDLED']})

        db.session.commit()

        app.logger.info("emit_track_subscribe")
    except Exception as e:
        app.logger.info("emit_track_subscribe EXCEPTION traceback: {0}".format(traceback.format_exc()))

    return True


def track_subscriber(self, transaction_id, task, user_tg_id):
    client = TelegramClient(CURRENT_SESSION_NAME, API_ID, API_HASH).start()

    # get all channels that I can access
    channels = {d.entity.username: d.entity
               for d in client.get_dialogs()
               if d.is_channel}

    # channel_name = 'TestChannel12358' # test
    channel_name = task.offer.tgLink
    # choose the one that I want list users from
    channel = channels[channel_name]

    # get all users
    for user in client.get_participants(channel):
       # print(user.id, user.first_name, user.last_name, user.username)
       if user.id == user_tg_id:
           return True
    return False


def local_check_balance(user_id):
    user = User.query.filter_by(id=user_id).first()
    if user.balance <= 0 and user.role == 'ADVERTISER':
        try:
            emit_deactivate_activity.apply_async(args=[user_id])
        except Exception as e:
            app.logger.info("action emit_deactivate_activity.apply_async:%s" % str(e))
        return False
    else:
        return True
