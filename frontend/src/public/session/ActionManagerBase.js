import str from '@/common/framework/str';
import Action from './Action';

export default ActionManagerBase;

function ActionManagerBase(session, type) {
	this.session = session;
	this.Summary = session.Summary;
	this.type = type;
	this.states = {};
};

ActionManagerBase.prototype.RegisterActionChange = function (action, value) {
	if (this.states['value'] && this.states['value'] === value) {
		return;
	} else {
		this.states['value'] = value;
		this.RegisterAction(action, value);
	}
};

ActionManagerBase.prototype.RegisterAction = function (action, value) {
	var time = this.session.GetTimeMs();
	var action = new Action(this.type, action, value, time);
	this.session.LastActivity = time;
	this.session.Actions.push(action);
};

ActionManagerBase.prototype.RemoveIfLastIs = function (action) {
	var len = this.session.Actions.length;
	if (len > 0 && this.session.Actions[len - 1].Name === action &&
		this.session.Actions[len - 1].Type === this.type) {
		this.session.Actions.pop();
	}
};
