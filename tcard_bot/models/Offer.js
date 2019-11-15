'use strict';
const Markup = require('telegraf/markup')
const extra = require('telegraf/extra')

const logger = require('../helpers/logger')

const {i18n} = require('../middlewares/i18n')

const {OFFER_TYPE, OFFER_STATUS, OFFER_CODES} = require("../helpers/constants");
const {BOT_URL_PREFIX, APPLY_BUTTON_PREFIX} = require("../helpers/constants");

/*
The core difference is the type of an offer:
0 - finished when the number of users are ready
1 - finished when the total amount are collected (f.e. here you can buy by slots)

data - we use this field to store fields of an offer. Different views know how to show it.
*/

let db = null
module.exports = function(sequelize, DataTypes) {
	var Offer = sequelize.define('Offer', {
		id: {
			type: DataTypes.INTEGER,
			allowNull: false,
			primaryKey: true,
			autoIncrement: true
		},
		private_title: {
            type: DataTypes.STRING,
			allowNull: true,
		},
		status : {
			type: DataTypes.INTEGER,
			allowNull: true
        },
        type : {
			type: DataTypes.INTEGER,
			allowNull: true
        },
        total : {
            type: DataTypes.INTEGER,
			allowNull: false 
        },
        current : {
            type: DataTypes.INTEGER,
			allowNull: true
		},
		start_amount : {
            type: DataTypes.INTEGER,
			allowNull: true 
		},
		url : {
            type: DataTypes.STRING,
			allowNull: true,
		},
		bot_name : {
            type: DataTypes.STRING,
			allowNull: true,
		},
		due_date : {
			type: DataTypes.DATE,
			allowNull: true
		},
		published_to : {
            type: DataTypes.TEXT,
			allowNull: true,
		},
        data : {
            type: DataTypes.TEXT,
			allowNull: true,        
        }
	}, {
		timestamps: true,
		schema: 'public'
	});
	
	Offer.associate = function(models) {
		Offer.belongsTo(models.User);
		Offer.hasMany(models.OfferParticipantsQueue);

		db = models;
	};

	Offer.get_offer = async function(offer_id){
		var offer = await db.Offer.findOne({
			where : {
				id : offer_id
			}
		})
		return offer;
	}

	Offer._serialize_offers = function(offers){
		var arr = []
        offers.forEach(element => {
			arr.push({id: element.id, 
				privateTitle: element.private_title, 
				user_id: element.UserId})
        });
		
		return arr;
	}

	Offer.status_update = async function(user_id){
		var data = {}

		var offers = await db.Offer.findAll({
			where : {
				status : {
					[db.Sequelize.Op.in] : [OFFER_STATUS.updated, OFFER_STATUS.finished]
				},
				UserId : user_id,
				type: OFFER_TYPE.button
			}
		})

		var arr = db.Offer._serialize_offers(offers)
	
		if(arr.length > 0){
			data['offer_list'] = arr;
		}
		return data;

	}

	Offer.all_offers = async function(){
		var offers = await db.Offer.findAll({
			where : {
				type: OFFER_TYPE.button
			}
		})

		var arr = db.Offer._serialize_offers(offers)

		if(arr.length > 0){
			data['offer_list'] = arr;
		}
		return data;

	}

	Offer.offers_for = async function(user_tg_id){
		var current_user = await db.User.get_user(user_tg_id);
		var data = {};

		if (!current_user){
			return data;
		}

		var offers = await db.Offer.findAll({
			where : {
				UserId : current_user.id,
				type: OFFER_TYPE.button
			}
		})

		var arr = db.Offer._serialize_offers(offers)

		if(arr.length > 0){
			data['offer_list'] = arr;
		}
		return data;

	}
	
	Offer.new_offer = async function(user_tg_id, data){
		let offer;

		try {
			var current_user = await db.User.get_user(user_tg_id)
			if (!current_user){
				throw("There is no such user")
			}

			offer = await Offer.create(
				{
					type : OFFER_TYPE.button,
					status: OFFER_STATUS.new,
					private_title: data.privateTitle,
					current: 0,
					total : data['amount'],
					start_amount : 0,
					UserId : current_user.id,
					data : JSON.stringify(data)
				}
			)
		}catch(error){
			logger.error("Offer.new_offer: Can't create offer %s", error)
			return -1;
		}

		return offer;
	}


	Offer.prototype.get_questions_list = async function(){
		var data = await this.get_data()

		return data['questions_list']
	}

	Offer.prototype.get_message_source = async function(post_link){

		var parts = post_link.split('/')

		// for public channel: [ 'https:', '', 't.me', 'hahachannelhaha', '3' ]
		// for private channel: [ 'https:', '', 't.me', 'c', '1469805587', '2' ]
		
		var chat_id = '@' + parts[3] // assume public by default
		var message_id = parts[4]

		if (parts[3] == 'c'){ // if private channel
			chat_id = '-100' + parts[4];
			message_id = parts[5]
		}
		
		
		return {
			chat_id: chat_id, 
			message_id: message_id
		}

	}

	Offer.prototype.get_button = async function(updated=false, ref=undefined){
		var button_url = await this.get_url(ref);

		var kb = undefined;
		var button_text = '';
		if (updated){
			var percent = Math.floor((this.current / this.total) * 100);

			button_text = i18n.t(i18n.current_locale, 'offer_button_updated', {percent:percent})
			kb = Markup.inlineKeyboard([Markup.urlButton(button_text, button_url)]);
		}else{
			button_text = i18n.t(i18n.current_locale, 'offer_button_init')
			kb = Markup.inlineKeyboard([Markup.urlButton(button_text, button_url)]);
		}

		return kb;

	}


	Offer.prototype.get_data = async function(){
        return await JSON.parse(this.data);
	}
	
	Offer.prototype.activate = async function(){
		this.status = OFFER_STATUS.active;
		this.save()
	}
	
	Offer.prototype.set_bot = async function(bot_name){
		this.bot_name = bot_name;
		this.save()

		this.set_url(this.bot_name)
		return;
	}

	Offer.prototype.set_url = async function(bot_name){
		var url = BOT_URL_PREFIX + bot_name + '?start=' + APPLY_BUTTON_PREFIX + this.id;

		this.url = url
		this.save()

		return url;
	}

	Offer.prototype.get_url = async function(ref=undefined){
		if (!ref){
			return this.url;
		}else{
			return this.url + '-' + ref;
		}
	}

	Offer.prototype.is_sum = function(){
		if (this.type == OFFER_TYPE.sum){
			return true;
		} 

		return false;
	}

	Offer.prototype.is_finished = function(){
		if (this.status == OFFER_STATUS.paused || this.status == OFFER_STATUS.finished){
			return true;
		}

		return false;
	}

	Offer.prototype.get_participant = async function(tgId){
		var participant = await db.OfferParticipantsQueue.findOne({
			where : {
				tgId : tgId,
				OfferId: this.id
			}
		})

		return participant;
	}

	Offer.prototype.add_participant = async function(tgId, data){
		var participant = null;

		try{
			var exist = await this.get_participant(tgId)
			
			if (exist){
				return OFFER_CODES.exist;
			}

			var slot_selected = 0;
			if (this.type == OFFER_TYPE.sum){
				slot_selected = Number(data['slot_selected']);
			}

			participant = await db.OfferParticipantsQueue.create(
				{
					tgId : tgId,
					OfferId: this.id,
					slot_selected : slot_selected,
					hello_input : JSON.stringify(data)
				}
			)
			
			await this.update(slot_selected)
		}catch(error){
			logger.error("FAILED: Offer.add_participant error: %s", error)
			return OFFER_CODES.unknown_error
		}

		return participant;
	}

	Offer.prototype.get_success_message = async function(){
		var data = JSON.parse(this.data)

		var success_message = data['messagePay']

		var formated_message = await i18n.t(i18n.current_locale, 'apply_offer_success_message', {message : success_message})

		return formated_message;
	}


	Offer.prototype.get_hello_message = async function(){
		var data = JSON.parse(this.data)

		var hello_message = data['messageHello']

		var formated_message = await i18n.t(i18n.current_locale, 'apply_offer_hello_message', {hello : hello_message})

		return formated_message;
	}

	Offer.prototype.get_slots_array = async function(){
		var data = JSON.parse(this.data)
		var slots = data['slots']

		return slots.split(',')
	}

	Offer.prototype.get_slot_message = async function(){
		var data = JSON.parse(this.data)

		var slot_message = data['slot_message']

		var formated_message = await i18n.t(i18n.current_locale, 'apply_offer_slot_message', {slot_message : slot_message})

		var variants = await this.get_slots_array()
	
		var buttons = []
		var i = 0;
		variants.forEach(function(item){
			var handle = 'value-' + i;
			i = i +1;
			buttons.push(Markup.callbackButton(item, handle));
		});

		var keyboard = Markup.inlineKeyboard(buttons);
		return {
			keyboard: keyboard, 
			message: formated_message
		}
	}

	Offer.prototype.convert_callback_to_slot_value = async function(data){
		if (!data){
			return undefined;
		}
		
		var index = data.split('-')[1]

		var variants = await this.get_slots_array()

		return variants[index]
		
	}

	Offer.prototype.generate_ref = function(chat_id, message_id){
		var ref = '_c_' + chat_id + '_m_' + message_id;

		return ref;
	}

	Offer.prototype.published = async function(chat_id, message_id) {
		var current_postings = JSON.parse(this.published_to);
		if (!current_postings){
			current_postings = []
		}

		var ref = this.generate_ref(chat_id, message_id)
		current_postings.push({chat_id:chat_id, message_id:message_id, ref:ref})

		this.published_to = JSON.stringify(current_postings)
		await this.save()
	}

	Offer.prototype.active = async function() {
		this.status = OFFER_STATUS.active;
		await this.save()
	}

	Offer.prototype.finished = async function() {
		this.status = OFFER_STATUS.finished;
		await this.save()
	}

	Offer.prototype.paused = async function() {
		this.status = OFFER_STATUS.paused;
		await this.save()
	}



	Offer.prototype.update = async function(slot_selected) {
		if (this.type == OFFER_TYPE.num || this.type == OFFER_TYPE.button){
			this.current = this.current + 1;
		}else{
			this.current = Number(this.current) + Number(slot_selected);
		}

		if (this.current >= this.total){
			this.status = OFFER_STATUS.finished;
		}else{
			this.status = OFFER_STATUS.updated;
		}

		await this.save()
	}

	Offer.prototype.get_publications = function(){
		var current_postings = JSON.parse(this.published_to);
		if (!current_postings){
			current_postings = []
		}

		return current_postings;
	}

	Offer.prototype.get_participants = async function(){
		var participants = await db.OfferParticipantsQueue.findAll({
			where : {
				OfferId : this.id
			}
		})

		return participants;
	}






	return Offer;
};
