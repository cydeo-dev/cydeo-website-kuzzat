/**
 * Available spaces:
 *
 * _window.$usb - Basic object for mounting and initializing all extensions of the builder
 * _window.$usbcore - Auxiliary functions for the builder and his extensions
 * _window.$usof - UpSolution CSS Framework
 * _window.$ush - US Helper Library
 *
 * Note: Double underscore `__funcname` is introduced for functions that are created through `$ush.debounce(...)`.
 */
! function( $, _undefined ) {

	const _window = window;

	if ( ! _window.$usb ) {
		return;
	}

	_window.$ush = _window.$ush || {};
	_window.$usbcore = _window.$usbcore || {};

	/**
	 * @type {RegExp} Regular expression for finding builder IDs
	 */
	const USBID_ATTR_REGEXP = /(\s?usbid="([^\"]+)?")/g;

	/**
	 * @type {{}} Private temp data
	 */
	var _$tmp = {
		elmsFieldset: {}, // fieldset for elements
		isFieldsetsLoaded: false, // this param will be True when fieldsets are loaded otherwise it will be False
	};

	/**
	 * @class Builder Panel - Functionality of the main builder panel (left sidebar)
	 */
	function BuilderPanel() {
		const self = this;

		/**
		 * @type {USOF Fieldset} Active fieldset object
		 */
		self.activeElmFieldset;

		/**
		 * @type {Node} Active fieldset node
		 */
		self.$activeElmFieldset;

		// Bondable events
		self._events = {

			contentChange: self._contentChange.bind( self ),
			iframeReady: self._iframeReady.bind( self ),
			resetSearch: self._resetSearch.bind( self ),
			saveChanges: self._saveChanges.bind( self ),
			searchElms: self._searchElms.bind( self ),
			showAddElms: self._showAddElms.bind( self ),
			submitPreviewChanges: self._submitPreviewChanges.bind( self ),
			switchPanel: self._switchPanel.bind( self ),
			onSwitchTabs: self.$$fieldsets.onSwitchTabs.bind( self ), // specific location
			urlManager: self._urlManager.bind( self ),
			clearBody: self.clearBody.bind( self ),

			// Import content
			changeImportContent: self._changeImportContent.bind( self ),
			saveImportContent: self._saveImportContent.bind( self ),
			showImportContent: self._showImportContent.bind( self ),

			// Fieldsets
			afterHideField: self._afterHideField.bind( self ),
			changeDesignField: self._changeDesignField.bind( self ),
			changeField: self._changeField.bind( self ),

			dataIndicatorChanged: self.dataIndicatorChanged.bind( self ),

		};

		$( () => {

			// Elements
			self.$tabElements = $( '.usb-panel-tab-elements', $usb.$panel );
			self.$elms = $( '.usb-panel-elms', $usb.$panel );
				// Search
				self.$searchElms = $( '[data-search-text]', $usb.$panel );
				self.$searchField = $( 'input[name=search]', self.$elms );
				self.$searchNoResult = $( '.usb-panel-search-noresult', self.$elms );
				// Import content
				self.$importContent = $( '.usb-panel-import-content', $usb.$panel );
				self.$importTextarea = $( '.usb-panel-import-content textarea:first', $usb.$panel );

			// Actions
			self.$actionSaveImportContent = $( '.usb_action_save_import_content', $usb.$panel );
			self.$actionAddElms = $( '.usb_action_show_add_elms', $usb.panel.$header );
			self.$actionTabAddElms = $( '.usb_action_tab_add_elms', self.$tabElements );

			// Set the builder to editor mode
			if ( $usb.panel.isShow() ) {
				$usb.builder.setMode( 'editor' );
			}

			// Events
			$usb.$panel
				// Toggles the USOF tabs of the settings panel
				.on( 'click', '.usof-tabs-item', self._events.onSwitchTabs )
				// Show the add elements
				.on( 'click', '.usb_action_show_add_elms', self._events.showAddElms )
				.on( 'click', '.usb_action_tab_add_elms', self._events.showAddElms )
				// Create revision and show a preview page
				.on( 'submit', 'form#wp-preview', self._events.submitPreviewChanges )
				// Show import content `Paste Row/Section`
				.on( 'click', '.usb_action_show_import_content', self._events.showImportContent )
				// Changes in the import content
				.on( 'change input blur', '.usb-panel-import-content textarea', self._events.changeImportContent )
				// Save pasted content button
				.on( 'click', '.usb_action_save_import_content', self._events.saveImportContent );
			self.$elms
				// Search box character input
				.on( 'input', 'input[name=search]', $ush.debounce( self._events.searchElms, 1 ) )
				// Reset search
				.on( 'click', '.usb_action_reset_search_in_panel', self._events.resetSearch );


			// Run URL manager after ready
			self._urlManager( $usb.urlManager.getDataOfChange() );

		} );

		// Private events
		$usb
			.on( 'iframeReady', self._events.iframeReady )
			.on( 'builder.contentChange', self._events.contentChange )
			.on( 'panel.switch', self._events.switchPanel )
			.on( 'panel.showAddElms', self._events.showAddElms )
			.on( 'panel.clearBody', self._events.clearBody )
			.on( 'panel.saveChanges', self._events.saveChanges )
			.on( 'hotkeys.ctrl+s', self._events.saveChanges )
			.on( 'urlManager.changed', self._events.urlManager );
	}

	/**
	 * @type {Prototype}
	 */
	const prototype = BuilderPanel.prototype;

	// Panel API
	$.extend( prototype, $ush.mixinEvents, {
		/**
		 * Hide all sections in panel
		 *
		 * @event handler
		 */
		clearBody: function() {
			const self = this;

			self._hideImportContent();
			self._hideAddElms();
			self._destroyElmFieldset();
		},

		/**
		 * Switch show/hide panel
		 *
		 * @event handler
		 */
		_switchPanel: function() {
			const isShow = $usb.panel.isShow();
			const selectedElmId = $usb.find( 'builder.selectedElmId' );

			var doActionArgs = 'hideEditableHighlight';

			if ( isShow && selectedElmId ) {
				doActionArgs = [ 'showEditableHighlight', selectedElmId ];
			}

			$usb.postMessage( 'doAction', doActionArgs );
			$usb.builder.setMode( isShow ? 'editor' : 'preview' );
		},

		/**
		 * Search for elements by name
		 *
		 * @event handler
		 */
		_searchElms: function() {
			const self = this;
			const $input = self.$searchField;
			const value = $ush.toLowerCase( $input[0].value ).trim();

			var isFoundResult = true;

			$input
				.next( '.usb_action_reset_search_in_panel' )
				.toggleClass( 'hidden', ! value );
			self.$searchElms
				.toggleClass( 'hidden', !! value );
			if ( value ) {
				isFoundResult = self.$searchElms
					.filter( `[data-search-text^="${value}"]:not(.deprecated), [data-search-text*="${value}"]:not(.deprecated)` )
					.removeClass( 'hidden' )
					.length > 0;
			}
			$( '.usb-panel-elms-list', self.$elms ).each( ( _, list ) => {
				const listIsEmpty = ! $( '[data-search-text]:not(.hidden)', list ).length;
				$( list )
					.toggleClass( 'hidden', listIsEmpty )
					.prev( '.usb-panel-elms-header' )
					.toggleClass( 'hidden', listIsEmpty );
			} );
			self.$searchNoResult.toggleClass( 'hidden', isFoundResult );
		},

		/**
		 * Reset search
		 *
		 * @event handler
		 */
		_resetSearch: function() {
			const $input = this.$searchField;
			if ( $input.val() ) {
				$input.val( '' ).trigger( 'input' );
			}
		},

		/**
		 * Handler for create revision and show a preview page
		 * Note: Going to the change preview page creates the revision for which data is needed `post_conent`
		 *
		 * @event handler
		 * @param {Event} e
		 */
		_submitPreviewChanges: function( e ) {
			const self = this;
			// Add data before send
			$( 'textarea[name="post_content"]', e.target )
				.val( $usb.builder.pageData.content );
			// Add data for custom page css (Metadata)
			$( 'textarea[name='+ $usb.config( 'keyCustomCss', '' ) +']', e.target )
				.val( $usb.builder.pageData.customCss );
		},

		/**
		 * Save post content changes
		 *
		 * @event handler
		 */
		_saveChanges: function() {
			const self = this;
			if (
				$usb.urlManager.hasParam( 'active', 'site_settings' )
				|| ! $usb.builder.isPageChanged()
				|| $usb.builder.isProcessSave()
			) {
				return;
			}

			// Disable button and enable load
			$usb.panel.switchSaveButton( /* enable */true, /* isLoading */true );

			// Save page data on the server
			$usb.builder.savePageData( /* complete */() => {
				$usb.panel.switchSaveButton( /* enable */false );
			} );
		},

		/**
		 * The handler is called after any changes on the page
		 *
		 * @event handler
		 */
		_contentChange: function() {
			$usb.panel.switchSaveButton( /* enable */$usb.builder.isPageChanged() );
		},

		/**
		 *
		 * The handler for show the add elements
		 * Note: The "Site Settings" handler is subscribed to this event
		 *
		 * @event handler
		 */
		_showAddElms: function() {
			$usb.urlManager.removeParam( 'active' ).push();
			this.showAddElms();
		},

		/**
		 * Show the section "Add elements"
		 */
		showAddElms: function() {
			const self = this;

			const $actionAddElms = self.$actionAddElms;
			// TODO: Optimize ".is( ':visible' )"
			if ( self.$tabElements.is( ':visible' ) ) {
				return;
			}

			$usb.trigger( 'panel.clearBody' );
			$usb.navigator.resetActive();
			$usb.panel.clearBody();
			$usb.postMessage( 'doAction', 'hideHighlight' );
			$usb.builder.setMode( 'editor' );

			$actionAddElms.addClass( 'active' );

			$usb.builder.selectedElmId = null;

			// Set focus to search field (Focus does not work when the developer console is open!)
			$ush.timeout( () => {
				self.$searchField[0].focus();
			}, 10 );

			self.$tabElements.removeClass( 'hidden' );

			// Selected Tab "Elements"
			if ( ! self.$actionTabAddElms.hasClass( 'active' ) ) {
				self.$actionTabAddElms.trigger( 'click' );
			}

			$usb.panel.setTitle( /* get action title */$actionAddElms.attr( 'title' ) );
			$usb.builder.initDragDrop();
		},

		/**
		 * Hide the section "Add elements"
		 */
		_hideAddElms: function() {
			const self = this;
			if ( ! $usb.panel.isReady() ) {
				return;
			}
			self.$actionAddElms.removeClass( 'active' );
			self.$tabElements.addClass('hidden');

			$usb.builder.destroyDragDrop();
		},

		/**
		 * Handler of change or move event on the history stack
		 *
		 * @event handler
		 * @param {{}|undefined} state Data object associated with history and current loaction
		 */
		_urlManager: function( state ) {
			const self = this;
			const setParams = state.setParams;

			if ( ! $usb.panel.isReady() ) {
				return;
			}
			// Show "Add elements"
			if (
				! setParams.active
				&& ! $usb.find( 'builder.selectedElmId' )
				&& setParams.action != $usb.config( 'actions.site_settings' )
			) {
				self.showAddElms();

				// Show "Paste Row/Section"
			} else if ( setParams.active == 'paste_row' ) {
				self.showImportContent();
			}
		}

	} );

	// Import content (Paste Row/Section)
	$.extend( prototype, {

		/**
		 * Show import content
		 */
		showImportContent: function() {
			const self = this;

			self.clearBody();

			$usb.builder.setMode( 'editor' );
			$usb.navigator.resetActive();
			$usb.panel.clearBody();

			self.$importContent.removeClass( 'hidden' );
			self.$importTextarea.val( '' ).removeClass( 'validate_error' );
			self.$importTextarea[0].focus();

			self.$actionSaveImportContent
				.prop( 'disabled', true )
				.addClass( 'disabled' );

			$usb.panel.setTitle( 'paste_row', /* isTranslationKey */true );
			$usb.builder.selectedElmId = null;
		},

		/**
		 * Show import content
		 *
		 * @event handler
		 */
		_showImportContent: function() {
			$usb.urlManager.setParam( 'active', 'paste_row' ).push();
		},

		/**
		 * Hide import content
		 */
		_hideImportContent: function() {
			if ( $usb.panel.isReady() ) {
				this.$importContent.addClass( 'hidden' );
			}
		},

		/**
		 * Pasted content change handler
		 *
		 * @event handler
		 * @param {Event} e
		 */
		_changeImportContent: function( e ) {
			const self = this;

			$usb.notify.closeAll();

			var target = e.target,
				pastedContent = target.value.trim();

			if ( pastedContent.indexOf( 'usbid=' ) !== -1 ) {
				pastedContent = pastedContent.replace( USBID_ATTR_REGEXP, '' );
			}

			if ( target.value !== pastedContent ) {
				target.value = pastedContent;
			}

			$( target ).removeClass( 'validate_error' );

			// Enable save button
			self.$actionSaveImportContent
				.prop( 'disabled', ! pastedContent )
				.toggleClass( 'disabled', ! pastedContent );
		},

		/**
		 * Save pasted content
		 *
		 * @event handler
		 */
		_saveImportContent: function() {
			const self = this;

			// Elements
			var $textarea = self.$importTextarea,
				$saveButton = self.$actionSaveImportContent,
				pastedContent = $textarea.val() || '';

			if ( ! pastedContent ) {
				$saveButton
					.prop( 'disabled', /* value */true )
					.addClass( 'disabled' );
				return;
			}

			// Remove html from start and end pasted сontent
			pastedContent = $usb.builder.removeHtmlWrap( pastedContent );

			// The check the correctness of the entered shortcode
			const isValid = ! (
				!/^\[vc_row([\s\S]*)\/vc_row\]$/gim.test( pastedContent )
				|| pastedContent.indexOf( '[vc_column' ) === -1
			);

			// Added helper classes
			$textarea.toggleClass( 'validate_error', ! isValid );

			// If there is an error, we will display a notification and complete the process
			if ( ! isValid ) {
				$usb.notify.add( $usb.getTextTranslation( 'invalid_data' ), NOTIFY_TYPE.ERROR );
				return;
			}

			// Disable the input field at the time of add content
			$textarea
				.prop( 'disabled', /* value */true )
				.addClass( 'disabled' );

			// Disable save button
			$saveButton
				.addClass( 'loading disabled' )
				.prop( 'disabled', /* value */true );

			// Add a unique usbid for each shortcode
			var elmId;
			pastedContent = pastedContent.replace( /\[(\w+)/g, ( match, tag, offset ) => {
				const id = $usb.builder.getSpareElmId( tag );
				// Save the ID of the first shortcode, which should be `vc_row`
				if ( 0 === offset ) {
					elmId = id;
				}
				return match + ` usbid="${id}"`;
			} );

			// Get default image
			var placeholder = $usb.config( 'placeholder', '' );

			// Search and replace use:placeholder
			pastedContent = pastedContent.replace( /use:placeholder/g, placeholder );

			// Replace images for new design options
			pastedContent = pastedContent.replace( /css="([^\"]+)"/g, ( matches, match ) => {
				if ( match ) {
					var jsoncss = ( decodeURIComponent( match ) || '' )
						.replace( /("background-image":")(.*?)(")/g, ( _, before, id, after ) => {
							return before + ( $ush.parseInt( id ) || placeholder ) + after;
						} );
					return 'css="%s"'.replace( '%s', encodeURIComponent( jsoncss ) );
				}
				return matches;
			} );

			// Check the post_type parameter
			pastedContent = pastedContent.replace( /\s?post_type="(.*?)"/g, ( match, post_type ) => {
				if ( $usb.config( 'grid_post_types', [] ).indexOf( post_type ) === - 1 ) {
					return ' post_type="post"'; // default
				}
				return match;
			} );

			// Render pasted content
			$usb.builder.renderShortcode( '_renderPastedContent', {
				data: {
					content: pastedContent,
					isReturnContent: true, // Add content to the result (This can be useful for complex changes)
				},
				// Successful request handler
				success: ( res ) => {
					if ( ! res.success || ! res.data.html ) {
						return;
					}

					$usb.history.commitChange( elmId, ACTION_CONTENT.CREATE );

					// Add pasted content to `$usb.builder.pageData.content`
					$usb.builder.pageData.content += (
						res.data.content || pastedContent.replace( /(grid_layout_data="([^"]+)")/g, 'items_layout=""' )
					);

					$usb.builder.reloadElementsMap();

					// Add html to the end of the document.
					$usb.postMessage( 'insertElm', [ $usb.builder.mainContainer, 'append', res.data.html, /* scroll into view */true ] );

					// Event for react in extensions
					$usb.trigger( 'builder.contentChange' );
				},
				// Handler to be called when the request finishes (after success and error callbacks are executed)
				complete: ( _, textStatus ) => {
					const isSuccess = ( textStatus === 'success' );

					// Disable the loader and block m or display the button depend on its status
					$saveButton
						.prop( 'disabled', isSuccess )
						.removeClass( 'loading' )
						.toggleClass( 'disabled', isSuccess );

					$textarea
						.prop( 'disabled', /* value */false )
						.removeClass( 'disabled' );

					// Clear data on successful request
					if ( isSuccess ) {
						$textarea.val('');
					}
				}
			} );
		}
	} );

	// Initialize fieldset for element edit
	$.extend( prototype, {
		/**
		 * Load all deferred field sets or specified by name
		 *
		 * @param {String} name The fieldset name
		 */
		_loadDeferredFieldsets: function( name ) {
			const self = this;
			const data = {};

			$usb.$panel.addClass( 'data_loading' );

			var requestId = 'loadDeferredFieldsets';

			// Add a name to the data object for the request and change the name
			// for the request ID to ensure that data is received asynchronously
			if ( ! $ush.isUndefined( name ) ) {
				data.name = name;
				requestId += '.name';
				$usb.$panel
					.addClass( 'show_preloader' );
			}

			$usb.ajax( requestId, {
				data: $.extend( data, {
					_nonce: $usb.config( '_nonce' ),
					action: $usb.config( 'action_get_deferred_fieldsets' ),
				} ),
				success: ( res ) => {
					if ( ! res.success ) {
						return;
					}
					const fieldsets = $.isPlainObject( res.data )
						? res.data
						: {};

					for ( const name in fieldsets ) {
						if ( !! _$tmp.elmsFieldset[ name ] ) {
							continue;
						}
						_$tmp.elmsFieldset[ name ] = fieldsets[ name ];
						self.trigger( 'fieldsetLoaded', [ name ] );
					}

					// `data_loading` - Background data load
					// `show_preloader` - Fieldset load pending
					var removeClasses = 'data_loading';
					if ( ! data.name ) {
						_$tmp.isFieldsetsLoaded = true;
						removeClasses += ' show_preloader';

					} else {
						removeClasses = ' show_preloader';
					}
					$usb.$panel.removeClass( removeClasses );
				}
			} );
		},

		/**
		 * Iframe ready event handler
		 *
		 * @event handler
		 */
		_iframeReady: function() {
			$ush.timeout( this._loadDeferredFieldsets.bind( this ), 100 );
		},

		/**
		 * Initializes the elm fieldset
		 *
		 * @param {String} id Shortcode's usbid, e.g. "us_btn:1"
		 * @param {Function} callback Callback function that will be called after load the fieldset
		 */
		initElmFieldset: function( id, callback ) {
			const self = this;
			if ( ! $usb.builder.doesElmExist( id ) ) {
				return;
			}

			$usb.panel.clearBody();

			$usb.urlManager.removeParam( 'active' ).push();

			// Get element name
			var name = $usb.builder.getElmName( id ),
				elmsSupported = $usb.config( 'elms_supported', [] ),
				elmTitle = $usb.config( `elm_titles.${name}`, name );

			// If there is no title, then the element does not support editing with the Live Builder
			if (
				! Array.isArray( elmsSupported )
				|| $usbcore.indexOf( name, elmsSupported ) < 0
			) {
				$usb.builder.selectedElmId = id;

				$usb.panel.setTitle( elmTitle );
				$usb.panel.showMessage( $usb.getTextTranslation( 'editing_not_supported' ) );
				$usb.navigator.setActive( id, /* expand parent */true );

				$usb.postMessage( 'doAction', [ 'showEditableHighlight', id ] );
				return;
			}

			// Trying to get a fieldset from a document
			if ( ! _$tmp.elmsFieldset[ name ] ) {
				$( '#usb-tmpl-fieldsets .usb-panel-fieldset[data-name]', $usb.$panel )
					.each( ( _, node ) => {
						_$tmp.elmsFieldset[ $( node ).data( 'name' ) ] = node.outerHTML;
					} )
					.remove();
			}

			// If the fieldsets have not been loaded yet, wait for the load and then show the fieldset
			if ( ! _$tmp.elmsFieldset[ name ] && ! _$tmp.isFieldsetsLoaded ) {
				$usb.panel.setTitle( elmTitle );
				self.off( 'fieldsetLoaded' );
				self.one( 'fieldsetLoaded', ( loadedName ) => {
					if ( name !== loadedName ) {
						return;
					}
					self._showElmFieldset( id );
				} );
				self._loadDeferredFieldsets( name );
				return;
			}

			self._showElmFieldset( id );
		},

		/**
		 * Show panel edit settings for shortcode
		 *
		 * @param {String} id Shortcode's usbid, e.g. "us_btn:1"
		 */
		_showElmFieldset: function( id ) {
			const self = this;

			if ( ! $usb.builder.doesElmExist( id ) ) {
				return;
			}

			const name = $usb.builder.getElmName( id );
			if ( ! name ) {
				return;
			}

			const values = $usb.builder.getElmValues( id ) || {};
			const defaultValues = $usb.config( `shortcode.default_values.${name}`, {} );

			// Set default params if there are no sets
			if ( $.isPlainObject( defaultValues ) ) {
				for ( const k in defaultValues ) if ( k !== 'content' ) {
					if ( $ush.isUndefined( values[ k ] ) ) {
						values[ k ] = defaultValues[ k ];
					}
				}
			}

			if ( $usb.$panel.hasClass( 'show_preloader' ) ) {
				$usb.$panel.removeClass( 'show_preloader' );
			}

			$usb.trigger( 'panel.clearBody' );

			// Load assets required to initialize the code editor
			if ( $usb.config( 'dynamicFieldsetAssets.codeEditor', [] ).includes( name ) ) {
				self._loadAssetsForCodeEditor();
			}

			// Set value to variables
			self.$activeElmFieldset = $( _$tmp.elmsFieldset[ name ] );
			// Note: Add html before field initialization so that all data is loaded,
			// for example: 'window.$usof.colorList'
			$usb.$panelBody.prepend( self.$activeElmFieldset );

			$usb.builder.selectedElmId = id;
			self.activeElmFieldset = new $usof.Form( self.$activeElmFieldset );

			// Add buttons and listen to changes
			self.activeElmFieldset.tabsItems = {};
			$( '.usof-tabs-item', self.$activeElmFieldset ).each( ( index, node ) => {
				self.activeElmFieldset.tabsItems[ index ] = $( node );
			} );
			self.activeElmFieldset.on( 'dataIndicatorChanged', self._events.dataIndicatorChanged );

			// Set shortcode title to header title
			$usb.panel.setTitle( $usb.builder.getElmTitle( id ) );

			// Set value to fieldsets
			self.$activeElmFieldset.addClass( 'usof-container' );
			self.activeElmFieldset.setValues( values );

			// Set the current responsive screen for $usof fields selected for edit
			if ( $usb.find( 'preview' ) ) {
				$usb.preview.setFieldResponsiveScreen();
			}

			// Initialization check and watch on field events
			// Note: The id is passed explicitly as a parameter because the callback function can be
			// called with a delay, especially when selecting elements quickly `.bind( self, id )`
			for ( const fieldId in self.activeElmFieldset.fields ) {
				const theField = self.activeElmFieldset.fields[ fieldId ];
				theField
					.on( 'change', self._events.changeField.bind( self, id ) ) // TODO:Add debounce
					.on( 'afterHide', self._events.afterHideField )
					// The event only exists in the `design_options`
					.on( 'changeDesignField', self._events.changeDesignField.bind( self, id ) )
					// Responsive screen change handler in the $usof.field
					.on( 'syncResponsiveState', ( _, screenName ) => {
						// Set a responsive screen from $usof the field
						if ( $usb.find( 'preview' ) ) {
							$usb.preview.fieldSetResponsiveScreen( screenName );
						}
					} )
					// Delegate an event from the TinyMCE to a built-in handler (keydown comes from the TinyMCE iframe)
					.on( 'tinyMCE.Keydown', ( _, e ) => $usb._events.keydown( e ) );
			}

			// Initialization check and watch on group events
			for ( const groupName in ( self.activeElmFieldset.groups || {} ) ) {
				const theGroup = self.activeElmFieldset.groups[ groupName ];
				theGroup.on( 'change', $ush.debounce( self._events.changeField.bind( self, id ), 1 ) );
			}

			// Run the method to check visible fields and manage tab display.
			self.activeElmFieldset.$tabsItems = $( '.usof-tabs-item', self.$activeElmFieldset );
			self.activeElmFieldset.$tabsSections = $( '.usof-tabs-section', self.$activeElmFieldset );
			self.$$fieldsets.updateTabsVisibility();

			$usb.builder.trigger( 'panel.afterInitFieldset' );
			$usb.postMessage( 'doAction', [ 'showEditableHighlight', id ] );
		},

		/**
		 * Destroy a set of fields for an element
		 */
		_destroyElmFieldset: function() {
			const self = this;
			if (
				! $usb.panel.isReady()
				|| ! self.isActiveElmFieldset()
			) {
				return;
			}

			if ( self.$activeElmFieldset instanceof $ ) {
				self.$activeElmFieldset.remove();
			}

			$usb.$document.off( 'usb.syncResponsiveState' );

			$usb.postMessage( 'doAction', 'hideEditableHighlight' );

			$usb.builder.selectedElmId = null;
			self.activeElmFieldset = null;
			self.$activeElmFieldset = null;
		},

		/**
		 * Load assets required to initialize the code editor
		 */
		_loadAssetsForCodeEditor: function() {
			const codeEditorAssets = ( _window.usGlobalData.deferredAssets || {} )[ 'codeEditor' ] || '';
			if ( codeEditorAssets ) {
				$usb.$body.append( codeEditorAssets );
				delete _window.usGlobalData.deferredAssets[ 'codeEditor' ];
			}
		},

		/**
		 * Field changes for a design_options
		 *
		 * Note: The selectedElmId is passed explicitly as a parameter because the callback
		 * function can be called with a delay, especially when selecting elements quickly
		 *
		 * @param {String} selectedElmId Shortcode's usbid, e.g. "us_btn:1"
		 * @param {$usof.field|$usof.Group} field
		 * @param {$usof.field} designField
		 */
		_changeDesignField: function( selectedElmId, field, designField ) {
			if ( field.type !== 'design_options' ) {
				return;
			}
			this._changeField( selectedElmId, designField, designField.getValue(), /* skip save option */true );
		},

		/**
		 * Update the shortcode with a frequency of 1ms
		 * Note: The code is moved to a separate function since `throttled` must be initialized before call
		 *
		 * @param {Function} fn The function to be executed
		 * @type throttled
		 */
		__updateShortcode: $ush.throttle( $ush.fn, 1, /* no_trailing */true ),

		/**
		 * Update content after 150ms
		 * Note: The code is moved to a separate function since `debounced` must be initialized before call
		 *
		 * @param {Function} fn The function to be executed
		 * @type debounced
		 */
		__updateShortcode_long: $ush.debounce( $ush.fn, 150 ),

		/**
		 * Update of instructions from a delay of 1s
		 * Note: The code is moved to a separate function since `throttled` must be initialized before call
		 *
		 * @param {Function} fn The function to be executed
		 * @type throttled
		 */
		__updateOnInstructions_long: $ush.throttle( $ush.fn, 1000 ),

		/**
		 * Determines if active element fieldset.
		 *
		 * @return {Boolean} True if active element fieldset, False otherwise.
		 */
		isActiveElmFieldset: function() {
			return this.activeElmFieldset instanceof $usof.Form;
		},

		/**
		 * Field changes for a fieldsets
		 *
		 * Note: The selectedElmId is passed explicitly as a parameter because the callback
		 * function can be called with a delay, especially when selecting elements quickly
		 *
		 * @event handler
		 * @param {String} selectedElmId Shortcode's usbid, e.g. "us_btn:1"
		 * @param {$usof.field|$usof.Group} usofField
		 * @param {*} _ The usofField value
		 * @param {Boolean} _skipSave Skip save option
		 */
		_changeField: function( selectedElmId, usofField, _, _skipSave ) {
			const self = this;

			// Run method to check visible fields and manage tab visibility.
			// Note: In this call, it is important to pass "this" because the object is isolated!
			self.$$fieldsets.updateTabsVisibility.call( self );

			// If there is no editable element, then exit the method
			if ( ! selectedElmId || selectedElmId !== $usb.builder.selectedElmId ) {
				return;
			}

			const isGroup = usofField instanceof $usof.Group;
			const isField = usofField instanceof $usof.field;

			// If the object is not a field or a group then exit the method
			if ( ! ( isField || isGroup ) ) {
				return;
			}

			var // Get new param value
				value = usofField.getValue(),
				// Get field type
				fieldType = ( isField ? usofField.type : 'group' ),
				// Get usb-params from field or group
				usbParams = usofField[ isField ? '$row' : '$container' ].data( 'usb-params' ) || {},
				// The get and normalization of instructions
				instructions = $usb._normalizeInstructions( usbParams['usb_preview'] );

			// The data stack for the current change call
			const _currentData = {
				elmType: $usb.builder.getElmType( selectedElmId ), // the element type
				fieldType: fieldType, // the field type
				id: selectedElmId, // the ID of selected element
				instructions: instructions, // the instructions for updating the preview
				isChangeDesignOptions: ( fieldType === 'design_options' ), // the design options updates
				// Note: Only a field can have a responsive value, not a group
				isResponsiveValue: ( isField ? usofField.isResponsiveValue( value ) : false ), // the responsive values
				name: ( usofField.name || usofField.groupName ), // the field name
				usofField: usofField, // the field object reference
				value: value, // the new value
			};

			// Execute callback functions if any
			if ( Array.isArray( instructions ) ) {

				// Get a list of callback functions for parameters
				var previewCallbacks = $.isPlainObject( _window.usGlobalData.previewCallbacks )
					? _window.usGlobalData.previewCallbacks
					: {};
				for ( const i in instructions ) {
					const funcName = $ush.toLowerCase( _currentData.elmType + '_' + _currentData.name );
					if (
						! instructions[ i ][ 'callback' ]
						|| typeof previewCallbacks[ funcName ] !== 'function'
					) {
						continue;
					}
					try {
						instructions = previewCallbacks[ funcName ]( _currentData.value ) || true;
					} catch ( err ) {
						$usb.log( 'Error executing callback function in instructions', err );
					}
				}
				// The normalization of instructions
				_currentData.instructions = $usb._normalizeInstructions( instructions );
			}

			// TODO: This needs to be fixed as this is a temporary solution, the problem is in the design settings control events!
			if (
				(
					_currentData.isChangeDesignOptions
					&& $ush.rawurldecode( value ).indexOf( '"background-image":"{{' ) > -1
				)
				|| (
					_currentData.name === 'background-image'
					&& $ush.toString( value ).indexOf( '{{' ) > -1
				)
			) {
				instructions = true;
				_skipSave = false;
			}

			/**
			 * @type {Boolean} Determine the progress of the recovery task
			 */
			_currentData.isActiveRecoveryTask = $usb.history.isActiveRecoveryTask();

			/**
			 * Update shortcode
			 *
			 * @param {{}} _currentData Current call data stack
			 * @return {Deferred} Returns a new deferred object.
			 */
			const _updateShortcode = ( _currentData ) => {
				const deferred = $.Deferred();
				const originalId = _currentData.id;

				var isUpdated = false;

				var oldShortcode = $usb.builder.getElmShortcode( originalId );
				if ( ! oldShortcode || _skipSave ) {
					return deferred.reject( isUpdated );
				}

				/**
				 * Shortcode which stores the type as content
				 * Note: `content` is a reserved name which implies that the values are the content of the
				 * shortcode for example: [example]content[/example]
				 */
				const isContent = (
					_currentData.fieldType === 'editor'
					|| _currentData.name === 'content'
				);
				const hasDefaultValue = _currentData.usofField.getDefaultValue() === _currentData.value;

				var shortcodeObj = $usb.builder.parseShortcode( oldShortcode );
				var atts = $usb.builder.parseAtts( shortcodeObj.atts );

				// Updating shortcode attributes
				if ( isContent || hasDefaultValue ) {
					delete atts[ _currentData.name ];
				} else {
					atts[ _currentData.name ] = _currentData.value;
				}
				shortcodeObj.atts = $usb.builder.buildAtts( atts );

				// Set value in shortcode content
				if ( isContent ) {
					shortcodeObj.content = _currentData.value;
				}

				// Get string shortcode
				var newShortcode = $usb.builder.buildShortcode( shortcodeObj ),
					oldParentShortcode; // the parent shortcode for the events of the year, children change, but the parent needs to be updated

				isUpdated = ( oldShortcode !== newShortcode && ! _currentData.isActiveRecoveryTask );

				// Get parent shortcode
				if ( _currentData.instructions === true && $usb.builder.isReloadParentElm( originalId ) ) {
					_currentData.id = $usb.builder.getElmParentId( _currentData.id );
					oldParentShortcode = $usb.builder.getElmShortcode( _currentData.id );
				}

				// Save shortcode to page content
				if ( isUpdated ) {
					$usb.builder.pageData.content = $ush
						.toString( $usb.builder.pageData.content )
						.replace( oldShortcode, newShortcode );
					$ush.debounce_fn_1ms( () => {
						$usb.trigger( 'builder.contentChange' );
					} );
				}

				// Get parent and update it
				if ( oldParentShortcode ) {
					oldShortcode = oldParentShortcode;
					newShortcode = $usb.builder.getElmShortcode( _currentData.id );
				}

				// Update columns or columns_layout settings
				if (
					isUpdated
					&& _currentData.elmType.indexOf( 'vc_row' ) === 0
					&& [ 'columns', 'columns_layout' ].includes( _currentData.name )
					&& $usb.builder._updateColumnsLayout( _currentData.id, _currentData.value )
				) {
					$usb.postMessage( 'showPreloader', _currentData.id );
					$usb.builder.renderShortcode( 'renderShortcode', {
						data: {
							content: $usb.builder.getElmShortcode( _currentData.id ),
						},
						success: ( res ) => {
							if ( res.success ) {
								$usb.postMessage( 'updateSelectedElm', [ _currentData.id, $ush.toString( res.data.html ) ] );
							}
						},
						complete: () => { deferred.resolve( isUpdated ); }
					} );

				} else {
					deferred.resolve( isUpdated );
				}

				// If the content of the shortcode has changed, commit to the change history
				if ( isUpdated ) {
					/**
					 * Save last changes to cache (It is important to get the data before call `_updateShortcode`)
					 * Note: The cache provides correct data when multiple threads `debounce` or `throttle` are run.
					 * TODO: Find solution to race problem (get/update, update/get) from using timeout
					 */
					$usb.history.setLatestShortcodeUpdate( {
						content: oldShortcode,
						preview: $usb.builder.getElmOuterHtml( _currentData.id )
					} );

					var commitArgs = [ _currentData.id, ACTION_CONTENT.UPDATE ];

					// Determining the field type whether the spacing is needed or not
					commitArgs.push( $usb.config( 'useThrottleForFields', [] ).includes( _currentData.usofField.type ) );

					// Add external end-to-end data
					if ( oldParentShortcode ) {
						commitArgs.push( { originalId: originalId } );
					}

					// Commit to save changes to history
					$usb.history.commitChange.apply( $usb.history, commitArgs );
				}

				return deferred;
			};

			/**
			 * @type {Data} Data class instance
			 */
			const cache = $usbcore.cache( '_changeField' );

			// Update the shortcode with a specified delay and receive data from the server
			if ( _skipSave !== true && instructions === true && ! _currentData.isActiveRecoveryTask ) {
				_updateShortcode( _currentData ).always( ( isUpdated ) => {
					// Note: If there is an item update, let's remember it, because the parameter can
					// depend on the activation of other parameters, which will cause the event queue,
					// and only the last one will be handled. We should not lose the update as it is
					// usually a complex structure change
					if ( isUpdated && instructions === true ) {
						cache.set( 'shortcodeChanged', instructions );
					}

					self.__updateShortcode_long( () => {
						if ( ! isUpdated && ! cache.get( 'shortcodeChanged' ) ) {
							return;
						}
						cache.flush(); // Flushes an instance

						// Gets element ID to reboot
						var elmId = $usb.builder.getElmParentId( _currentData.id );
						if ( ! $usb.builder.isReloadElm( elmId ) ) {
							elmId = _currentData.id;
						}

						// Reload element in preview
						$usb.builder.reloadElmInPreview( elmId, () => {
							$usb.builder.trigger( 'shortcodeChanged', _currentData );
						} );
					} );
				} );
			}

			// Update the shortcode at a specified frequency
			else if ( instructions !== true ) {
				/**
				 * Update on instructions and data
				 *
				 * @param {{}} _currentData Current call data stack
				 */
				const _updateOnInstructions = ( _currentData ) => {
					_updateShortcode( _currentData ).always( ( isUpdated ) => {
						// If the shortcode data has not changed or there are no instructions,
						// then we will complete the execution at this stage
						if ( ! isUpdated || $ush.isUndefined( _currentData.instructions ) ) {
							return;
						}

						// Get HTML content to preview in Live Builder
						if ( _currentData.fieldType === 'editor' && typeof usofField.getHtmlContent === 'function' ) {
							_currentData.value = usofField.getHtmlContent();
						}
						// Converts a value string representation to a plain object
						else if ( _currentData.isResponsiveValue ) {
							_currentData.value = $ush.toPlainObject( _currentData.value );
						}
						// Spot update styles, classes or other parameters
						$usb.postMessage( 'onPreviewParamChange', [
							_currentData.id,
							_currentData.instructions,
							_currentData.value,
							_currentData.fieldType,
							_currentData.isResponsiveValue
						] );
						$usb.builder.trigger( 'shortcodeChanged', _currentData );
					} );
				};

				/**
				 * Select a wrapper to apply an interval or delay
				 */
				const _switchUpdateOnInstructions = () => {
					if ( _skipSave === true ) {
						return;
					}

					// The update occurs at a long interval
					if ( $usb.config( 'useLongUpdateForFields', [] ).includes( _currentData.usofField.type ) ) {
						self.__updateOnInstructions_long( _updateOnInstructions.bind( self, _currentData ) );
					} else {
						_updateOnInstructions( _currentData );
					}
				};

				// Check if we are doing preview changes for design options
				if ( _currentData.isChangeDesignOptions ) {
					const _value = unescape( $ush.toString( _currentData.value ) );
					// Get the ID of an attachment to check for loaded
					const attachmentId = $ush.parseInt( ( _value.match( /"background-image":"(\d+)"/ ) || [] )[1] );
					if ( attachmentId && ! $usb.getAttachmentUrl( attachmentId ) ) {
						// In case the design options have background image and it's info wasn't loaded yet ...
						// ... fire preview change event only after trying to load the image info
						( $usb.getAttachment( attachmentId ) || { fetch: $.noop } ).fetch( {
							success: _switchUpdateOnInstructions
						} );
					} else {
						_switchUpdateOnInstructions();
					}

					// For fields with type other than design options, just fire preview change event
				} else {
					_switchUpdateOnInstructions();
				}
			}
		},

		/**
		 * Field handler after hidden for a fieldsets
		 *
		 * @event handler
		 * @param {$usof.field} usofField The field object
		 */
		_afterHideField: function( usofField ) {
			// Set default value for hidden field
			if ( usofField instanceof $usof.field && usofField.inited ) {
				usofField.setValue( usofField.getDefaultValue(), /* not quiet */false );
			}
		},

		/**
		 * Toggles the data indicator on the tab.
		 *
		 * @param {{}} hasValues
		 */
		dataIndicatorChanged: function( hasValues ) {
			const self = this;

			if ( ! self.isActiveElmFieldset() ) {
				return;
			}

			for ( const index in hasValues ) if ( self.activeElmFieldset.tabsItems[ index ] ) {
				self.activeElmFieldset.tabsItems[ index ].toggleClass( 'has_values', hasValues[ index ] === true );
			}
		},
	} );

	// Functionality for the implementation of Fieldsets
	prototype.$$fieldsets = {
		/**
		 * Switch USOF tabs
		 *
		 * @event handler
		 * @param {Event} e
		 */
		onSwitchTabs: function( e ) {
			const $target = $( e.currentTarget );
			const $sections = $target
				.parents( '.usof-tabs:first' )
				.find( '> .usof-tabs-sections > *' );

			// This is toggle the tab title
			$target
				.addClass( 'active' )
				.siblings()
				.removeClass( 'active' );

			// This is toggle the tab sections
			$sections
				.removeAttr( 'style' )
				.eq( $target.index() )
				.addClass( 'active' )
				.siblings()
				.removeClass( 'active' );
		},

		/**
		 * Method to check visible fields and manage tab visibility.
		 * Note: Test case in #5021
		 */
		updateTabsVisibility: $ush.debounce( function() {
			const self = this;
			if ( ! self.activeElmFieldset || ! ( self.activeElmFieldset.$tabsItems instanceof $ ) ) {
				return;
			}
			$.each( self.activeElmFieldset.$tabsSections, ( index, section ) => {
				const fields = $( '> *', section ).toArray();
				var isHidden = true;
				for ( const k in fields ) {
					var $field = $( fields[ k ] ),
						isShown = $field.data( 'isShown' );
					if ( $ush.isUndefined( isShown ) ) {
						isShown = ( $field.css( 'display' ) != 'none' );
					}
					if ( isShown ) {
						isHidden = false;
						break;
					}
				}
				self.activeElmFieldset.$tabsItems
					.eq( index )
					.toggleClass( 'hidden', isHidden );
			} );
		}, 1 ),
	};

	// Export API
	$usb.builderPanel = new BuilderPanel;

} ( jQuery );
