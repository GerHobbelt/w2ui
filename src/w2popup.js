/************************************************************************
*   Library: Web 2.0 UI for jQuery (using prototypical inheritance)
*   - Following objects defined
* 		- w2popup	 	- popup widget
*		- $().w2popup	- jQuery wrapper
*   - Dependencies: jQuery, w2utils
*
* == NICE TO HAVE ==
*	- when maximized, align the slide down message
*	- bug: after transfer to another content, message does not work
* 	- transition should include title, body and buttons, not just body
*	- add lock method() to lock popup content
*
* == 1.4 changes
*	- deleted getSelection().removeAllRanges() - see https://github.com/vitmalina/w2ui/issues/323
*	- new: w2popup.status can be ['closed', 'opening', 'open', 'closing', resizing', 'moving']
*
************************************************************************/

var w2popup = {};

(function () {

	var w2window = function (options) {
		this.box		= null;		// DOM Element that holds the element
		this.name		= null;		// unique name for w2ui
		this.title		= '';
		this.body		= '';
		this.buttons	= '';
		this.style		= '';
		this.color		= '#000';
		this.opacity	= 0.4;
		this.speed		= 0.3;
		this.modal		= false;
		this.maximized	= false;
		this.keyboard	= true,		// will close popup on esc if not moda;
		this.width		= 500;
		this.height		= 300;
		this.resizable	= false;
		this.showClose	= true;
		this.showMax	= false;
		this.transition	= null;
		this.handlers	= [];
			id			: null,
			status		: 'closed', 	// string that describes current status
			handlers	: [],
			onOpen		: null,
			onClose		: null,
			onMax		: null,
			onMin		: null,
			onKeydown   : null,
		    onToggle	: null,

			text		: '',
			html		: '',
			img			: null,
			icon		: null,
			hint		: '',
		},
		this.onClick	= null;
		this.onRender	= null;
		this.onRefresh	= null;
		this.onResize	= null;
		this.onDestroy	= null;

		w2utils.deepCopy(this, w2obj.window, options);
	};

	// ====================================================
	// -- Registers as a jQuery plugin

	$.fn.w2popup = function(method, options) {
		if (typeof method === 'undefined') {
			options = {};
			method  = 'open';
		}
		if ($.isPlainObject(method)) {
			options = method;
			method  = 'open';
		}
		method = method.toLowerCase();
		if (method === 'load' && typeof options === 'string') {
			options = $.extend({ url: options }, arguments.length > 2 ? arguments[2] : {});
		}
		if (method === 'open' && options.url != null) method = 'load';
		options = options || {};
		// load options from markup
		var dlgOptions = {};
		if ($(this).length > 0) {
			if ($(this).find('div[rel=title], div[rel=body], div[rel=buttons]').length > 0) {
				if ($(this).find('div[rel=title]').length > 0) {
					dlgOptions['title'] = $(this).find('div[rel=title]').html();
				}
				if ($(this).find('div[rel=body]').length > 0) {
					dlgOptions['body']  = $(this).find('div[rel=body]').html();
					dlgOptions['style'] = $(this).find('div[rel=body]')[0].style.cssText;
				}
				if ($(this).find('div[rel=buttons]').length > 0) {
					dlgOptions['buttons'] = $(this).find('div[rel=buttons]').html();
				}
			} else {
				dlgOptions['title'] = '&nbsp;';
				dlgOptions['body']  = $(this).html();
			}
			if (parseInt($(this).css('width')) != 0)  dlgOptions['width']  = parseInt($(this).css('width'));
			if (parseInt($(this).css('height')) != 0) dlgOptions['height'] = parseInt($(this).css('height'));
		}
		// show popup
		return w2popup[method]($.extend({}, dlgOptions, options));
	};


	$.fn.w2window = function(method) {
		if (typeof method === 'object' || !method ) {
			// check name parameter
			if (!$.fn.w2checkNameParam(method, 'w2window')) return;
			// extend items
			var items = method.items || [];
			var object = new w2window(method);
			for (var i = 0, len = items.length; i < len; i++) {
				object.items[i] = $.extend({}, w2window.prototype.item, items[i]);
			}
			if ($(this).length !== 0) {
				object.render($(this)[0]);
			}
			// register new object
			w2ui[object.name] = object;
			return object;
		} else if (w2ui[$(this).attr('name')]) {
			var obj = w2ui[$(this).attr('name')];
			obj[method].apply(obj, Array.prototype.slice.call(arguments, 1));
			return this;
		} else {
			console.log('ERROR: Method ' +  method + ' does not exist on jQuery.w2window' );
		}
	};

	// ====================================================
	// -- Implementation of core functionality

	w2window.prototype = {
		show: function () {
		},

		hide: function () {
		},

		render: function (box) {
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'render', target: this.name, box: box });
			if (eventData.isCancelled === true) return false;

			if (typeof box != 'undefined' && box !== null) {
				if ($(this.box).find('> table #tb_'+ this.name + '_right').length > 0) {
					$(this.box)
						.removeAttr('name')
						.removeClass('w2ui-reset w2ui-toolbar')
						.html('');
				}
				this.box = box;
			}
			if (!this.box) return;
			// render all buttons
			var html =	'<table cellspacing="0" cellpadding="0" width="100%">'+
						'<tr>';
			for (var i = 0; i < this.items.length; i++) {
				var it = this.items[i];
				if (typeof it.id == 'undefined' || it.id === null) it.id = "item_" + i;
				if (it === null)  continue;
				if (it.type == 'spacer') {
					html += '<td width="100%" id="tb_'+ this.name +'_item_'+ it.id +'" align="right"></td>';
				} else {
					html += '<td id="tb_'+ this.name + '_item_'+ it.id +'" style="'+ (it.hidden ? 'display: none' : '') +'" '+
							'	class="'+ (it.disabled ? 'disabled' : '') +'" valign="middle">'+ this.getItemHTML(it) +
							'</td>';
				}
			}
			html += '<td width="100%" id="tb_'+ this.name +'_right" align="right">'+ this.right +'</td>';
			html += '</tr>'+
					'</table>';
			$(this.box)
				.attr('name', this.name)
				.addClass('w2ui-reset w2ui-toolbar')
				.html(html);
			if ($(this.box).length > 0) $(this.box)[0].style.cssText += this.style;
			// event after
			this.trigger($.extend(eventData, { phase: 'after' }));
		},

		refresh: function (id) {
			var time = (new Date()).getTime();
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'refresh', target: (typeof id != 'undefined' ? id : this.name), item: this.get(id) });
			if (eventData.isCancelled === true) return false;

			if (typeof id == 'undefined') {
				// refresh all
				for (var i = 0; i < this.items.length; i++) {
					var it1 = this.items[i];
					if (typeof it1.id == 'undefined' || it1.id === null) it1.id = "item_" + i;
					this.refresh(it1.id);
				}
			}
			// create or refresh only one item
			var it = this.get(id);
			if (it === null) return;

			var el = $(this.box).find('#tb_'+ this.name +'_item_'+ w2utils.escapeId(it.id));
			var html  = this.getItemHTML(it);
			if (el.length === 0) {
				// does not exist - create it
				if (it.type == 'spacer') {
					html = '<td width="100%" id="tb_'+ this.name +'_item_'+ it.id +'" align="right"></td>';
				} else {
					html =  '<td id="tb_'+ this.name + '_item_'+ it.id +'" style="'+ (it.hidden ? 'display: none' : '') +'" '+
						'	class="'+ (it.disabled ? 'disabled' : '') +'" valign="middle">'+ html +
						'</td>';
				}
				if (this.get(id, true) == this.items.length-1) {
					$(this.box).find('#tb_'+ this.name +'_right').before(html);
				} else {
					$(this.box).find('#tb_'+ this.name +'_item_'+ w2utils.escapeId(this.items[parseInt(this.get(id, true))+1].id)).before(html);
				}
			} else {
				// refresh
				el.html(html);
				if (it.hidden) { el.css('display', 'none'); } else { el.css('display', ''); }
				if (it.disabled) { el.addClass('disabled'); } else { el.removeClass('disabled'); }
			}
			// event after
			this.trigger($.extend(eventData, { phase: 'after' }));
			return (new Date()).getTime() - time;
		},

		resize: function () {
			var time = (new Date()).getTime();
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'resize', target: this.name });
			if (eventData.isCancelled === true) return false;

			// empty function

			// event after
			this.trigger($.extend(eventData, { phase: 'after' }));
			return (new Date()).getTime() - time;
		},

		destroy: function () {
			// event before
			var eventData = this.trigger({ phase: 'before', type: 'destroy', target: this.name });
			if (eventData.isCancelled === true) return false;
			// clean up
			if ($(this.box).find('> table #tb_'+ this.name + '_right').length > 0) {
				$(this.box)
					.removeAttr('name')
					.removeClass('w2ui-reset w2ui-toolbar')
					.html('');
			}
			$(this.box).html('');
			delete w2ui[this.name];
			// event after
			this.trigger($.extend(eventData, { phase: 'after' }));
		},

		// ========================================
		// --- Internal Functions

		getItemHTML: function (item) {
			var html = '';

			if (typeof item.caption != 'undefined') item.text = item.caption;
			if (typeof item.hint == 'undefined') item.hint = '';
			if (typeof item.text == 'undefined') item.text = '';

			switch (item.type) {
				case 'menu':
				case 'button':
				case 'check':
				case 'radio':
				case 'drop':
					var img = '<td>&nbsp;</td>';
					if (item.img)  img = '<td><div class="w2ui-tb-image w2ui-icon '+ item.img +'"></div></td>';
					if (item.icon) img = '<td><div class="w2ui-tb-image"><span class="'+ item.icon +'"></span></div></td>';
					html += '<table cellpadding="0" cellspacing="0" title="'+ item.hint +'" class="w2ui-button '+ (item.checked ? 'checked' : '') +'" '+
							'       onclick     = "var el=w2ui[\''+ this.name + '\']; if (el) el.click(\''+ item.id +'\', event);" '+
							'       onmouseover = "' + (!item.disabled ? "$(this).addClass('over');" : "") + '"'+
							'       onmouseout  = "' + (!item.disabled ? "$(this).removeClass('over');" : "") + '"'+
							'       onmousedown = "' + (!item.disabled ? "$(this).addClass('down');" : "") + '"'+
							'       onmouseup   = "' + (!item.disabled ? "$(this).removeClass('down');" : "") + '"'+
							'>'+
							'<tr><td>'+
							'  <table cellpadding="1" cellspacing="0">'+
							'  <tr>' +
									img +
									(item.text !== '' ? '<td class="w2ui-tb-caption" nowrap>'+ item.text +'</td>' : '') +
									(((item.type == 'drop' || item.type == 'menu') && item.arrow !== false) ?
										'<td class="w2ui-tb-down" nowrap><div></div></td>' : '') +
							'  </tr></table>'+
							'</td></tr></table>';
					break;

				case 'break':
					html +=	'<table cellpadding="0" cellspacing="0"><tr>'+
							'    <td><div class="w2ui-break">&nbsp;</div></td>'+
							'</tr></table>';
					break;

				case 'html':
					html +=	'<table cellpadding="0" cellspacing="0"><tr>'+
							'    <td nowrap>' + item.html + '</td>'+
							'</tr></table>';
					break;
			}

			var newHTML = '';
			if (typeof item.onRender == 'function') newHTML = item.onRender.call(this, item.id, html);
			if (typeof this.onRender == 'function') newHTML = this.onRender(item.id, html);
			if (newHTML !== '' && typeof newHTML != 'undefined') html = newHTML;
			return html;
		},

		menuClick: function (event) {
			var obj = this;
			if (event.item && !event.item.disabled) {
				// event before
				var eventData = this.trigger({ phase: 'before', type: 'click', target: event.item.id + ':' + event.subItem.id, item: event.item,
					subItem: event.subItem, originalEvent: event.originalEvent });
				if (eventData.isCancelled === true) return false;

				// intentionaly blank

				// event after
				this.trigger($.extend(eventData, { phase: 'after' }));
			}
		},

		click: function (id, event) {
			var obj = this;
			var it  = this.get(id);
			if (it && !it.disabled) {
				// event before
				var eventData = this.trigger({ phase: 'before', type: 'click', target: (typeof id != 'undefined' ? id : this.name),
					item: this.get(id), originalEvent: event });
				if (eventData.isCancelled === true) return false;

				var btn = $('#tb_'+ this.name +'_item_'+ w2utils.escapeId(it.id) +' table.w2ui-button');
				btn.removeClass('down');

				if (it.type == 'radio') {
					for (var i = 0; i < this.items.length; i++) {
						var itt = this.items[i];
						if (itt === null || itt.id == it.id || itt.type != 'radio') continue;
						if (itt.group == it.group && itt.checked) {
							itt.checked = false;
							this.refresh(itt.id);
						}
					}
					it.checked = true;
					btn.addClass('checked');
				}

				if (it.type == 'drop' || it.type == 'menu') {
					if (it.checked) {
						// if it was already checked, second click will hide it
						it.checked = false;
					} else {
						// show overlay
						setTimeout(function () {
							var el = $('#tb_'+ obj.name +'_item_'+ w2utils.escapeId(it.id));
							if (!$.isPlainObject(it.overlay)) it.overlay = {};
							var left = (el.width() - 50) / 2;
							if (left > 19) left = 19;
							if (it.type == 'drop') {
								el.w2overlay(it.html, $.extend({ left: left, top: 3 }, it.overlay));
							}
							if (it.type == 'menu') {
								el.w2menu(it.items, $.extend({ left: left, top: 3 }, it.overlay, {
									select: function (event) {
										obj.menuClick({ item: it, subItem: event.item, originalEvent: event.originalEvent });
										hideDrop();
									}
								}));
							}
							// window.click to hide it
							$(document).on('click', hideDrop);
							function hideDrop() {
								it.checked = false;
								if (it.checked) {
									btn.addClass('checked');
								} else {
									btn.removeClass('checked');
								}
								obj.refresh(it.id);
								$(document).off('click', hideDrop);
							}
						}, 1);
					}
				}

				if (it.type == 'check' || it.type == 'drop' || it.type == 'menu') {
					it.checked = !it.checked;
					if (it.checked) {
						btn.addClass('checked');
					} else {
						btn.removeClass('checked');
					}
				}
				// event after
				this.trigger($.extend(eventData, { phase: 'after' }));
			}
		}
	};

	$.extend(w2window.prototype, w2utils.event);
	w2obj.window = w2window;

	// ====================================================
	// -- Implementation of core functionality (SINGELTON)

	w2window.prototype = {
		item: {
			id			: null,
			status		: 'closed', 	// string that describes current status
			handlers	: [],
			onOpen		: null,
			onClose		: null,
			onMax		: null,
			onMin		: null,
		    onToggle	: null,
			onKeydown   : null,

			text		: '',
			html		: '',
			img			: null,
			icon		: null,
			hint		: '',
		},

		open: function (options) {
			var obj = this;
			if (w2popup.status == 'closing') {
				setTimeout(function () {
					obj.open.call(obj, options);
				}, 100);
				return;
			}
			// get old options and merge them
			var old_options = $('#w2ui-popup').data('options');
			var options = $.extend({}, this.defaults, { body : '' }, old_options, options, { maximized: false });
			// need timer because popup might not be open
			setTimeout(function () {
				$('#w2ui-popup').data('options', options);
			}, 100);
			// if new - reset event handlers
			var event_types = [
				'max',
				'min',
				'open',
				'close',
				'keydown',
                'toggle'
			];
			var event_phases = [
				'',
				'before',
				'after'
			];
			var eid, eph, ename;
			if ($('#w2ui-popup').length == 0) {
				w2popup.handlers = [];

				for (eid = event_types.length; --eid >= 0; ) {
					for (eph = event_phases.length; --eph >= 0; ) {
						ename = 'on' + event_phases[eph].substr(0,1).toUpperCase() + event_phases[eph].substr(1) + event_types[eid].substr(0,1).toUpperCase() + event_types[eid].substr(1);
						w2popup[ename] = null;
					}
				}
			}

			for (eid = event_types.length; --eid >= 0; ) {
				for (eph = event_phases.length; --eph >= 0; ) {
					ename = 'on' + event_phases[eph].substr(0,1).toUpperCase() + event_phases[eph].substr(1) + event_types[eid].substr(0,1).toUpperCase() + event_types[eid].substr(1);
					if (options[ename]) {
						w2popup[ename] = options[ename];
					}
				}
			}

			if (window.innerHeight == undefined) {
				var width  = document.documentElement.offsetWidth;
				var height = document.documentElement.offsetHeight;
				if (w2utils.engine === 'IE7') { width += 21; height += 4; }
			} else {
				var width  = window.innerWidth;
				var height = window.innerHeight;
			}
			if (parseInt(width)  - 10 < parseInt(options.width))  options.width  = parseInt(width)  - 10;
			if (parseInt(height) - 10 < parseInt(options.height)) options.height = parseInt(height) - 10;
			var top  = ((parseInt(height) - parseInt(options.height)) / 2) * 0.6;
			var left = (parseInt(width) - parseInt(options.width)) / 2;
			// check if message is already displayed
			if ($('#w2ui-popup').length == 0) {
				// trigger event
				var eventData = this.trigger({ phase: 'before', type: 'open', target: 'popup', options: options, present: false });
				if (eventData.isCancelled === true) return;
				w2popup.status = 'opening';
				// output message
				w2popup.lockScreen(options);
				var msg = '<div id="w2ui-popup" class="w2ui-popup" style="'+
								'width: ' + parseInt(options.width) + 'px; height: ' + parseInt(options.height) + 'px; opacity: 0; '+
								'-webkit-transform: scale(0.8); -moz-transform: scale(0.8); -ms-transform: scale(0.8); -o-transform: scale(0.8); '+
								'left: ' + left + 'px; top: ' + top + 'px;">';
				if (options.title != '') {
					msg +='<div class="w2ui-msg-title">'+
						  (options.showClose ? '<div class="w2ui-msg-button w2ui-msg-close" onmousedown="event.stopPropagation()" onclick="w2popup.close(); '+
						  					   'if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true;">Close</div>' : '')+
						  (options.showMax ? '<div class="w2ui-msg-button w2ui-msg-max" onmousedown="event.stopPropagation()" onclick="w2popup.toggle()">Max</div>' : '') +
							  options.title +
						  '</div>';
				}
				msg += '<div class="w2ui-box1" style="'+(options.title == '' ? 'top: 0px !important;' : '')+(options.buttons == '' ? 'bottom: 0px !important;' : '')+'">';
				msg += '<div class="w2ui-msg-body' + (!options.title != '' ? ' w2ui-msg-no-title' : '') + (!options.buttons != '' ? ' w2ui-msg-no-buttons' : '') + '" style="' + options.style + '">' + options.body + '</div>';
				msg += '</div>';
				msg += '<div class="w2ui-box2" style="'+(options.title == '' ? 'top: 0px !important;' : '')+(options.buttons == '' ? 'bottom: 0px !important;' : '')+'">';
				msg += '<div class="w2ui-msg-body' + (!options.title != '' ? ' w2ui-msg-no-title' : '') + (!options.buttons != '' ? ' w2ui-msg-no-buttons' : '') + '" style="' + options.style + '"></div>';
				msg += '</div>';
				if (options.buttons != '') {
					msg += '<div class="w2ui-msg-buttons">' + options.buttons + '</div>';
				}
				msg += '</div>';
				$('body').append(msg);
				// allow element to render
				setTimeout(function () {
					$('#w2ui-popup .w2ui-box2').hide();
					$('#w2ui-popup').css({
						'-webkit-transition': options.speed + 's opacity, ' + options.speed + 's -webkit-transform',
						'-webkit-transform': 'scale(1)',
						'-moz-transition': options.speed + 's opacity, ' + options.speed + 's -moz-transform',
						'-moz-transform': 'scale(1)',
						'-ms-transition': options.speed + 's opacity, ' + options.speed + 's -ms-transform',
						'-ms-transform': 'scale(1)',
						'-o-transition': options.speed + 's opacity, ' + options.speed + 's -o-transform',
						'-o-transform': 'scale(1)',
						'opacity': '1'
					});
				}, 1);
				// clean transform
				setTimeout(function () {
					$('#w2ui-popup').css({
						'-webkit-transform': '',
						'-moz-transform': '',
						'-ms-transform': '',
						'-o-transform': ''
					});
					// event after
					w2popup.status = 'open';
					setTimeout(function () {
						obj.trigger($.extend(eventData, { phase: 'after' }));
					}, 50);
				}, options.speed * 1000);
			} else {
				// trigger event
				var eventData = this.trigger({ phase: 'before', type: 'open', target: 'popup', options: options, present: true });
				if (eventData.isCancelled === true) return;
				// check if size changed
				w2popup.status = 'opening';
				if (typeof old_options == 'undefined' || old_options['width'] != options['width'] || old_options['height'] != options['height']) {
					w2popup.resize(options.width, options.height);
				}
				// show new items
				var body = $('#w2ui-popup .w2ui-box2 > .w2ui-msg-body').html(options.body);
				if (body.length > 0) body[0].style.cssText = options.style;
				$('#w2ui-popup .w2ui-msg-buttons').html(options.buttons);
				$('#w2ui-popup .w2ui-msg-title').html(
					  (options.showClose ? '<div class="w2ui-msg-button w2ui-msg-close" onmousedown="event.stopPropagation()" onclick="w2popup.close()">Close</div>' : '')+
					  (options.showMax ? '<div class="w2ui-msg-button w2ui-msg-max" onmousedown="event.stopPropagation()" onclick="w2popup.toggle()">Max</div>' : '') +
					  options.title);
				// transition
				var div_old = $('#w2ui-popup .w2ui-box1')[0];
				var div_new = $('#w2ui-popup .w2ui-box2')[0];
				w2utils.transition(div_old, div_new, options.transition);
				div_new.className = 'w2ui-box1';
				div_old.className = 'w2ui-box2';
				$(div_new).addClass('w2ui-current-box');
				// remove max state
				$('#w2ui-popup').data('prev-size', null);
				// call event onChange
				setTimeout(function () {
					w2popup.status = 'open';
					obj.trigger($.extend(eventData, { phase: 'after' }));
				}, 50);
			}
			// save new options
			options._last_w2ui_name = w2utils.keyboard.active();
			w2utils.keyboard.active(null);
			// keyboard events
			if (options.keyboard) $(document).on('keydown', this.keydown);

			// initialize move
			var tmp = {
				resizing: false,
				mvMove	: mvMove,
				mvStop	: mvStop
			};
			$('#w2ui-popup .w2ui-msg-title').on('mousedown', function (event) { mvStart(event); })

			// handlers
			function mvStart(evnt) {
				if (!evnt) evnt = window.event;
				if (!window.addEventListener) { window.document.attachEvent('onselectstart', function() { return false; } ); }
				w2popup.status = 'moving';
				tmp.resizing = true;
				tmp.x = evnt.screenX;
				tmp.y = evnt.screenY;
				tmp.pos_x = $('#w2ui-popup').position().left;
				tmp.pos_y = $('#w2ui-popup').position().top;
				w2popup.lock({ opacity: 0 });
				$(document).on('mousemove', tmp.mvMove);
				$(document).on('mouseup', tmp.mvStop);
				if (evnt.stopPropagation) evnt.stopPropagation(); else evnt.cancelBubble = true;
				if (evnt.preventDefault) evnt.preventDefault(); else return false;
			}

			function mvMove(evnt) {
				if (tmp.resizing != true) return;
				if (!evnt) evnt = window.event;
				tmp.div_x = evnt.screenX - tmp.x;
				tmp.div_y = evnt.screenY - tmp.y;
				$('#w2ui-popup').css({
					'-webkit-transition': 'none',
					'-webkit-transform': 'translate3d('+ tmp.div_x +'px, '+ tmp.div_y +'px, 0px)',
					'-moz-transition': 'none',
					'-moz-transform': 'translate('+ tmp.div_x +'px, '+ tmp.div_y +'px)',
					'-ms-transition': 'none',
					'-ms-transform': 'translate('+ tmp.div_x +'px, '+ tmp.div_y +'px)',
					'-o-transition': 'none',
					'-o-transform': 'translate('+ tmp.div_x +'px, '+ tmp.div_y +'px)'
				});
			}

			function mvStop(evnt) {
				if (tmp.resizing != true) return;
				if (!evnt) evnt = window.event;
				w2popup.status = 'open';
				tmp.div_x = (evnt.screenX - tmp.x);
				tmp.div_y = (evnt.screenY - tmp.y);
				$('#w2ui-popup').css({
					'left': (tmp.pos_x + tmp.div_x) + 'px',
					'top':	(tmp.pos_y  + tmp.div_y) + 'px',
					'-webkit-transition': 'none',
					'-webkit-transform': 'translate3d(0px, 0px, 0px)',
					'-moz-transition': 'none',
					'-moz-transform': 'translate(0px, 0px)',
					'-ms-transition': 'none',
					'-ms-transform': 'translate(0px, 0px)',
					'-o-transition': 'none',
					'-o-transform': 'translate(0px, 0px)',
				});
				tmp.resizing = false;
				$(document).off('mousemove', tmp.mvMove);
				$(document).off('mouseup', tmp.mvStop);
				w2popup.unlock();
			}
			return this;
		},

		keydown: function (event) {
			var options = $('#w2ui-popup').data('options');
			if (!options.keyboard) return;
			// trigger event
			var eventData = w2popup.trigger({ phase: 'before', type: 'keydown', target: 'popup', options: options, originalEvent: event });
			if (eventData.isCancelled === true) return;
			// default behavior
			switch (event.keyCode) {
				case 27:
					event.preventDefault();
					if ($('#w2ui-popup .w2ui-popup-message').length > 0) w2popup.message(); else w2popup.close();
					break;
			}
			// event after
			w2popup.trigger($.extend(eventData, { phase: 'after'}));
		},

		close: function (options) {
			var obj = this;
			var options = $.extend({}, $('#w2ui-popup').data('options'), options);
			if ($('#w2ui-popup').length == 0) return;
			// trigger event
			var eventData = this.trigger({ phase: 'before', type: 'close', target: 'popup', options: options });
			if (eventData.isCancelled === true) return;
			// default behavior
			w2popup.status = 'closing';
			$('#w2ui-popup').css({
				'-webkit-transition': options.speed + 's opacity, ' + options.speed + 's -webkit-transform',
				'-webkit-transform': 'scale(0.9)',
				'-moz-transition': options.speed + 's opacity, ' + options.speed + 's -moz-transform',
				'-moz-transform': 'scale(0.9)',
				'-ms-transition': options.speed + 's opacity, ' + options.speed + 's -ms-transform',
				'-ms-transform': 'scale(0.9)',
				'-o-transition': options.speed + 's opacity, ' + options.speed + 's -o-transform',
				'-o-transform': 'scale(0.9)',
				'opacity': '0'
			});
			w2popup.unlockScreen(options);
			setTimeout(function () {
				$('#w2ui-popup').remove();
				w2popup.status = 'closed';
				// event after
				obj.trigger($.extend(eventData, { phase: 'after'}));
			}, options.speed * 1000);
			// restore active
			w2utils.keyboard.active(options._last_w2ui_name);
			// remove keyboard events
			if (options.keyboard) $(document).off('keydown', this.keydown);
		},

		toggle: function () {
			var obj		= this;
			var options = $('#w2ui-popup').data('options');
			// trigger event
			var eventData = this.trigger({ phase: 'before', type: 'toggle', target: 'popup', options: options });
			if (eventData.isCancelled === true) return;
			// defatul action
			if (options.maximized === true) w2popup.min(); else w2popup.max();
			// event after
			setTimeout(function () {
				obj.trigger($.extend(eventData, { phase: 'after'}));
			}, 250);
		},

		max: function () {
			var obj = this;
			var options = $('#w2ui-popup').data('options');
			if (options.maximized === true) return;
			// trigger event
			var eventData = this.trigger({ phase: 'before', type: 'max', target: 'popup', options: options });
			if (eventData.isCancelled === true) return;
			// default behavior
			w2popup.status 	  = 'resizing';
			options.prevSize  = $('#w2ui-popup').css('width')+':'+$('#w2ui-popup').css('height');
			// do resize
			w2popup.resize(10000, 10000, function () {
				w2popup.status = 'open';
				options.maximized = true;
				obj.trigger($.extend(eventData, { phase: 'after'}));
			});
		},

		min: function () {
			var obj = this;
			var options = $('#w2ui-popup').data('options');
			if (options.maximized !== true) return;
			var size = options.prevSize.split(':');
			// trigger event
			var eventData = this.trigger({ phase: 'before', type: 'min', target: 'popup', options: options });
			if (eventData.isCancelled === true) return;
			// default behavior
			w2popup.status = 'resizing';
			// do resize
			w2popup.resize(size[0], size[1], function () {
				w2popup.status = 'open';
				options.maximized = false;
				options.prevSize  = null;
				obj.trigger($.extend(eventData, { phase: 'after'}));
			});
		},

		get: function () {
			return $('#w2ui-popup').data('options');
		},

		set: function (options) {
			w2popup.open(options);
		},

		clear: function() {
			$('#w2ui-popup .w2ui-msg-title').html('');
			$('#w2ui-popup .w2ui-msg-body').html('');
			$('#w2ui-popup .w2ui-msg-buttons').html('');
		},

		reset: function () {
			w2popup.open(w2popup.defaults);
		},

		load: function (options) {
			w2popup.status = 'loading';
			if (String(options.url) == 'undefined') {
				console.log('ERROR: The url parameter is empty.');
				return;
			}
			var tmp = String(options.url).split('#');
			var url = tmp[0];
			var selector = tmp[1];
			if (String(options) == 'undefined') options = {};
			// load url
			var html = $('#w2ui-popup').data(url);
			if (typeof html != 'undefined' && html != null) {
				popup(html, selector);
			} else {
				$.get(url, function (data, status, obj) {
					popup(obj.responseText, selector);
					$('#w2ui-popup').data(url, obj.responseText); // remember for possible future purposes
				});
			}
			function popup(html, selector) {
				delete options.url;
				$('body').append('<div id="w2ui-tmp" style="display: none">' + html + '</div>');
				if (typeof selector != 'undefined' && $('#w2ui-tmp #'+selector).length > 0) {
					$('#w2ui-tmp #' + selector).w2popup(options);
				} else {
					$('#w2ui-tmp > div').w2popup(options);
				}
				// link styles
				if ($('#w2ui-tmp > style').length > 0) {
					var style = $('<div>').append($('#w2ui-tmp > style').clone()).html();
					if ($('#w2ui-popup #div-style').length == 0) {
						$('#w2ui-popup').append('<div id="div-style" style="position: absolute; left: -100; width: 1px"></div>');
					}
					$('#w2ui-popup #div-style').html(style);
				}
				$('#w2ui-tmp').remove();
			}
		},

		message: function (options) {
			$().w2tag(); // hide all tags
			if (!options) options = { width: 200, height: 100 };
			if (parseInt(options.width) < 10)  options.width  = 10;
			if (parseInt(options.height) < 10) options.height = 10;
			if (typeof options.hideOnClick == 'undefined') options.hideOnClick = false;

			var head 	 = $('#w2ui-popup .w2ui-msg-title');
			var pwidth 	 = parseInt($('#w2ui-popup').width());
			var msgCount = $('#w2ui-popup .w2ui-popup-message').length;
			// remove message
			if ($.trim(options.html) == '') {
				$('#w2ui-popup #w2ui-message'+ (msgCount-1)).css('z-Index', 250);
				var options = $('#w2ui-popup #w2ui-message'+ (msgCount-1)).data('options');
				$('#w2ui-popup #w2ui-message'+ (msgCount-1)).remove();
				if (typeof options.onClose == 'function') options.onClose();
				if (msgCount == 1) {
					w2popup.unlock();
				} else {
					$('#w2ui-popup #w2ui-message'+ (msgCount-2)).show();
				}
			} else {
				// hide previous messages
				$('#w2ui-popup .w2ui-popup-message').hide();
				// add message
				$('#w2ui-popup .w2ui-box1')
					.before('<div id="w2ui-message' + msgCount + '" class="w2ui-popup-message" style="display: none; ' +
								(head.length == 0 ? 'top: 0px;' : 'top: ' + w2utils.getSize(head, 'height') + 'px;') +
					        	(typeof options.width  != 'undefined' ? 'width: ' + options.width + 'px; left: ' + ((pwidth - options.width) / 2) + 'px;' : 'left: 10px; right: 10px;') +
					        	(typeof options.height != 'undefined' ? 'height: ' + options.height + 'px;' : 'bottom: 6px;') +
					        	'-webkit-transition: .3s; -moz-transition: .3s; -ms-transition: .3s; -o-transition: .3s;"' +
								(options.hideOnClick === true ? 'onclick="w2popup.message();"' : '') + '>' +
							'</div>');
				$('#w2ui-popup #w2ui-message'+ msgCount).data('options', options);
				var display = $('#w2ui-popup #w2ui-message'+ msgCount).css('display');
				$('#w2ui-popup #w2ui-message'+ msgCount).css({
					'-webkit-transform': (display == 'none' ? 'translateY(-' + options.height + 'px)' : 'translateY(0px)'),
					'-moz-transform': (display == 'none' ? 'translateY(-' + options.height + 'px)' : 'translateY(0px)'),
					'-ms-transform': (display == 'none' ? 'translateY(-' + options.height + 'px)' : 'translateY(0px)'),
					'-o-transform': (display == 'none' ? 'translateY(-' + options.height + 'px)' : 'translateY(0px)')
				});
				if (display == 'none') {
					$('#w2ui-popup #w2ui-message'+ msgCount).show().html(options.html);
					// timer needs to animation
					setTimeout(function () {
						$('#w2ui-popup #w2ui-message'+ msgCount).css({
							'-webkit-transform': (display == 'none' ? 'translateY(0px)' : 'translateY(-' + options.height + 'px)'),
							'-moz-transform': (display == 'none' ? 'translateY(0px)' : 'translateY(-' + options.height + 'px)'),
							'-ms-transform': (display == 'none' ? 'translateY(0px)' : 'translateY(-' + options.height + 'px)'),
							'-o-transform': (display == 'none' ? 'translateY(0px)' : 'translateY(-' + options.height + 'px)')
						});
					}, 1);
					// timer for lock
					setTimeout(function() {
						$('#w2ui-popup #w2ui-message'+ msgCount).css({
							'-webkit-transition': '0s',	'-moz-transition': '0s', '-ms-transition': '0s', '-o-transition': '0s',
							'z-Index': 1500
						}); // has to be on top of lock
						if (msgCount == 0) w2popup.lock();
    					if (typeof options.onOpen == 'function') options.onOpen();
					}, 300);
				}
			}
		},

		lock: function (msg, showSpinner) {
			var args = Array.prototype.slice.call(arguments, 0);
			args.unshift($('#w2ui-popup'));
			w2utils.lock.apply(window, args);
		},

		unlock: function () {
			w2utils.unlock($('#w2ui-popup'));
		},

		// --- INTERNAL FUNCTIONS

		lockScreen: function (options) {
			if ($('#w2ui-lock').length > 0) return false;
			if (typeof options == 'undefined') options = $('#w2ui-popup').data('options');
			if (typeof options == 'undefined') options = {};
			options = $.extend({}, w2popup.defaults, options);
			// show element
			$('body').append('<div id="w2ui-lock" ' +
				'	onmousewheel="if (event.stopPropagation) event.stopPropagation(); else event.cancelBubble = true; if (event.preventDefault) event.preventDefault(); else return false;"'+
				'	style="position: ' + (w2utils.engine == 'IE5' ? 'absolute' : 'fixed') + '; z-Index: 1199; left: 0px; top: 0px; ' +
				'		   padding: 0px; margin: 0px; background-color: ' + options.color + '; width: 100%; height: 100%; opacity: 0;"></div>');
			// lock screen
			setTimeout(function () {
				$('#w2ui-lock').css({
					'-webkit-transition': options.speed + 's opacity',
					'-moz-transition': options.speed + 's opacity',
					'-ms-transition': options.speed + 's opacity',
					'-o-transition': options.speed + 's opacity',
					'opacity': options.opacity
				});
			}, 1);
			// add events
			if (options.modal == true) {
				$('#w2ui-lock').on('mousedown', function () {
					$('#w2ui-lock').css({
						'-webkit-transition': '.1s',
						'-moz-transition': '.1s',
						'-ms-transition': '.1s',
						'-o-transition': '.1s',
						'opacity': '0.6'
					});
					// if (window.getSelection) window.getSelection().removeAllRanges();
				});
				$('#w2ui-lock').on('mouseup', function () {
					setTimeout(function () {
						$('#w2ui-lock').css({
							'-webkit-transition': '.1s',
							'-moz-transition': '.1s',
							'-ms-transition': '.1s',
							'-o-transition': '.1s',
							'opacity': options.opacity
						});
					}, 100);
					// if (window.getSelection) window.getSelection().removeAllRanges();
				});
			} else {
				$('#w2ui-lock').on('mouseup', function () { w2popup.close(); });
			}
			return true;
		},

		unlockScreen: function (options) {
			if ($('#w2ui-lock').length == 0) return false;
			if (typeof options == 'undefined') options = $('#w2ui-popup').data('options');
			if (typeof options == 'undefined') options = {};
			options = $.extend({}, w2popup.defaults, options);
			$('#w2ui-lock').css({
				'-webkit-transition': options.speed + 's opacity',
				'-moz-transition': options.speed + 's opacity',
				'-ms-transition': options.speed + 's opacity',
				'-o-transition': options.speed + 's opacity',
				'opacity': 0
			});
			setTimeout(function () {
				$('#w2ui-lock').remove();
			}, options.speed * 1000);
			return true;
		},

		resize: function (width, height, callBack) {
			var options = $('#w2ui-popup').data('options');
			// calculate new position
			if (parseInt($(window).width())  - 10 < parseInt(width))  width  = parseInt($(window).width())  - 10;
			if (parseInt($(window).height()) - 10 < parseInt(height)) height = parseInt($(window).height()) - 10;
			var top  = ((parseInt($(window).height()) - parseInt(height)) / 2) * 0.8;
			var left = (parseInt($(window).width()) - parseInt(width)) / 2;
			// resize there
			$('#w2ui-popup').css({
				'-webkit-transition': options.speed + 's width, ' + options.speed + 's height, ' + options.speed + 's left, ' + options.speed + 's top',
				'-moz-transition': options.speed + 's width, ' + options.speed + 's height, ' + options.speed + 's left, ' + options.speed + 's top',
				'-ms-transition': options.speed + 's width, ' + options.speed + 's height, ' + options.speed + 's left, ' + options.speed + 's top',
				'-o-transition': options.speed + 's width, ' + options.speed + 's height, ' + options.speed + 's left, ' + options.speed + 's top',
				'top': top,
				'left': left,
				'width': width,
				'height': height
			});
			if (typeof callBack == 'function') {
				setTimeout(function () {
					callBack();
				}, options.speed * 1000);
			}
		}
	};

	// merge in event handling
	$.extend(w2window.prototype, w2utils.event);
	w2obj.window = w2window;

	// and create a singleton instance for popups:
	w2popup = new w2window('create', {});

})();

// ============================================
// --- Common dialogs

var w2alert = function (msg, title, callBack) {
	if (typeof title == 'undefined') title = w2utils.lang('Notification');
	if ($('#w2ui-popup').length > 0 && w2popup.status != 'closing') {
		w2popup.message({
			width 	: 400,
			height 	: 150,
			html 	: '<div style="position: absolute; top: 0px; left: 0px; right: 0px; bottom: 45px; overflow: auto">' +
					  '		<div class="w2ui-centered" style="font-size: 13px;">' + msg + '</div>' +
					  '</div>' +
					  '<div style="position: absolute; bottom: 7px; left: 0px; right: 0px; text-align: center; padding: 5px">' +
					  '		<button onclick="w2popup.message();" class="w2ui-popup-btn btn">' + w2utils.lang('Ok') + '</button>' +
					  '</div>',
			onClose : function () {
				if (typeof callBack == 'function') callBack();
			}
		});
	} else {
		w2popup.open({
			width 	: 450,
			height 	: 200,
			showMax : false,
			title 	: title,
			body    : '<div class="w2ui-centered" style="font-size: 13px;">' + msg + '</div>',
			buttons : '<button onclick="w2popup.close();" class="w2ui-popup-btn btn">' + w2utils.lang('Ok') + '</button>',
			onClose : function () {
				if (typeof callBack == 'function') callBack();
			}
		});
	}
};

var w2confirm = function (msg, title, callBack) {
	if (typeof callBack == 'undefined' || typeof title == 'function') {
		callBack = title;
		title = w2utils.lang('Confirmation');
	}
	if (typeof title == 'undefined') {
		title = w2utils.lang('Confirmation');
	}
	if ($('#w2ui-popup').length > 0 && w2popup.status != 'closing') {
		w2popup.message({
			width 	: 400,
			height 	: 150,
			html 	: '<div style="position: absolute; top: 0px; left: 0px; right: 0px; bottom: 40px; overflow: auto">' +
					  '		<div class="w2ui-centered" style="font-size: 13px;">' + msg + '</div>' +
					  '</div>' +
					  '<div style="position: absolute; bottom: 7px; left: 0px; right: 0px; text-align: center; padding: 5px">' +
					  '		<button id="Yes" class="w2ui-popup-btn btn">' + w2utils.lang('Yes') + '</button>' +
					  '		<button id="No" class="w2ui-popup-btn btn">' + w2utils.lang('No') + '</button>' +
					  '</div>',
			onOpen: function () {
				$('#w2ui-popup .w2ui-popup-message .btn').on('click', function (event) {
					w2popup.message();
					if (typeof callBack == 'function') callBack(event.target.id);
				});
			},
			onKeydown: function (event) {
				switch (event.originalEvent.keyCode) {
					case 13: // enter
						if (typeof callBack == 'function') callBack('Yes');
						w2popup.message();
						break
					case 27: // esc
						if (typeof callBack == 'function') callBack('No');
						w2popup.message();
						break
				}
			}
		});
	} else {
		w2popup.open({
			width 		: 450,
			height 		: 200,
			title   	: title,
			modal		: true,
			showClose	: false,
			body		: '<div class="w2ui-centered" style="font-size: 13px;">' + msg + '</div>',
			buttons		: '<button id="No" class="w2ui-popup-btn btn">' + w2utils.lang('No') + '</button>'+
						  '<button id="Yes" class="w2ui-popup-btn btn">' + w2utils.lang('Yes') + '</button>',
			onOpen: function (event) {
				event.onComplete = function () {
					$('#w2ui-popup .w2ui-popup-btn').on('click', function (event) {
						w2popup.close();
						if (typeof callBack == 'function') callBack(event.target.id);
					});
				}
			},
			onKeydown: function (event) {
				switch (event.originalEvent.keyCode) {
					case 13: // enter
						if (typeof callBack == 'function') callBack('Yes');
						w2popup.close();
						break
					case 27: // esc
						if (typeof callBack == 'function') callBack('No');
						w2popup.close();
						break
				}
			}
		});
	}
};
