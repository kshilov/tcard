@app.route("/action", methods=['GET', 'POST'])
def action():
    task_id = request.args.get('task_id')
    user_tg_id = request.args.get('user_id')

    task = Task.query.filter_by(id=task_id).first()

    actionWorker = ActionWorker.getInstance()

    link = actionWorker.action_create(task, user_tg_id)


    return redirect(url_for('link'))


Метод ActionWorker.
// return link to redirect
def create_transaction(self, task, user_tg_id):
    balance_worker = BalanceWorker.getInstance()
    offer = task.offer

    link = task.offer.tgLink

    transactionType = TRANSACTION_TYPE['WITHDRAW']
    actionType = OFFER_TYPE['CLICK']
    allow_track = True

    if offer.offerType == 'subscribe':
        actionType = OFFER_TYPE['PRESUBSCRIBE']
    else:
        allow_track = balance_worker.track_action(offer.price)


    if not allow_track or offer.status == OFFER_STATUS['INACTIVE']:
        return self.default_redirect_link 

    Transaction.create_transaction(task, user_tg_id, transactionType, actionType)

    return link



class Transaction(db.Model):
    ....
    ....
    @classmethod
    def create_transaction(cls, task, transaction_time, userTgId, transactionType, actionType):
        transaction = cls()

        .... логика

        transaction.__commit()
        return transaction
   
        
