/**
 * Panel for indexing filter items.
 */
! function( $, _undefined ) {
	"use strict";

	const _window = window;

	/**
	 * @class IndexFilters
	 */
	function IndexFilters( selector ) {
		const self = this;

		// Private "Variables"
		self.opts = {
			ajaxData: {},
		};
		self.xhr = {}; // XMLHttpRequests instance

		// Bondable events
		self._events = {
			onClick: self.onClick.bind( self ),
		};

		// Elements
		self.$container = $( selector );
		self.$button = $( '.usof-button', self.$container );
		self.$buttonLabel = $( '.usof-button-text', self.$container );
		self.$rowCount = $( '.for_count span', self.$container );
		self.$lastIndexed = $( '.for_date span', self.$container );
		self.$message = $( '.usof-message', self.$container );

		// Load data
		if ( self.$button.is( '[onclick]' ) ) {
			$.extend( true, self.opts, self.$button[0].onclick() || {} );
		}

		// Setup controls
		if ( self.isIndexing() ) {
			self.$buttonLabel.html( self.opts.stopButtonLabel );
			self.showMessage( self.opts.message.progress );
			self.trackProgress();
		}

		// Events
		self.$container.on( 'click', '.usof-button', self._events.onClick );
	}

	// IndexFilters API
	$.extend( IndexFilters.prototype, {

		/**
		 * Determines if indexing.
		 *
		 * @return {Boolean} True if indexing, False otherwise.
		 */
		isIndexing: function() {
			return this.$button.hasClass( 'indexing' );
		},

		/**
		 * Show the message.
		 *
		 * @param {*} content The content
		 * @param {Boolean} statusError
		 */
		showMessage: function( content, statusError ) {
			content = $ush.toString( content );
			this.$message
				.toggleClass( 'hidden', content === '' )
				.toggleClass( 'status_error', statusError === true )
				.html( content );
		},

		/**
		 * Button click.
		 *
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		onClick: function() {
			const self = this;

			if ( self.isIndexing() ) {
				self.$button.addClass( 'disabled' );
				self.$button.removeClass( 'indexing' );
				self.request( 'stop-index' );

			} else {
				self.$button.addClass( 'indexing' );
				self.$buttonLabel.html( self.opts.stopButtonLabel );
				self.request( 'start-index' );
				self.trackProgress();
				self.showMessage( self.opts.message.indexing );
			}
		},

		/**
		 * Keep track of indexing progress.
		 */
		trackProgress: function() {
			const self = this;
			self.cancelTrackProgress();
			if ( self.isIndexing() ) {
				self.timeout = $ush.timeout( self.request.bind( self, 'heartbeat' ), 5000 );
			}
		},

		/**
		 * Cancel track of indexing progress.
		 */
		cancelTrackProgress: function() {
			const self = this;
			if ( self.timeout ) {
				$ush.clearTimeout( self.timeout );
			}
		},

		/**
		 * Restore button.
		 */
		restoreButton: function() {
			const self = this;
			self.cancelTrackProgress();
			self.$button.removeClass( 'indexing disabled' );
			self.$buttonLabel.html( self.opts.buttonLabel );
		},

		/**
		 * Ajax Requests.
		 *
		 * @param {String} indexerAction The indexer action.
		 */
		request: function( indexerAction ) {
			const self = this;
			self.xhr[ indexerAction ] = $.ajax(
				{
					type: 'POST',
					url: $usof.ajaxUrl,
					dataType: 'json',
					cache: false,
					data: $ush.clone( self.opts.ajaxData, { indexerAction: indexerAction } ),
					success: ( res ) => {
						if ( res.data.message ) {
							self.showMessage( res.data.message, ( ! res.success || indexerAction === 'stop-index' ) );
						}
						if (
							! res.success
							|| ! self.isIndexing()
							|| indexerAction === 'stop-index'
						) {
							self.restoreButton();
							return;
						}
						if ( res.data.row_count ) {
							self.$rowCount.text( res.data.row_count );
						}
						if ( res.data.last_indexed ) {
							self.$lastIndexed.html( res.data.last_indexed );
						}
						if ( indexerAction === 'heartbeat' ) {
							self.trackProgress();
						}
						if (  [ 'completed', 'cancelled' ].includes( res.data.status ) ) {
							self.restoreButton();
						}
					},
					error: () => {
						self.restoreButton();
					},
					complete: () => {
						delete self.xhr[ indexerAction ];
					},
				}
			);
		},

	} );

	$( () => new IndexFilters( '.usof-form-row.type_index_filter_panel' ) );

}( jQuery );
