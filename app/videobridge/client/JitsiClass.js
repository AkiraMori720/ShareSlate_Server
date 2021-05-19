import {Meteor} from "meteor/meteor";
import {Tracker} from "meteor/tracker";
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import {Notifications} from "/app/notifications";
import {JITSI_EVENTS} from "/app/videobridge/client";
import {Rooms} from "/app/models";
import {settings} from "/app/settings/client";
import EventEmitter from "wolfy87-eventemitter";
import {CustomSounds} from "/app/custom-sounds/client";
import {getUserPreference, t} from '../../utils';
import { modal } from '/app/ui-utils';
import {Session} from "meteor/session";
import toastr from "toastr";
import {TAPi18n} from "meteor/rocketchat:tap-i18n";

class JitsiClass extends EventEmitter {
	/*
  		@param seldId {String}1
  		@param room {String}
   */

	constructor(selfId, room) {
		super();
		this.debug = true;
		this.selfId = selfId;
		this.room = room;
		this.isStartedCall = new ReactiveVar(false);
		this.on(JITSI_EVENTS.CALL, this.onRemoteCall.bind(this));
		this.on(JITSI_EVENTS.JOIN, this.onRemoteJoin.bind(this));
		Notifications.onRoom(this.room, JITSI_EVENTS.JITSI, (type, data) => {
			this.log('JitsiClass - onRoom', type, data);
			this.emit(type, data);
		});
	}

	log(...args) {
		if (this.debug === true) {
			console.log(...args);
		}
	}

	startCall(data) {
		this.log('JitsiClass - startCall', this.room, this.selfId);
		// Meteor.call('sendCallNotificationToMySQL', { rid: this.room, userId: this.selfId, data: data }, function(error) {
		// 	console.log('call notify error', error)
		// });
		this.isStartedCall.set(true);
		Notifications.notifyUsersOfRoom(this.room, JITSI_EVENTS.JITSI, JITSI_EVENTS.CALL, {
			from: this.selfId,
			room: this.room,
		});
	}

	joinCall(data) {
		this.log('JitsiClass - joinCall', this.webrtcInstance.room, this.webrtcInstance.selfId);
		Notifications.notifyUsersOfRoom(this.room, JITSI_EVENTS.JITSI, JITSI_EVENTS.JOIN, {
			from: this.selfId,
			room: this.room,
		});
	}

	onUserStream(type, data) {
		if (data.room !== this.room) {
			return;
		}

		this.log('JitsiClass - onUser', type, data);
		this.emit(type, data);
	}

	onRemoteCall(data) {
		this.log('onRemoteCall', data);

		const user = Meteor.users.findOne(data.from);
		let fromUsername = undefined;
		if (user && user.username) {
			fromUsername = user.username;
		}

		// When call WebRTC, Play Ringtone
		const userId = Meteor.userId();
		const audioVolume = getUserPreference(userId, 'notificationsSoundVolume');
		const sound = getUserPreference(userId, 'callNotification')??'ring';

		modal.open({
			title: `<i class='icon-videocam alert-icon success-color'></i>Call from ${ fromUsername }`,
			text: t('Do_you_want_to_accept'),
			html: true,
			showCancelButton: true,
			confirmButtonText: t('Yes'),
			cancelButtonText: t('No'),
		}, (isConfirm) => {
			if (isConfirm) {
				FlowRouter.goToRoomById(data.room);
				CustomSounds.pause(sound);
				return this.joinCall({
					to: data.from
				});
			}
			this.stop();
		}, () => {
			CustomSounds.pause(sound);
		});


		CustomSounds.play(sound, {
			volume: Number((audioVolume / 100).toPrecision(2)),
		});
	}

	onRemoteJoin(data) {
		this.log('onRemoteJoin', data);
	}

	joinCall(data = {}){
		if (Session.get('openedRoom')) {
			const rid = Session.get('openedRoom');

			const room = Rooms.findOne({ _id: rid });
			const currentTime = new Date().getTime();
			const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

			if (jitsiTimeout > currentTime) {
				this.isStartedCall.set(true);
			} else {
				toastr.info(TAPi18n.__('Call Already Ended', ''));
			}
		}
	}
}


const Jitsi = new class {
	constructor() {
		this.instancesByRoomId = {};
	}

	getInstanceByRoomId(rid) {
		const room = Rooms.findOne({ _id: rid });
		if (!room) {
			return;
		}

		if (!settings.get('Jitsi_Enabled')) {
			return;
		}
		if (this.instancesByRoomId[rid] == null) {
			this.instancesByRoomId[rid] = new JitsiClass(Meteor.userId(), rid);
		}
		return this.instancesByRoomId[rid];
	}
}();

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (Meteor.userId()) {
			Notifications.onUser(JITSI_EVENTS.JITSI, (type, data) => {
				if (data.room == null) {
					return;
				}
				const jitsi = Jitsi.getInstanceByRoomId(data.room);
				jitsi.onUserStream(type, data);
			});
		}
	});
});

export { Jitsi };
