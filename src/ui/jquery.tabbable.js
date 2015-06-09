/*!
 * jQuery.tabbable 1.0 - Simple utility for selecting the next / previous ':tabbable' element.
 * https://github.com/marklagendijk/jQuery.tabbable
 *
 * Includes ':tabbable' and ':focusable' selectors from jQuery UI Core
 *
 * Copyright 2013, Mark Lagendijk
 * Released under the MIT license
 *
 */
(function($){
	'use strict';

	/**
	 * Focusses the next :focusable element. Elements with tabindex=-1 are focusable, but not tabable.
	 * Does not take into account that the taborder might be different as the :tabbable elements order
	 * (which happens when using tabindexes which are greater than 0).
	 */
	$.focusNext = function(container, isLoop, onChangingFocus){
		selectNextTabbableOrFocusable(':focusable', container, isLoop, onChangingFocus);
	};

	/**
	 * Focusses the previous :focusable element. Elements with tabindex=-1 are focusable, but not tabable.
	 * Does not take into account that the taborder might be different as the :tabbable elements order
	 * (which happens when using tabindexes which are greater than 0).
	 */
	$.focusPrev = function(container, isLoop, onChangingFocus){
		return selectPrevTabbableOrFocusable(':focusable', container, isLoop, onChangingFocus);
	};

	/**
	 * Focusses the next :tabable element.
	 * Does not take into account that the taborder might be different as the :tabbable elements order
	 * (which happens when using tabindexes which are greater than 0).
	 */
	$.tabNext = function(container, isLoop, onChangingFocus){
		return selectNextTabbableOrFocusable(':tabbable', container, isLoop, onChangingFocus);
	};

	/**
	 * Focusses the previous :tabbable element
	 * Does not take into account that the taborder might be different as the :tabbable elements order
	 * (which happens when using tabindexes which are greater than 0).
	 */
	$.tabPrev = function(container, isLoop, onChangingFocus){
		return selectPrevTabbableOrFocusable(':tabbable', container, isLoop, onChangingFocus);
	};

	function selectNextTabbableOrFocusable(selector, container, isLoop, onChangingFocus){
		if(!container) {
			container = document;
		}
		var selectables = jQuery(container).find(selector);
		var current = $(':focus');
		var nextIndex = 0;
		if(current.length === 1){
			var currentIndex = selectables.index(current);
			if(currentIndex + 1 < selectables.length){
				nextIndex = currentIndex + 1;
			} else {
				if(isLoop) {
					nextIndex = 0;
				}
			}
		}

		var jqEl = selectables.eq(nextIndex);
		var canFocus = true;
		if(onChangingFocus) {
			canFocus = onChangingFocus(jqEl[0], false);
		}
		if(canFocus) {
			jqEl.focus();
		}
		return jqEl[0];
	}

	function selectPrevTabbableOrFocusable(selector, container, isLoop, onChangingFocus){
		if(!container) {
			container = document;
		}
		var selectables = jQuery(container).find(selector);
		var current = $(':focus');
		var prevIndex = selectables.length - 1;
		if(current.length === 1){
			var currentIndex = selectables.index(current);
			if(currentIndex > 0){
				prevIndex = currentIndex - 1;
			} else {
				if(isLoop) {
					prevIndex = selectables.length - 1;
				}
			}
		}

		var jqEl = selectables.eq(prevIndex);
		var canFocus = true;
		if(onChangingFocus) {
			canFocus = onChangingFocus(jqEl[0], true);
		}
		if(canFocus) {
			jqEl.focus();
		}
		return jqEl[0];
	}

	/**
	 * :focusable and :tabbable, both taken from jQuery UI Core
	 */
	$.extend($.expr[ ':' ], {
		data: $.expr.createPseudo ?
			$.expr.createPseudo(function(dataName){
				return function(elem){
					return !!$.data(elem, dataName);
				};
			}) :
			// support: jQuery <1.8
			function(elem, i, match){
				return !!$.data(elem, match[ 3 ]);
			},

		focusable: function(element){
			return focusable(element, !isNaN($.attr(element, 'tabindex')));
		},

		tabbable: function(element){
			var tabIndex = $.attr(element, 'tabindex'),
				isTabIndexNaN = isNaN(tabIndex);
			return ( isTabIndexNaN || tabIndex >= 0 ) && focusable(element, !isTabIndexNaN);
		}
	});

	/**
	 * focussable function, taken from jQuery UI Core
	 * @param element
	 * @returns {*}
	 */
	function focusable(element){
		var map, mapName, img,
			nodeName = element.nodeName.toLowerCase(),
			isTabIndexNotNaN = !isNaN($.attr(element, 'tabindex'));
		if('area' === nodeName){
			map = element.parentNode;
			mapName = map.name;
			if(!element.href || !mapName || map.nodeName.toLowerCase() !== 'map'){
				return false;
			}
			img = $('img[usemap=#' + mapName + ']')[0];
			return !!img && visible(img);
		}
		return ( /input|select|textarea|button|object/.test(nodeName) ?
			!element.disabled :
			'a' === nodeName ?
				element.href || isTabIndexNotNaN :
				isTabIndexNotNaN) &&
			// the element and all of its ancestors must be visible
			visible(element);

		function visible(element){
			return $.expr.filters.visible(element) && !$(element).parents().addBack().filter(function(){
				return $.css(this, 'visibility') === 'hidden';
			}).length;
		}
	}
})(jQuery);