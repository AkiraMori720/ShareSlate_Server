import { Meteor } from 'meteor/meteor';
import MySQL from './mysql';

import {settings} from '../../settings';
import {Logger} from "/app/logger";
import {Rooms, Subscriptions, Users} from "/app/models";

export const logger = new Logger('MySQLNotification', {});

export function pushNotificationToMySQL(notification){
	const { creator_id, recipient_id, title, message, room_id, tmid, room_type, room_name, message_type } = notification;

	let creator_id_value = creator_id?`"${creator_id}"`:'NULL';
	let room_name_value = room_name?`"${room_name}"`:'NULL';
	let tmid_value = tmid?`"${tmid}"`:'NULL';
	let message_type_value = message_type?`"${message_type}"`:'NULL';

	let sql = `INSERT INTO notifications (creator_id, recipient_id, title, message, room_id, tmid, room_type, room_name, message_type)
				VALUES (${creator_id_value}, "${recipient_id}", "${title}", "${message}", "${room_id}", ${tmid_value}, "${room_type}", ${room_name_value}, ${message_type_value});`;

	logger.info('push to mysql', sql);

	try {
		let mysql = new MySQL();
		mysql.executeQuery(sql);
	} catch (error){
		logger.error(error);
		return error;
	}
	return true;
}

Meteor.methods({
	async sendCallNotificationToMySQL({ rid, userId, data }) {
		const query = {
			rid: rid,
			disableNotifications: {$ne: true},
		};
		const user = Users.findOneById(userId);
		const room = await Rooms.findOneById(rid);
		const subscriptions = await Subscriptions.find(query).fetch();

		subscriptions.forEach((subscription) => {
			if(subscription.u._id === userId){
				return;
			}

			let message = room.t==='d'?`${user.username} is calling you`:`${user.username} started call`;
			let type;
			if(data){
				type = data.media.video?'video_call':'audio_call';
			} else {
				type = 'jitsi_call_started';
			}
			const receiver = Users.findOneById(subscription.u._id);

			if(receiver && receiver.customFields && receiver.customFields.id
				&& user && user.customFields && user.customFields.id) {
				let notification = {
					creator_id: user.customFields.id,
					recipient_id: receiver.customFields.id,
					title: 'Call Message',
					message: message,
					room_id: rid,
					room_type: room.t,
					room_name: room.name ?? user.username,
					message_type: type
				};

				if (settings.get('MySQL_Log')) {
					console.log('sendCallNotificationToMySQL:', notification);
				}
				pushNotificationToMySQL(notification);
			}
		});
	}
});
