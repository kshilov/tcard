from models import Task, Offer, MessageQueue
from constants import *
from sqlalchemy import and_, or_
from global_web_instances import app, db

import telebot

bot = telebot.TeleBot(BOT_TOKEN)

class TaskWorker():
    __instance = None

    @classmethod 
    def getInstance(cls):
        """ Static access method. """
        if TaskWorker.__instance == None:
            TaskWorker()

        return TaskWorker.__instance
    
    def __init__(self):
        if TaskWorker.__instance != None:
            raise Exception("This class is a singleton!")
        else:
            TaskWorker.__instance = self

    def message_queue_create(self):
        # AUTOMATIC TASKS
        tasks = Task.query.filter( and_(
                Task.status == TASK_STATUS['APPROVED'],
                Task.taskType == TASK_TYPE['AUTOMATIC']
        )
        ).limit(30).all()

        for task in tasks:
            message_queue = MessageQueue()

            message_queue.create_message(task, postTime)

            task.change_status(TASK_STATUS['QUEUED'])

        # MANUAL TASKS
        #tasks_manual = Task.query.filter( and_(
        #        Task.status == TASK_STATUS['APPROVED'],
        #        Task.taskType == TASK_TYPE['MANUAL']
        #)
        #).limit(30).all()

        #for task in tasks_manual:
            #task.change_status(TASK_STATUS['SENDED'])
            # send link in private chat to MANUAL publishing
            # NOTIFICATION_WORKER
            #bot.send_message(task.user.username, botLink, 1)

    # depricated (in Kirill code?)
    def post_messages(self):
        message_queues = MessageQueue.query.filter(
                MessageQueue.status == MESSAGE_STATUS['NEW']
        ).limit(30).all()

        for message_queue in message_queues:
            task = message_queue.task
            offer = task.offer
            # link in private chat with Bot
            link = botLink

            message = task.previevText + link

            # send msg in all channels
            channels = Channel.query.filter(and_(partnerId=task.affilId, status='ACTIVE')).all()
            for channel in channels: 
                if channel.categoryListAff.category.id == task.offer.categoryListAdv.category.id:
                    chatId = -1001321811797 # test
                    #chatId = channel.tgUrl
                    bot.send_message(chatId, message, 1)

            message_queue.change_status(MESSAGE_STATUS['PUBLISHED'])
 

    def deactivate_adv_activity(self, adv):
        Offer.query.filter_by(advertId=adv).update({'status': 'INACTIVE'})
        offers = Offer.query.filter_by(advertId=adv).all()

        for offer in offers:
            Task.query.filter_by(offerId=offer.id).update({'status': TASK_STATUS['PAUSED']})
            tasks = Task.query.filter_by(offerId=offer.id).all()
        
            for task in tasks:
                MessageQueue.query.filter_by(taskId=task.id).update({'status': MESSAGE_STATUS['DEACTIVATED']})
            
        db.session.commit()


    def activate_adv_activity(self, adv):
        Offer.query.filter_by(advertId=adv).update({'status': 'ACTIVE'})
        offers = Offer.query.filter_by(advertId=adv).all()

        for offer in offers:
            Task.query.filter_by(offerId=offer.id).update({'status': TASK_STATUS['QUEUED']})
            tasks = Task.query.filter_by(offerId=offer.id).all()
        
            for task in tasks:
                MessageQueue.query.filter_by(taskId=task.id).update({'status': MESSAGE_STATUS['NEW']})
            
        db.session.commit()
