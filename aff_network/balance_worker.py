from models import User, Transaction
from constants import *
from sqlalchemy import and_, or_, func
from flask_login import current_user
from global_web_instances import app


class BalanceWorker():
    __instance = None

    @classmethod 
    def getInstance(cls):
        """ Static access method. """
        if BalanceWorker.__instance == None:
            BalanceWorker()

        return BalanceWorker.__instance
    
    def __init__(self):
        if BalanceWorker.__instance != None:
            raise Exception("This class is a singleton!")
        else:
            BalanceWorker.__instance = self

    # depricated
    def get_balance(self, user_id):
        if current_user.status == 'ADVERTISER':
            Transaction.query(func.sum(adv_amount).label('adv_sum')).filter(advId=user_id)
            return adv_sum
        elif current_user.status == 'AFFILIATE':
            Transaction.query(func.sum(aff_amount).label('aff_sum')).filter(affId=user_id)
            return aff_sum
        return 0

    
    def check_balance(self, user_id):
        user = User.query.filter_by(id=user_id).first()
        if user.balance <= 0 and user.role == 'ADVERTISER':
            try:
                emit_deactivate_activity.apply_async(args=[user_id])
            except Exception as e:
                app.logger.info("action emit_create_transaction.apply_async:%s" % str(e))
            return False
        else:
            return True


