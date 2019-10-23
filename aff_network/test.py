from models import Task, Offer, MessageQueue
from constants import *
from sqlalchemy import and_, or_
import requests

ADV_DEPOSIT_URL = 'http://127.0.0.1:5000/balance/create/transactions/deposit'

ADV_TX_PAID_URL = 'http://127.0.0.1:5000/balance/update/transactions/paid'

def fill_adv_account(username, amount):
    data = [
    {
        'username': username,
        'amount': amount
    }]
    requests.post(ADV_DEPOSIT_URL, json=data)

def tx_paid():
    requests.post(ADV_TX_PAID_URL, json='[1,2,3,4]')

tx_paid()
# fill_adv_account('advert', 10.5)