/**
 * Available spaces:
 *
 * _window.$usb - Basic object for mounting and initializing all extensions of the builder
 * _window.$usbcore - Auxiliary functions for the builder and his extensions
 * _window.$ush - US Helper Library
 *
 * Note: Double underscore `__funcname` is introduced for functions that are created through `$ush.debounce(...)`.
 */
! function( $, undefined ) {

	const _window = window;

	if ( ! _window.$usb ) {
		return;
	}

	_window.$ush = _window.$ush || {};
	_window.$usbcore = _window.$usbcore || {};

	/**
	 * @type {{}} Private temp data
	 */
	var _$tmp = {
		template: '' // navigator element template
	};

	/**
	 * @class Navigator - Shortcode navigator functionality in the page content (right sidebar)
	 * @param {String} container The container
	 */
	function Navigator( container ) {
		const self = this;

		// Bondable events
		self._events = {
			contentChange: self._contentChange.bind( self ),
			duplicateElm: self._duplicateElm.bind( self ),
			expand: self._expand.bind( self ),
			expandAll: self._expandAll.bind( self ),
			hide: self._hide.bind( self ),
			iframeReady: self._iframeReady.bind( self ),
			panelShowMessage: self._panelShowMessage.bind( self ),
			removeElm: self._removeElm.bind( self ),
			scrollTo: self._scrollTo.bind( self ),
			selectedElm: self._selectedElm.bind( self ),
			shortcodeChanged: self._shortcodeChanged.bind( self ),
			showPreloader: self._showPreloader.bind( self ),
			switch: self._switch.bind( self ),
			urlManager: self._urlManager.bind( self ),
		};

		$( () => {

			// Elements
			self.$container = $( container );
			self.$body = $( '.usb-navigator-body', self.$container );

			// Actions
			self.$actionHide = $( '.usb_action_navigator_hide', self.$container );
			self.$actionSwitch = $( '.usb_action_switch_navigator', $usb.$panel );
			self.$actionExpandAll = $( '.usb_action_navigator_expand_all', self.$container );

			// Events
			self.$container
				// Handler for hide the navigator
				.on( 'click', '.usb_action_navigator_hide', self._events.hide )
				// Handler for open or close all containers in the navigator
				.on( 'click', '.usb_action_navigator_expand_all', self._events.expandAll )
				// Handler for open or close container in the navigator
				.on( 'click', '.usb_action_navigator_expand', self._events.expand )
				// Handler for selected element via navigator
				.on( 'click', '.usb-navigator-item-header', $ush.debounce( self._events.selectedElm, 0.5 ) )
				// Handler for duplicate element via navigator
				.on( 'click', '.usb_action_navigator_duplicate_elm', self._events.duplicateElm )
				// Handler for remove element via navigator
				.on( 'click', '.usb_action_navigator_remove_elm', self._events.removeElm );

			$usb.$panel
				// Handler for switch navigator
				.on( 'click', '.usb_action_switch_navigator', self._events.switch );

			// Get item template
			var $template = $( '#usb-tmpl-navigator-item', self.$container );
			if ( $template.length ) {
				_$tmp.template = $template.html();
				$template.remove();
			}
		} );

		// Private events
		self
			.on( 'showPreloader', self._events.showPreloader );

		$usb
			.on( 'iframeReady', self._events.iframeReady )
			.on( 'builder.contentChange', self._events.contentChange )
			.on( 'navigator.scrollTo', self._events.scrollTo )
			.on( 'navigator.showPreloader', self._events.showPreloader )
			.on( 'shortcodeChanged', self._events.shortcodeChanged )
			.on( 'panel.showMessage', self._events.panelShowMessage )
			.on( 'urlManager.changed', self._events.urlManager );
	}

	// Navigator API
	$.extend( Navigator.prototype, $ush.mixinEvents, {
		/**
		 * Determines if ready
		 *
		 * @return {Boolean} True if ready, False otherwise
		 */
		isReady: function() {
			return ! $ush.isUndefined( this.$container );
		},

		/**
		 * Determines if show navigator
		 *
		 * @return Returns true if the navigator is show, otherwise false
		 */
		isShow: function() {
			return $usb.urlManager.hasParam( 'navigator', /* value */'show' );
		},

		/**
		 * Handler for display switch
		 *
		 * @event handler
		 */
		_switch: function() {
			const urlManager = $usb.urlManager;
			if ( ! this.isShow() ) {
				urlManager.setParam( 'navigator', 'show' );
			} else {
				urlManager.removeParam( 'navigator' );
			}
			urlManager.push();
		},

		/**
		 * Hide navigator via action
		 *
		 * @event handler
		 */
		_hide: function() {
			$usb.urlManager.removeParam( 'navigator' ).push();
		},

		/**
		 * Show navigator
		 */
		show: function() {
			const self = this;
			if ( $usb.builder.isEmptyContent() ) {
				return;
			}
			self.$container.addClass( 'show' );
			self.$actionSwitch.addClass( 'active' );

			self.redraw();
		},

		/**
		 * Hide navigator
		 */
		hide: function() {
			this.$container.removeClass( 'show' );
			this.$actionSwitch.removeClass( 'active' );
		},

		/**
		 * Handler for scroll to navigator item
		 * Note: Scroll to the element only when the element is outside
		 * the visible part of the window
		 *
		 * @event handler
		 * @param {String} id Shortcode's usbid, e.g. "us_btn:1"
		 */
		_scrollTo: function( id ) {
			const self = this;
			if (
				! self.isShow()
				|| ! $usb.builder.isValidId( id )
			) {
				return;
			}

			var $body = self.$body,
				$item = $( `[data-for="${id}"]`, $body );

			if ( ! $item.length ) {
				return;
			}

			// If the element is not outside the view, then exit
			const rect = $ush.$rect( $item[0] );
			if ( ! ( rect.top < 0 || rect.bottom > ( $body.height() || rect.height ) ) ) {
				return;
			}
			// Get the navigator header height
			var headerHeight = $( '.usb-navigator-header', self.$container ).height();
			$body[0].scrollTo( /* x */0, /* y */rect.top + $body.scrollTop() - headerHeight ); // scroll to item
		},

		/**
		 * Show duplicate preloader
		 *
		 * @event handler
		 * @param {String} id Shortcode's usbid, e.g. "us_btn:1"
		 */
		_showPreloader: function( id ) {
			const self = this;
			if (
				! self.isShow()
				|| ! $usb.builder.doesElmExist( id )
			) {
				return;
			}

			// Get item node and create clone node
			var $item = $( `[data-for="${id}"]`, self.$body ),
				$duplicateItem = $item.clone()
					.removeAttr( 'data-for' )
					.removeClass('expand active')
					.addClass( 'duplicate' );

			// Add and show preloader
			$( '> .usb-navigator-item-header .usb-navigator-item-title > i', $duplicateItem )
				.after( '<span class="usof-preloader"></span>' )
				.addClass( 'hidden' );

			// Add clone node to body
			$item.after( $duplicateItem );
		},

		/**
		 * Handler for expand or collapse item in navigator
		 *
		 * @event handler
		 * @param {Event} e
		 */
		_expand: function( e ) {
			const $item = $( e.target ).closest( '[data-for]' );
			if ( $item.length ) {
				$item.toggleClass( 'expand', ! $item.hasClass( 'expand' ) );
			}
		},

		/**
		 * Handler for expand or collapse all items in navigator
		 *
		 * @event handler
		 */
		_expandAll: function() {
			const self = this;
			const $action = self.$actionExpandAll;
			const $items = $( '[data-for].has_children', self.$body ).add( $action );

			if ( ! $action.hasClass( 'expand' ) ) {
				$items.addClass( 'expand' );
			} else {
				$items.removeClass( 'expand' );
			}
		},

		/**
		 * Selected element via navigator
		 *
		 * @event handler
		 * @param {Event} e
		 */
		_selectedElm: function( e ) {
			const $target = $( e.target );
			const id = $target.closest( '[data-for]' ).data( 'for' );

			// Exit if you click on the expand icon
			if ( $target.hasClass( 'usb_action_navigator_expand' ) ) {
				return
			}

			// Scroll to an element if it is outside the preview
			// Note: Scrolling should work even if the element is already selected
			$ush.timeout( () => {
				$usb.postMessage( 'doAction', [ 'scrollToOutsideElm', id ] );
			}, 100 );

			// Select element by id
			if ( $usb.builder.selectedElmId !== id ) {
				$usb.trigger( 'builder.elmSelected', id );
			}
		},

		/**
		 * Handler for duplicate element via navigator
		 *
		 * @event handler
		 * @param {Event} e
		 * @return {Boolean} Returns false to stop further execution of event handlers
		 */
		_duplicateElm: function( e ) {
			const id = $( e.target ).closest( '[data-for]' ).data( 'for' );
			if ( ! $usb.builder.doesElmExist( id ) ) {
				return false;
			}
			this.trigger( 'showPreloader', id );
			$usb.trigger( 'builder.elmDuplicate', id );

			return false;
		},

		/**
		 * Handler for remove element via navigator
		 *
		 * @event handler
		 * @param {Event} e
		 */
		_removeElm: function( e ) {
			const id = $( e.target ).closest( '[data-for]' ).data( 'for' );
			if ( $usb.builder.doesElmExist( id ) ) {
				$usb.trigger( 'builder.elmDelete', id );
			}
		},

		/**
		 * Remove an element via navigator
		 *
		 * @param {String} id Shortcode's usbid, e.g. "vc_row:1"
		 */
		removeElm: function( id ) {
			const self = this;
			if (
				! self.isShow()
				|| ! $usb.builder.isValidId( id )
			) {
				return;
			}
			$( `[data-for="${id}"]:first`, self.$body ).remove();
		},

		/**
		 * Set the active item in navigator
		 *
		 * @param {String} id Shortcode's usbid, e.g. "vc_row:1"
		 * @param {Boolean} expandParents The expand all parents
		 */
		setActive: function( id, expandParents ) {
			const self = this;
			if (
				! self.isShow()
				|| ! $usb.builder.doesElmExist( id )
			) {
				return;
			}
			self.resetActive();

			// Activate the selected item and expand all parents
			$( `[data-for="${id}"]`, self.$body )
				.addClass( 'active' )
				.parents( '[data-for]' )
				.toggleClass( 'expand', !! expandParents );
		},

		/**
		 * Reset an active item in navigator
		 */
		resetActive: function() {
			const self = this;
			if ( self.isShow() ) {
				$( '[data-for].active', self.$body ).removeClass( 'active' );
			}
		},

		/**
		 * Enable/Disable button switch
		 *
		 * @param {Boolean} isDisabled is disabled switch button
		 */
		buttonControl: function( isDisabled ) {
			this.$actionSwitch.toggleClass( 'disabled', isDisabled );
		},

		/**
		 * Redraw the item
		 * Note: The synchronization method can be called many times, so it must be fast!
		 */
		redraw: function() {
			const self = this;

			// Exit if there is no content, will not load iframe or hidden navigator
			if (
				$usb.iframeIsReady !== true
				|| $usb.builder.isEmptyContent()
				|| ! self.isShow()
			) {
				return;
			}

			/**
			 * Create a navigation of elements
			 *
			 * @param {String} id Shortcode's usbid, e.g. "vc_row:1"
			 * @param {Node|DocumentFragment} node The container into which the result will be added
			 * @return {DocumentFragment|Node} Returns a fragment of the element structure
			 */
			const getItems = ( elmsId, node, level ) => {
				if ( ! Array.isArray( elmsId ) || elmsId.length === 0 ) {
					return node;
				}
				level++;
				elmsId.map( ( elmId ) => {

					const attrId = $usb.builder.getElmValue( elmId, 'el_id', '' );

					// Create a navigator node from a template
					const $item = $( $usb.buildString( _$tmp.template, {
						attr_id: ( attrId ? '#' + attrId : '' ),
						in_editor_name: $usb.builder.getElmValue( elmId, 'row_title', '' ),
						elm_icon: $usb.config( 'elm_icons.' + $usb.builder.getElmName( elmId ), 'no-icon' ), // the element icon
						elm_title: $usb.builder.getElmTitle( elmId ),
						elm_type: $usb.builder.getElmType( elmId ),
						usbid: elmId,
					} ) );

					// Get the children of the current item
					var itemChildren = $usb.builder.getElmChildren( elmId );
					if ( itemChildren.length ) {
						getItems( itemChildren, $item, level );

						$item // expand of containers if previously expanded
							.addClass( 'has_children' )
							.toggleClass( 'expand', $( `[data-for="${elmId}"].expand`, self.$body ).length > 0 );
					}

					$item.addClass( `level_${level}` );
					node.append( $item.get(0) );
				} );

				return node;
			}

			// Get the structure of elements start from the $usb.builder.mainContainer
			self.$body.html( getItems( $usb.builder.getElmChildren( $usb.builder.mainContainer ), new DocumentFragment, /* level */0 ) );

			// Set the active item
			self.setActive( $usb.builder.selectedElmId, /* expand parent */true );
		},

		/**
		 * Show the panel messages
		 *
		 * @event handler
		 */
		_panelShowMessage: function() {
			this.resetActive();
		},

		/**
		 * Handler for changed in shortcode
		 *
		 * @param {{}} data The updated data
		 * @event handler
		 */
		_shortcodeChanged: function( data ) {
			const self = this;

			if ( ! $.isPlainObject( data ) ) {
				return;
			}

			// Reactive update of the id attribute display in the navigator
			if ( self.isShow() && data.name === 'el_id' ) {
				if ( data.value ) {
					data.value = '#' + data.value;
				}
				$( `[data-for="${data.id}"] .for_attr_id:first`, self.$body ).text( data.value );
			}
		},

		/**
		 * The handler is called after any changes on the page
		 *
		 * @event handler
		 */
		_contentChange: function() {
			const self = this;

			// Disabled/Enable switch navigation button
			const isEmptyContent = $usb.builder.isEmptyContent();
			if ( isEmptyContent ) {
				self.hide();
			}
			self.buttonControl( /* isDisabled */isEmptyContent );

			// Redraw the element tree
			if ( ! isEmptyContent && self.isShow() ) {
				$ush.debounce_fn_1ms( self.redraw.bind( self ) );
			}
		},

		/**
		 * Iframe ready event handler
		 *
		 * @event handler
		 */
		_iframeReady: function() {
			const self = this;
			const isEmptyContent = $usb.builder.isEmptyContent();

			self.buttonControl( isEmptyContent );

			if ( ! isEmptyContent ) {
				self._urlManager( $usb.urlManager.getDataOfChange() );
			}

			if ( self.isShow() ) {
				$ush.timeout( self.redraw.bind( self ), 1 );
			}
		},

		/**
		 * Handler of change or move event on the history stack
		 *
		 * @event handler
		 * @param {{}|undefined} state Data object associated with history and current loaction
		 */
		_urlManager: function( state ) {
			const self = this;

			if ( ! self.isReady() ) {
				return;
			}

			// Hide for the "Site Settings" page
			if ( self.isShow() && state.setParams.action === $usb.config( 'actions.site_settings' ) ) {
				self.hide();
				return;
			}

			// Show or hide "Navigator"
			if ( $usb.urlManager.hasParam( 'navigator', 'show' ) ) {
				self.show();
			} else {
				self.hide();
			}
		}
	} );

	// Export API
	$usb.navigator = new Navigator( /*container*/'#usb-navigator' );

} ( jQuery );
