'use strict';

module.exports = async function check_data(state){
		var data = state;

		if (!data['publicTitle']){
			data['publicTitle'] = 'nothing to show yet'
		 }
		 
		 if (!data['privateTitle']){
			data['privateTitle'] = 'nothing to show yet'
		 }
		 
		 if (!data['offerDescription']){
			data['offerDescription'] = 'description will be here'
		 }

		 if (!data['amount']){
			data['amount'] = 0
		 }

		 if (!data['current']){
			data['current'] = 0
		 }

		 if (!data['dueDate']){
			data['dueDate'] = 0
		 }

		 if (!data['slots']){
			data['slots'] = ''
		 }
		
		 if (!data['dicount_price']){
			data['dicount_price'] = 0
		 }


		return data;
}