! function( $, _undefined ) {
	"use strict";

	window.usGlobalData = window.usGlobalData || {};

	const Default = {
		ajax_url: '',
		find_elements: {},
		replace_elements: {},
		reset_elements: {},
		translations: {},
	};

	const MESSAGE_TYPE = {
		SUCCESS: 'success',
		DANGER: 'danger',
	};

	/**
	 * @class usReplacer - Grid to List Replacer
	 */
	function usReplacer() {
		const self = this;

		// Elements
		self.$container = $( '#us-replacer' );
		self.$content = $( '.usr-content', self.$container );
		self.$message = $( '.usr-message', self.$container );

		// Buttons
		self.$btnFindElements = $( '.on-find_elements', self.$container );
		self.$btnClearResults = $( '.on-сlear_results', self.$container );
		self.$btnReplaceElements = $( '.on-replace_elements', self.$container );
		self.$btnDeleteBackups = $( '.on-delete_backups', self.$container );
		self.$btnRestoreFromBackups = $( '.on-restore_from_backups', self.$container );

		// Private "Variables"
		self.data = $.extend( true, Default, window.usGlobalData['usReplacer'] || {} );
		self.xhr;

		// Bondable events
		self._events = {
			onClearResults: self.onClearResults.bind( self ),
			onDeleteBackups: self.onDeleteBackups.bind( self ),
			onFindElements: self.onFindElements.bind( self ),
			onProcessing: self.onProcessing.bind( self ),
			onReplaceElements: self.onReplaceElements.bind( self ),
			onRestoreFromBackups: self.onRestoreFromBackups.bind( self ),
		};

		// Events
		self.$container
			.on( 'usr.processing', 'button[class*="on-"]', self._events.onProcessing )
			.on( 'click', '.on-find_elements', self._events.onFindElements )
			.on( 'click', '.on-replace_elements', self._events.onReplaceElements )
			.on( 'click', '.on-сlear_results', self._events.onClearResults )
			.on( 'click', '.on-delete_backups', self._events.onDeleteBackups )
			.on( 'click', '.on-restore_from_backups', self._events.onRestoreFromBackups );
	}

	// Export API
	$.extend( usReplacer.prototype, {

		/**
		 * Get translation text.
		 *
		 * @param {String} text
		 * @return {String}
		 */
		__: function( text ) {
			return String( this.data.translations[ text ] || text );
		},

		/**
		 * Clear message.
		 */
		clearMessage: function() {
			this.$message
				.each( ( _, node ) => { node.className = String( node.className ).replace( /\s?type_([\dA-z]+)/, '' ) } )
				.addClass( 'hidden' );
		},

		/**
		 * Show message.
		 *
		 * @param {String} text
		 * @param {String} type
		 */
		showMessage: function( text, type ) {
			const self = this;
			self.clearMessage();
			if ( Object.values( MESSAGE_TYPE ).includes( type ) ) {
				self.$message.addClass( `type_${type}` );
			}
			self.$message.html( String( text ) ).removeClass( 'hidden' );
		},

		/**
		 * Toggle process state.
		 *
		 * @param {Event} e
		 * @param {Boolean} isActive Indicates if active.
		 */
		onProcessing: function( e, isActive ) {
			const self = this;
			const $target = $( e.currentTarget );

			if ( ! $target.data( 'origname' ) ) {
				$target.data( 'origname', $target.html() );
			}

			$target
				.toggleClass( 'processing', isActive )
				.html( isActive ? self.__( 'processing' ) : $target.data( 'origname' ) )
				.blur();
		},

		/**
		 * Find Deprecated Elements.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		onFindElements: function( e ) {
			const self = this;

			self.clearMessage();
			self.$btnFindElements.trigger( 'usr.processing', true );

			self.xhr = $.ajax( {
				type: 'post',
				url: self.data.ajax_url,
				dataType: 'json',
				cache: false,
				data: self.data.find_elements,
				success: ( res ) => {
					if ( ! res.success ) {
						self.showMessage( res.data.message, MESSAGE_TYPE.DANGER );
					}
					else if ( res.data.message ) {
						self.showMessage( res.data.message, MESSAGE_TYPE.SUCCESS );
					}
					if ( res.data.found_posts === false ) {
						return;
					}
					else if ( res.data.content ) {
						self.$content.html( res.data.content );
						self.$container.addClass( 'has_content' );
					}
				},
				complete: () => {
					self.$btnFindElements.trigger( 'usr.processing', false );
				}
			} );
		},

		/**
		 * Clear Search Results.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		onClearResults: function( e ) {
			const self = this;

			self.clearMessage();
			self.$content.addClass( 'disabled' );
			self.$btnClearResults.trigger( 'usr.processing', true );

			self.xhr = $.ajax( {
				type: 'post',
				url: self.data.ajax_url,
				dataType: 'json',
				cache: false,
				data: self.data.сlear_results,
				success: ( res ) => {
					if ( ! res.success ) {
						self.showMessage( res.data.message, MESSAGE_TYPE.DANGER );
					}
					self.$content.text( '' );
				},
				complete: () => {
					self.$content.removeClass( 'disabled' );
					self.$container.removeClass( 'has_content' );
					self.$btnClearResults.trigger( 'usr.processing', false );
				}
			} );
		},

		/**
		 * Replace Found Elements.
		 *
		 * @event handler
		 * @param {Event} e
		 */
		onReplaceElements: function( e ) {
			const self = this;

			self.clearMessage();

			const items = {};
			const ids = [];

			$( '[data-post-id]', self.$content ).each( ( _, node ) => {
				const $node = $( node );
				const post_id = $node.data( 'post-id' );
				const $checkbox = $( 'input[type="checkbox"]:first', node );

				// For manual selection (for tests only).
				if ( $checkbox.length && $checkbox.is( ':checked' ) === false ) {
					return;
				}

				ids.push( post_id );
				items[ post_id ] = $node;
			} );

			if ( $.isEmptyObject( items ) ) {
				return;
			}

			const doReplaceElements = ( post_id ) => {
				return new Promise( ( resolve, reject ) => {
					items[ post_id ].addClass( 'processing' );
					$.ajax( {
						type: 'post',
						url: self.data.ajax_url,
						dataType: 'json',
						cache: false,
						data: $.extend( { post_id: post_id }, self.data.replace_elements ),
						success: ( res ) => {
							if ( ! res.success ) {
								self.showMessage( res.data.message, MESSAGE_TYPE.DANGER );
							}
							items[ post_id ].removeClass( 'processing' ).addClass( 'done' );
							resolve( res.data );
						},
						error: ( xhr ) => {
							self.showMessage( xhr.responseText, MESSAGE_TYPE.DANGER );
							reject( xhr );
						}
					} );
				} );
			};

			var totalNumReplaced = 0;

			self.$btnClearResults.prop( 'disabled', true );
			self.$btnReplaceElements.trigger( 'usr.processing', true );
			self.$btnDeleteBackups.prop( 'disabled', true );
			const checkQueue = ( res ) => {

				totalNumReplaced += parseInt( res.num_replaced );

				if ( ids.length === 0 ) {
					self.$btnClearResults.prop( 'disabled', false );
					self.$btnReplaceElements.trigger( 'usr.processing', false );
					self.$btnDeleteBackups.prop( 'disabled', false );
					self.showMessage( self.__( 'elms_have_been_replaced' ).replace( '%s', totalNumReplaced ), MESSAGE_TYPE.SUCCESS );
					self.$container.addClass( 'replaced has_backups' );
					return;
				}
				doReplaceElements( ids.shift() ).then( checkQueue );
			};
			doReplaceElements( ids.shift() ).then( checkQueue );
		},

		/**
		 * Restore Deprecated Elements from Backup.
		 *
		 * @event handler
		 */
		onRestoreFromBackups: function() {
			const self = this;

			self.clearMessage();
			self.$btnFindElements.prop( 'disabled', true );
			self.$btnRestoreFromBackups.trigger( 'usr.processing', true );
			self.$btnDeleteBackups.prop( 'disabled', true );

			self.xhr = $.ajax( {
				type: 'post',
				url: self.data.ajax_url,
				dataType: 'json',
				cache: false,
				data: self.data.restore_from_backups,
				success: ( res ) => {
					if ( ! res.success ) {
						self.showMessage( res.data.message, MESSAGE_TYPE.DANGER );
					}
					if ( self.$container.hasClass( 'has_content' ) ) {
						$( '[data-post-id]', self.$container ).removeClass( 'done replaced' );
					}
					self.showMessage( self.__( 'restore_backups_completed' ), MESSAGE_TYPE.SUCCESS );
					self.$container.removeClass( 'replaced' );
				},
				complete: () => {
					self.$btnFindElements.prop( 'disabled', false );
					self.$btnRestoreFromBackups.trigger( 'usr.processing', false );
					self.$btnDeleteBackups.prop( 'disabled', false );
				}
			} );
		},

		/**
		 * Delete Backup.
		 *
		 * @event handler
		 */
		onDeleteBackups: function() {
			const self = this;
			if ( ! confirm( self.__( 'confirm_delete_backups' ) ) ) {
				return;
			}

			self.clearMessage();
			self.$btnDeleteBackups.trigger( 'usr.processing', true );

			self.xhr = $.ajax( {
				type: 'post',
				url: self.data.ajax_url,
				dataType: 'json',
				cache: false,
				data: self.data.delete_backups,
				success: ( res ) => {
					if ( ! res.success ) {
						self.showMessage( res.data.message, MESSAGE_TYPE.DANGER );
					}
					self.$container.removeClass( 'has_backups replaced' );
					self.showMessage( self.__( 'backups_deleted' ), MESSAGE_TYPE.SUCCESS );
				},
				complete: () => {
					self.$btnDeleteBackups.trigger( 'usr.processing', false );
				}
			} );
		},
	} );

	$( () => window.usReplacer = new usReplacer );

} ( jQuery );
