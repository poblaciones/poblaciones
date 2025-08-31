import str from '@/common/framework/str';

export default UIActions;

import ActionManagerBase from './ActionManagerBase';


function UIActions(session) {
	ActionManagerBase.call(this, session, 'UI');
};

UIActions.prototype = Object.create(ActionManagerBase.prototype);

UIActions.prototype.ZoomChanged = function (zoomValue) {
	this.RegisterActionChange('Zoom', zoomValue);
	this.Summary.ZoomChanged(zoomValue);
};

UIActions.prototype.BoundsChanged = function (bounds) {
	this.RemoveIfLastIs('Bounds');
	this.RegisterAction('Bounds', bounds);
	this.Summary.BoundsChanged(bounds);
};

UIActions.prototype.BasemapChanged = function (basemap) {
	this.RegisterAction('Basemap', basemap);
};

UIActions.prototype.LabelsChanged = function (value) {
	this.RegisterActionChange('Labels', (value ? 'on' : 'off'));
};

UIActions.prototype.ToggleLeftPanel = function (value) {
	this.RegisterActionChange('LeftPanel', (value ? 'on' : 'off'));
};

UIActions.prototype.ToggleRightPanel = function (value) {
	this.RegisterActionChange('RightPanel', (value ? 'on' : 'off'));
};

UIActions.prototype.StreetView = function (value) {
	// TODO
	this.RegisterAction('StreetView', null);
};

UIActions.prototype.Search = function (value) {
	// TODO
	this.RegisterAction('Search', value);
};



