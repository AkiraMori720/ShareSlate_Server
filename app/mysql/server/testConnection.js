import { Meteor } from 'meteor/meteor';
import MYSQL from './mysql';
import { hasRole } from '../../authorization';
import { settings } from '../../settings';

Meteor.methods({
	mysql_test_connection() {
		const user = Meteor.user();
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'mysql_test_connection' });
		}

		if (!hasRole(user._id, 'admin')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'mysql_test_connection' });
		}

		let mysql;
		try {
			mysql = new MYSQL();
			mysql.connectTest();
		} catch (error) {
			console.log(error);
			throw new Meteor.Error(error.message);
		}

		return {
			message: 'MySQL_Connection_success',
			params: [],
		};
	},
});
