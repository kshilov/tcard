from flask import render_template, url_for, flash, redirect, request
from global_web_instances import app, db, bcrypt
from models import *
from flask_login import login_user, current_user, logout_user, login_required
from forms import *
from global_web_instances import app, db, bcrypt
import flask
from celery_handlers import *

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
        user = User(username=form.username.data, password=hashed_password, role=form.role.data, status='active')
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
    form = AddChannelForm()
    channel = Channel(tgUrl=form.tgUrl.data, status='active', partnerId=current_user.id)
    if form.validate_on_submit():
        db.session.add(channel)
        db.session.commit()
        flash('Channel added', 'success')
        return redirect(url_for('channel'))
    
    return render_template('channel.html', title='Channel', form=form)


@app.route("/offer", methods=['GET', 'POST'])
@login_required
def offer():
    # to create a List of existing categories to choose one
    formCategories = [(g.id, g.title) for g in Category.query.all()]
    form = CreateOfferForm()
    form.categoryListAdv.choices = formCategories

    price = 5

    if form.validate_on_submit():
        offer = Offer(tgLink=form.tgLink.data, offerType=form.offerType.data, price=price, status='inactive', advertId=current_user.id)
        categoryListAdv = CategoryListAdv(categoryListType=form.categoryListType.data)
        db.session.add(offer)
        db.session.commit()
        flash('Offer created', 'success')
        return redirect(url_for('channel'))
    return render_template('offer.html', title='Offer', form=form)


@app.route("/category", methods=['GET', 'POST'])
@login_required
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

@app.route("/task/approve", methods=['GET', 'POST'])
@login_required
#@moderator_only
def task_approve():
    pass

    # change status in Tasks table

    try:
        emit_task_create.apply_async()
    except Exception as e:
        app.logger.info("task_approve emit_task_create.apply_async:%s" % str(e))
        # Sorry something went wrong
        # rollback status of a task
        

