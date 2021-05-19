import { settings } from '../../../../settings';
import { pushNotificationToMySQL } from "../../../../mysql/server/notification";
import {Users} from "/app/models";
import {roomTypes} from "/app/utils";

/**
 * Send notification to MySQL
 *
 * @param {string} userId The user to notify
 * @param {object} messageType The message Type
 * @param {object} room The room send from
 * @param {string} notificationMessage The message text to send on notification body
 */
export function notifyBroadcastToMySQL({
	userId,
	messageType,
	room,
	notificationMessage,
}) {
	const receiver = Users.findOneById(userId);
	if(receiver && receiver.customFields && receiver.customFields.id){
		let notification = {
			creator_id: null,
			recipient_id: receiver.customFields.id,
			title: 'ShareSlate',
			message: notificationMessage,
			room_id: room._id,
			room_type: room.t,
			room_name: room.name,
			message_type: messageType
		}
		pushNotificationToMySQL(notification);
	}
}

export function notifyMessageToMySQL({
		 userId,
		 user,
		 message,
		 room,
		 notificationMessage,
	 }) {
	const { title, text } = roomTypes.getConfig(room.t).getNotificationDetails(room, user, notificationMessage);

	const receiver = Users.findOneById(userId);
	if(receiver && receiver.customFields && receiver.customFields.id
		&& user && user.customFields && user.customFields.id && message.t !== 'jitsi_call_started'){
		let notification = {
			creator_id: user.customFields.id,
			recipient_id: receiver.customFields.id,
			title: title,
			message: text,
			room_id: message.rid,
			tmid: message.tmid,
			room_type: room.t,
			room_name: room.name??user.username,
			message_type: message.t??'unread'
		}
		if(settings.get('MySQL_Log')){
			console.log('notifyDesktopUser:', notification);
		}
		pushNotificationToMySQL(notification);
	}
}

export function shouldNotifyMySQL({
		status,
		hasMentionToAll,
		hasMentionToHere,
		isHighlighted,
		hasMentionToUser,
		hasReplyToThread,
		roomType,
		mentionIds,
		isThread,
	}) {
	if (settings.get('MySQL_Enable') !== true) {
		return false;
	}

	if ( settings.get('MySQL_Only_Offline') && status === 'busy') {
		return false;
	}

	if( settings.get('MySQL_Log')){
		console.log('notifyMySQL Condition ', roomType, mentionIds, hasMentionToAll, hasMentionToHere, isHighlighted, hasMentionToUser, isThread, hasReplyToThread);
	}

	return (roomType === 'd' || mentionIds.length === 0 || hasMentionToAll || hasMentionToHere || isHighlighted || hasMentionToUser || settings.get('MySQL_ALL_Notifications')) && (!isThread || hasReplyToThread);
}
