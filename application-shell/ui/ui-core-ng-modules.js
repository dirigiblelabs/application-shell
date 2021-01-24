/*
 * Copyright (c) 2010-2020 SAP and others.
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * Contributors:
 *   SAP - initial API and implementation
 */
/**
 * Provides key microservices for constructing and managing the IDE UI
 *
 */
angular.module('shellUiCore', ['ngResource'])
.provider('messageHub', function MessageHubProvider() {
  this.evtNamePrefix = '';
  this.evtNameDelimiter = '.';
  this.$get = [function messageHubFactory() {
    var messageHub = new FramesMessageHub();
	//normalize prefix if any
	this.evtNamePrefix = this.evtNamePrefix || '';
	this.evtNamePrefix = this.evtNamePrefix ? (this.evtNamePrefix+this.evtNameDelimiter): this.evtNamePrefix;
	var send = function(evtName, data, absolute){
		if(!evtName)
			throw Error('evtname argument must be a valid string, identifying an existing event');
		messageHub.post({data: data}, (absolute ? '' : this.evtNamePrefix) + evtName);
	}.bind(this);
	var on = function(evtName, callbackFunc){
		if(typeof callbackFunc !== 'function')
			throw Error('Callback argument must be a function');
		messageHub.subscribe(callbackFunc, evtName);
	};
	return {
		send: send,
		on: on
	};
  }];
})
.service('Menu', ['$resource', function($resource){
	return $resource('../../js/application-shell/services/menu.js');
}])
.service('User', ['$http', function($http){
	return {
		get: function(){
			var user = {};
			$http({
				url: '../../js/application-shell/services/user-name.js',
				method: 'GET'
			}).success(function(data){
				user.name = data;
			});
			return user;
		}
	};
}])
.directive('brandtitle', [function() {
	return {
		restrict: 'AE',
		transclude: true,
		replace: 'true',
		scope: {
			perspectiveName: '@perspectiveName'
		},
		link: function(scope, el, attrs){
			getBrandingInfo(scope);
		},
		templateUrl: '../../../../services/v4/web/application-shell/ui/templates/brandTitle.html'
	};
}])
.directive('brandicon', [function() {
	return {
		restrict: 'AE',
		transclude: true,
		replace: 'true',
		link: function(scope, el, attrs){
			getBrandingInfo(scope);
		},
		templateUrl: '../../../../services/v4/web/application-shell/ui/templates/brandIcon.html'
	};
}])
.directive('menu', ['$resource', 'User', 'messageHub', function($resource, User, messageHub){
	return {
		restrict: 'AE',
		transclude: true,
		replace: 'true',
		scope: {
			url: '@menuDataUrl',
			menu:  '=menuData'
		},
		link: function(scope, el, attrs){
			var url = scope.url;
			function loadMenu(){
				scope.menu = $resource(url).query();
			}
			getBrandingInfo(scope);

			if(!scope.menu && url)
				loadMenu.call(scope);
			scope.menuClick = function(item, subItem) {
				if (item.event === 'open') {
					window.open(item.data, '_blank');
				} else {
					//eval(item.onClick);
					if (subItem) {
						messageHub.send(subItem.event, subItem.data, true);
					} else {
						messageHub.send(item.event, item.data, true);
					}
				}
			};

			scope.user = User.get();
		},
		templateUrl: '../../../../services/v4/web/application-shell/ui/templates/menu.html'
	}
}])
// .directive('sidebar', ['Perspectives', function(Perspectives){
// 	return {
// 		restrict: 'AE',
// 		transclude: true,
// 		replace: 'true',
// 		scope: {
// 			active: '@'
// 		},
// 		link: function(scope, el, attrs){
// 			scope.perspectives = Perspectives.query();
// 		},
// 		templateUrl: '../../../../services/v4/web/application-shell/ui/templates/sidebar.html'
// 	}
// }])
// .directive('statusBar', ['messageHub', function(messageHub){
// 	return {
// 		restrict: 'AE',
// 		transclude: true,
// 		replace: 'true',
// 		scope: {
// 			statusBarTopic: '@',
// 			message: '@message',
// 			line: '@caret',
// 			error: '@error'
// 		},
// 		link: function(scope, el, attrs){
// 			messageHub.on(scope.statusBarTopic || 'status.message', function(msg) {
// 				scope.message = msg.data;
// 				scope.$apply();
// 			});
// 			messageHub.on('status.caret', function(msg) {
// 				scope.caret = msg.data;
// 				scope.$apply();
// 			});
// 			messageHub.on('status.error', function(msg) {
// 				scope.error = msg.data;
// 				scope.$apply();
// 			});
// 		},
// 		templateUrl: '../../../../services/v4/web/application-shell/ui/templates/statusbar.html'
// 	}
// }])
;

function getBrandingInfo(scope) {
	scope.branding = JSON.parse(localStorage.getItem('DIRIGIBLE.branding'));
	if (scope.branding === null) {
		var xhr = new XMLHttpRequest();
	    xhr.open('GET', '../../js/ide-branding/api/branding.js', false);
	    xhr.send();
	    if (xhr.status === 200) {
	    	var data = JSON.parse(xhr.responseText);
	       	scope.branding = data;
			localStorage.setItem('DIRIGIBLE.branding', JSON.stringify(data));
	    }
	}
}
