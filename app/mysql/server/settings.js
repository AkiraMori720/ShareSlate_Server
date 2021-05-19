import { settings } from '../../settings';

settings.addGroup('MySQL', function() {
	const enableQuery = { _id: 'MySQL_Enable', value: true };
	this.add('MySQL_Enable', false, { type: 'boolean', public: true });
	this.add('MySQL_Host', '', { type: 'string', enableQuery });
	this.add('MySQL_Port', '3306', { type: 'string', enableQuery });
	this.add('MySQL_UserName', '', { type: 'string', enableQuery });
	this.add('MySQL_Password', '', { type: 'string', enableQuery, secret: true });
	this.add('MySQL_Database', '', { type: 'string', enableQuery });
	this.add('MySQL_Connect_Timeout', 10000, { type: 'int', enableQuery });
	this.add('MySQL_Log', false, { type: 'boolean', enableQuery });
	this.add('MySQL_Only_Offline', false, { type: 'boolean', enableQuery });
	this.add('MySQL_ALL_Notifications', false, { type: 'boolean', enableQuery });
	this.add('MySQL_Test_Connection', 'mysql_test_connection', { type: 'action', actionText: 'Test_Connection' });
});
