import str from '@/common/framework/str';

export default Action;

function Action(type, name, value, timeMs) {
	this.Type = type;
	this.Name = name;
	this.Value = value;
	this.TimeMs = timeMs;
};


