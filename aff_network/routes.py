from flask import render_template, url_for, flash, redirect, request
from global_web_instances import app, db, bcrypt
from models import *
from flask_login import login_user, current_user, logout_user, login_required
from forms import *
from global_web_instances import app, db, bcrypt
import flask
from celery_handlers import *
from constants import *
from balance_worker import *

@app.route("/")

@app.route("/about")
def about():
    return render_template('about.html', title='About')


@app.route("/register", methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('account'))
    form = RegistrationForm()
    if form.validate_on_submit():
        hashed_password = bcrypt.generate_password_hash(form.password.data).decode('utf-8')
        # how does it work with jinja2?
        #user = User(username=form.username.data, password=hashed_password, role=ROLE[form.role.data], status=USER_STATUS['ACTIVE'])
        user = User(username=form.username.data, password=hashed_password, role=form.role.data, status='ACTIVE')
        db.session.add(user)
        db.session.commit()
        flash('Your account has been created! You are now able to log in', 'success')
        return redirect(url_for('login'))
    return render_template('register.html', title='Register', form=form)


@app.route("/login", methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('account'))
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and bcrypt.check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('account'))
        else:
            flash('Login Unsuccessful. Please check username and password', 'danger')
    return render_template('login.html', title='Login', form=form)


@app.route("/logout")
def logout():
    logout_user()
    return redirect(url_for('login'))


@app.route("/account", methods=['GET', 'POST'])
@login_required
def account():
    form = ChangePassForm()
    if form.validate_on_submit():
        user = current_user
        if user and bcrypt.check_password_hash(user.password, form.passwordOld.data):
        
            user.change_password(form.passwordNew.data)

            flash('Password changed', 'success')
            return redirect(url_for('login'))
        else:
            flash('Change Unsuccessful. Please check your old password', 'danger')
    return render_template('account.html', title='Account', form=form)

@app.route("/channel", methods=['GET', 'POST'])
@login_required
def channel():
# to create a List of existing categories to choose one by Affiliate
    formCategories = [(g.id, g.title) for g in Category.query.all()]
    form = AddChannelForm()
    form.categoryListAff.choices = formCategories

    if form.validate_on_submit():
        channel = Channel(tgUrl=form.tgUrl.data, status='active', partnerId=current_user.id)
        if channel:
            db.session.add(channel)
            db.session.commit()
        else:
            flash('Please check Telegram URL', 'danger')
        categoryListAff = CategoryListAff(categoryListType=form.categoryListAff.data, categoryId=form.categoryListAff.data, channelId=channel.id)
        if categoryListAff:
            db.session.add(categoryListAff)
            db.session.commit()
            flash('Channel added', 'success')
            return redirect(url_for('channel'))
        else:
            flash('Please check Telegram URL', 'danger')
    
    return render_template('channel.html', title='Channel', form=form)


@app.route("/offer", methods=['GET', 'POST'])
@login_required
def offer():
# to create a List of existing categories to choose one by Advertiser
    formCategories = [(g.id, g.title) for g in Category.query.all()]
    form = CreateOfferForm()
    form.categoryListAdv.choices = formCategories
    #Category.query.filter_by(id=offer.categoryList.categoryId).first().title
    price = 5

    if form.validate_on_submit():
        offer = Offer(tgLink=form.tgLink.data, offerType=form.offerType.data, price=price, status='ACTIVE', advertId=current_user.id)
        if offer:
            db.session.add(offer)
            db.session.commit()
        else:
            flash('Please check Telegram URL', 'danger')
        categoryListAdv = CategoryListAdv(categoryListType=form.categoryListAdv.data, categoryId=form.categoryListAdv.data, offerId=offer.id)
        if categoryListAdv:
            db.session.add(categoryListAdv)
            db.session.commit()
            flash('Offer created', 'success')
            return redirect(url_for('offer'))
        else:
            flash('Please check Telegram URL', 'danger')
    return render_template('offer.html', title='Offer', form=form)


@app.route("/offerList", methods=['GET', 'POST'])
@login_required
#@aff
def offerList():
    #offers = Offer.query.filter_by(categoryListAdv[0].categoryId=current_user.channels.categoryList[0].categoryId).all()
    offersAll = Offer.query.filter_by(status='ACTIVE').all()
    offers = list()
    for offer in offersAll:
        categoryAdv = offer.categoryListAdv
        channelsAff = current_user.channels
        for channel in channelsAff:
            categoryAff = channel.categoryListAff
            if categoryAff[0].categoryId == categoryAdv[0].categoryId:
                offers.append(offer)
    form = CreateOfferListForm()
    #print('This is standard output', file=sys.stdout)
    if form.validate_on_submit():
        offer_id = request.args.get('offer_id')
        #offer_id = 2 # test
        task = Task(taskType=form.taskType.data, previevText=form.previevText.data, affilId=current_user.id, offerId=offer_id)
        if task:
            db.session.add(task)
            db.session.commit()
            flash('Offer accepted', 'success')
            return redirect(url_for('offerList'))
        else:
            flash('Offer error', 'danger')
    return render_template('offerList.html', title='OfferList', form=form, offers=offers)


@app.route("/category", methods=['GET', 'POST'])
@login_required
#@moderator
def category():
    form = AddCategoryForm()
    allCategories = Category.query.all()
    #allCategories = Category.query.filter_by()
    if form.validate_on_submit():
        category = Category(title=form.title.data)
        #if category:
        db.session.add(category)
        db.session.commit()
        flash('Category added', 'success')
        return redirect(url_for('category'))
        #else: flash('Category already exist', 'danger')
    return render_template('category.html', title='Category', form=form, allCategories=allCategories)

@app.route("/taskCheck", methods=['GET', 'POST'])
@login_required
#@moderator_only
def taskCheck():
    tasks = Task.query.filter_by(status=TASK_STATUS['NEW']).all()
    form = TaskCheckForm()
    if form.validate_on_submit():
        #task_id = request.args.get('task_id')
        task_id = 1 # test
        task = Task.query.filter_by(id=task_id).first()
        task.change_status(TASK_STATUS['APPROVED'])

        # gde eto vizivat'?
        taskWorker = TaskWorker()
        taskWorker.getInstance()
        taskWorker.message_queue_create()
        taskWorker.post_messages()

        flash('Task accepted', 'success')
        return redirect(url_for('taskCheck'))
    return render_template('taskCheck.html', title='TaskCheck', form=form, tasks=tasks)
    # change status in Tasks table****

    try:
        emit_task_create.apply_async()
    except Exception as e:
        app.logger.info("task_approve emit_task_create.apply_async:%s" % str(e))
        # Sorry something went wrong
        # rollback status of a task
        

@app.route("/action", methods=['GET', 'POST'])
def action():
    task_id = request.args.get('task_id')
    user_id = request.args.get('user_id')

    transactionType = TRANSACTION_TYPE['WITHDROW']
    actionType = OFFER_TYPE['CLICK']

    # maybe add here service to short tgLink
    link = Task.query.filter_by(id=task_id).first().offer.tgLink

    # celery
    actionWorker = ActionWorker()
    actionWorker.getInstance()
    actionWorker.action_create(task_id, user_id, transactionType, actionType)

    return redirect(url_for('link'))


@app.route("/transactions", methods=['GET', 'POST'])
@login_required
def transactions():
    balanceWorker = BalanceWorker()
    balanceWorker.getInstance()
    balance = balanceWorker.get_balance(current_user.id)
    if current_user.status == 'ADVERTISER':
        transactions = Transaction.query().filter_by(advId=g.id).limit(30).all()
    elif current_user.status == 'AFFILIATE':
        transactions = Transaction.query().filter_by(affId=g.id).limit(30).all()
    else:
        transactions = Transaction.query().limit(30).all()

    return render_template('transactions.html', title='Transactions', form=form, balance=balance, transactions=transactions)


