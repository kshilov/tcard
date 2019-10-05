from models import TaskQueue
from models import Task
from constants import *

class TaskWorker():
    __instance = None

    @staticmethod 
    def getInstance():
        """ Static access method. """
        if TaskWorker.__instance == None:
            TaskWorker()

        return TaskWorker.__instance
    
    def __init__(self):
        if TaskWorker.__instance != None:
            raise Exception("This class is a singleton!")
        else:
            TaskWorker.__instance = self

    def task_create(self, offerId):
        tasks = Task(status='upproved', affilId=current_user.id, offerId=offerId)

        return task

    def message_queue_create(self):
        tasks = Task.query.filter(
                Task.status == TASK_STATUS['APPROVED']
        ).limit(30).all()

        for task in tasks:
            message_queue = MessageQueue(taskId=task.id, status='NEW', time=getTime)
            #message_queue.add(task)
            task.change_status(TASK_STATUS['HANDLED'])

        #return 0

    def getTime():
        return app.config.postTime

    def task_execute(self):
        pass

#--------------------------------

    def post_message(self):
        message_queues = MessageQueue.query.filter(
                MessageQueue.status == MessageQueue_STATUS['NEW']
        ).limit(30).all()
        for message_queue in message_queues:
            task = Task.query.filter_by(id=message_queue.taskId).first()          
            offer = Offer.query.filter_by(id=task.offerId).first() 
            link = offer.tgLink
            message = task.previevText + link

            #telegram.api : send_mesage(task.affilId, message)

            message_queue.change_status(TASK_STATUS['PUBLISHED'])







