/**
 * Auto optimize assets
 */
! function( $ ) {
	"use strict";

	/**
	 * @class AutoOptimizeAssets
	 */
	function AutoOptimizeAssets() {
		const self = this;

		// Private "Variabels"
		self.assets = {};
		self._ajaxData = {
			action: 'us_auto_optimize_assets',
		};

		// Bondable events
		self._events = {
			onClickButton: self.onClickButton.bind( self ),
			onClearMessage: self.onClearMessage.bind( self ),
		};

		// Elements
		self.$container = $( '[data-name="optimize_assets_start"]' );
		self.$button = $( '.usof-button.type_auto_optimize', self.$container );
		self.$message = $( '.usof-message.type_auto_optimize', self.$container );

		// Load data
		if ( self.$button.is( '[onclick]' ) ) {
			$.extend( self._ajaxData, self.$button[0].onclick() || {} );
			self.$button.removeAttr( 'onclick' );
		}

		$( '.usof-checkbox-list input[name="assets"]', self.$container ).each( ( _, input ) => {
			self.assets[ input.value ] = input;
		} );

		// Events
		self.$container
			.on( 'click', '.usof-button.type_auto_optimize', self._events.onClickButton )
			.on( 'change', 'input[name="assets"]', self._events.onClearMessage );
	}

	// AutoOptimizeAssets API
	$.extend( AutoOptimizeAssets.prototype, {

		/**
		 * Button click.
		 *
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		onClickButton: function() {
			const self = this;
			if ( self.$button.hasClass( 'loading' ) ) {
				return;
			}
			self.$button.addClass( 'loading' );
			self._request( 'request' );
			self.showMessage( '' );
		},

		/**
		 * Clear message.
		 *
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		onClearMessage: function() {
			this.$message.addClass( 'hidden' ).text( '' );
		},

		/**
		 * Shows the message.
		 *
		 * @param {String} content
		 */
		showMessage: function( content ) {
			content = $ush.toString( content );
			this.$message
				.toggleClass( 'hidden', content === '' )
				.html( content );
		},

		/**
		 * Ajax Requests.
		 *
		 * @param {String} type Request type
		 */
		_request: function( type ) {
			const self = this;

			$.post( $usof.ajaxUrl, $.extend( self._ajaxData, { type: type } ), ( res ) => {
				if ( res.data.processing ) {
					self._request( 'iteration' );
				} else {
					self.$button.removeClass( 'loading' );

					// Show message
					if ( $ush.toString( res.data.message ).trim() ) {
						self.showMessage( res.data.message );
					}

					// Reset checkboxes
					$( 'input[type="checkbox"]', self.$container )
						.prop( 'checked', false );

					// Selected checkboxes
					if ( res.data.used_assets ) {
						$.each( res.data.used_assets, ( _, asset_name ) => {
							if ( self.assets.hasOwnProperty( asset_name ) ) {
								$( self.assets[ asset_name ] ).prop( 'checked', true );
							}
						} );

						// Save Changes
						$usof.instance.valuesChanged[ 'assets' ] = res.data.assets_value;
						$usof.instance.saveChanges();
					}
				}
			}, 'json' );
		}

	} );

	$( () => new AutoOptimizeAssets );

}( jQuery );
