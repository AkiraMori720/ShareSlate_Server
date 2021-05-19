import { Meteor } from 'meteor/meteor';
import mysql from 'mysql';

import { settings } from '../../settings';
import { Logger } from '/app/logger';

const logger = new Logger('MySQL', {
	sections: {
		connection: 'Connection',
		query: 'Query'
	},
});

export default class MYSQL {
	constructor() {
		this.options = {
			host: settings.get('MySQL_Host'),
			port: settings.get('MySQL_Port'),
			user: settings.get('MySQL_UserName'),
			database: settings.get('MySQL_Database'),
			password: settings.get('MySQL_Password'),
			connect_timeout: settings.get('MySQL_Connect_Timeout'),
		};
		this.pool = mysql.createPool({
			connectionLimit : 5,
			acquireTimeout: this.options.connect_timeout,
			host: this.options.host,
			port: this.options.port,
			user: this.options.user,
			password: this.options.password,
			database: this.options.database
		});
	}

	connectTest(...args) {
		if (!this._connectTest) {
			this._connectTest = Meteor.wrapAsync(this.connectAsync, this);
		}
		return this._connectTest(...args);
	}

	connectAsync(callback) {
		logger.connection.info('Init setup');
		this.pool.getConnection((error, connection) => {
			if(error){
				logger.connection.error('error', error.code);
				callback(error, null);
			}
			if(connection){
				logger.connection.info('MySQL connected');
				callback(null, connection);
				connection.release();
			}
		});
	}

	executeQuery(sql){
		this.pool.query(sql, (error, results, fields) => {
			if(error){
				logger.query.error('error', error.code);
			} else {
				logger.query.info('Execute Query Success in MySQL');
			}
		})
	}
}
