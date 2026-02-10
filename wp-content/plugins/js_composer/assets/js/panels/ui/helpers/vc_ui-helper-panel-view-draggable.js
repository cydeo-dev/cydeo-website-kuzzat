( function () {
	'use strict';

	window.vc.HelperPanelViewDraggable = {
		draggable: true,
		draggableOptions: {
			iframeFix: true,
			handle: '[data-vc-ui-element="panel-heading"]'
		},
		uiEvents: {
			'show': 'initDraggable'
		},
		initDraggable: function () {
			// Disable draggable for mobile devices.
			// It triggers an overlay div over the iframe, don't need draggable on mobile anyway.
			if ( window.matchMedia( '(max-width: 767px )' ).matches ) {
				return;
			}

			var _this = this;
			this.$el.draggable( _.extend({}, this.draggableOptions, {
				start: function () {
					if ( vc.$frame && vc.$frame.length ) {
						// If the frame exists, we disable pointer events on it to allow dragging without interference.
						// This is necessary to prevent the iframe from capturing mouse events while dragging.
						vc.$frame.css( 'pointer-events', 'none' );
					}
					_this.fixElContainment();
				},
				stop: function () {
					if ( vc.$frame && vc.$frame.length ) {
						vc.$frame.css( 'pointer-events', 'auto' );
					}
					_this.fixElContainment();
				}
			}) );
		}
	};
})();
