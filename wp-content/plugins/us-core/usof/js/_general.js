window.$ush = window.$ush || {};
window.$usof = window.$usof || {};

/**
 * Retrieve/set/erase dom modificator class <mod>_<value> for UpSolution CSS Framework
 *
 * @param {String} mod Modificator namespace
 * @param {String|Booleaan|null} [value] Value
 * @returns {String|jQuery}
 *
 * TODO: add support for multiple ([]) values
 */
jQuery.fn.usMod = function( mod, value ) {
	if ( this.length == 0 ) {
		return this;
	}
	// Remove class modificator
	if ( value === false || value === null ) {
		return this.each( function() {
			this.className = this.className.replace( new RegExp( '(^| )' + mod + '\_[\dA-z\_\-]+( |$)' ), '$2' );
		} );
	}
	var pcre = new RegExp( '^.*?' + mod + '\_([\dA-z\_\-]+).*?$' ),
		arr;
	// Retrieve modificator
	if ( $ush.isUndefined( value ) ) {
		return ( arr = pcre.exec( this.get(0).className ) ) ? arr[1] : false;

		// Set modificator
	} else {
		var regexp = new RegExp( '(^| )' + mod + '\_[\dA-z\_\-]+( |$)' );
		return this.each( function() {
			if ( this.className.match( regexp ) ) {
				this.className = this.className.replace( regexp, '$1' + mod + '_' + value + '$2' );
			} else {
				this.className += ' ' + mod + '_' + value;
			}
		} ).trigger( 'usof.' + mod, value );
	}
};

// USOF Core
! function( $, _undefined ) {
	"use strict";

	$usof.ajaxUrl = $( '.usof-container' ).data( 'ajaxurl' ) || window.ajaxurl;

	if ( $ush.isUndefined( $usof.mixins ) ) {
		$usof.mixins = {};
	}

	// Prototype mixin for all classes working with events
	// TODO: Replace with $ush.mixinEvents
	$usof.mixins.Events = {
		/**
		 * Attach a handler to an event for the class instance
		 *
		 * @param {String} eventType A string containing event type, such as 'beforeShow' or 'change'
		 * @param {Function} handler A function to execute each time the event is triggered
		 */
		on: function( eventType, handler ) {
			const self = this;
			if ( $ush.isUndefined( self.$$events ) ) {
				self.$$events = {};
			}
			( eventType + '' ).split( /\p{Zs}/u ).map( ( _eventType ) => {
				if ( $ush.isUndefined( self.$$events[ _eventType ] ) ) {
					self.$$events[ _eventType ] = [];
				}
				if( typeof handler === 'function' ) {
					self.$$events[ _eventType ].push( handler );
				} else {
					console.error( 'Invalid handler:', [ _eventType, handler ] );
				}
			} );
			return self;
		},

		/**
		 * Remove a previously-attached event handler from the class instance
		 *
		 * @param {String} eventType A string containing event type, such as 'beforeShow' or 'change'
		 * @param {Function} [handler] The function that is to be no longer executed
		 * @chainable
		 */
		off: function( eventType, handler ) {
			const self = this;
			if (
				$ush.isUndefined( self.$$events )
				|| $ush.isUndefined( self.$$events[ eventType ] )
			) {
				return self;
			}
			if ( ! $ush.isUndefined( handler ) ) {
				var handlerPos = $.inArray( handler, self.$$events[ eventType ] );
				if ( handlerPos != - 1 ) {
					self.$$events[ eventType ].splice( handlerPos, 1 );
				}
			} else {
				self.$$events[ eventType ] = [];
			}
			return self;
		},

		/**
		 * @param {String} eventType
		 * @return {Boolean}
		 */
		has: function( eventType ) {
			return ! $ush.isUndefined( this.$$events[ eventType ] ) && this.$$events[ eventType ].length > 0;
		},

		/**
		 * Execute all handlers and behaviours attached to the class instance for the given event type
		 *
		 * @param {String} eventType A string containing event type, such as 'beforeShow' or 'change'
		 * @param {Array} extraParameters Additional parameters to pass along to the event handler
		 * @chainable
		 */
		trigger: function( eventType, extraParameters ) {
			const self = this;
			if (
				$ush.isUndefined( self.$$events )
				|| $ush.isUndefined( self.$$events[ eventType ] )
				|| self.$$events[ eventType ].length == 0
			) {
				return self;
			}
			const args = arguments;
			const params = ( args.length > 2 || ! Array.isArray( extraParameters ) )
				? Array.prototype.slice.call( args, 1 )
				: extraParameters;
			// First argument is the current class instance
			params.unshift( self );
			for ( var i = 0; i < self.$$events[ eventType ].length; i ++ ) {
				self.$$events[ eventType ][ i ].apply( self.$$events[ eventType ][ i ], params );
			}
			return self;
		}
	};

	// TODO: Need to refactor and get rid of dependencies, the object must provide an API!
	$usof.mixins.Fieldset = $.extend( {}, $ush.mixinEvents, {
		/**
		 * Initialize fields inside of a container
		 *
		 * @param {jQuery} $container
		 */
		initFields: function( $container ) {
			const self = this;

			// Check variables
			[ '$fields', 'fields', 'groups', 'showIf', 'showIfDeps' ].map( ( prop ) => {
				if ( ! $.isPlainObject( self[ prop ] ) ) {
					self[ prop ] = {};
				}
			} );

			$( '.usof-form-row, .usof-form-wrapper, .usof-form-group', $container ).each( ( _, node ) => {
				var $field = $( node ),
					name = $field.data( 'name' ),
					isRow = $field.hasClass( 'usof-form-row' ),
					isGroup = $field.hasClass( 'usof-form-group' ),
					isInGroup = $field.parents( '.usof-form-group' ).length,
					$showIf = $field.find(
						( isRow || isGroup )
							? '> .usof-form-row-showif'
							: '> .usof-form-wrapper-content > .usof-form-wrapper-showif'
					);

				if ( $ush.isUndefined( name ) ) {
					return;
				}

				// If the element is in the prototype, then we will ignore the init
				if ( $field.closest( '.usof-form-group-prototype' ).length ) {
					return;
				}

				// Exclude fields for `design_options` as they have their own group
				if (
					isRow
					&& $field.closest( '.usof-design-options' ).length
					&& ! $container.is( '[data-responsive-state-content]' )
				) {
					return;
				}

				// Fix eliminates re-initialization of fields for Live Builder, which leads to loss of events.
				// If you comment out this line, then the Content Carousel element will not apply
				// the settings in the preview, for example "Number of Items to Show".
				if ( ! $ush.isUndefined( self.$fields[ name ] ) && isInGroup ) {
					return;
				}

				self.$fields[ name ] = $field;
				if ( $showIf.length > 0 ) {
					self.showIf[ name ] = $showIf[0].onclick() || [];
					// Writing dependencies
					const showIfVars = self._getShowIfVariables( self.showIf[ name ] );
					for ( var i = 0; i < showIfVars.length; i ++ ) {
						if ( $ush.isUndefined( self.showIfDeps[ showIfVars[ i ] ] ) ) {
							self.showIfDeps[ showIfVars[ i ] ] = [];
						}
						self.showIfDeps[ showIfVars[ i ] ].push( name );
					}
				}
				if ( isRow && ( ! isInGroup || self.isGroupParams ) ) {
					self.fields[ name ] = $field.usofField();
					self.fields[ name ].getParent = () => {
						return self;
					};

				} else if ( isGroup ) {
					self.groups[ name ] = $field.usofGroup();
				}
			} );

			for ( const fieldName in self.showIfDeps ) {
				if (
					! self.showIfDeps.hasOwnProperty( fieldName )
					|| $ush.isUndefined( self.fields[ fieldName ] )
				) {
					continue;
				}
				self.fields[ fieldName ].on( 'change', ( field ) => { self.updateVisibility( field.name ); } );

				// Update displayed fields on initialization
				if ( !! self.isGroupParams ) {
					self.updateVisibility( fieldName, /* isAnimated */false, self.getCurrentShown( fieldName ) );
				}
			}

			// Get default values for fields
			if ( $ush.isUndefined( self._defaultValues ) ) {
				self._defaultValues = self.getValues();
			}
		},

		/**
		 * Show/Hide the field based on its showIf condition
		 *
		 * @param {String} fieldName The field name
		 * @param {Boolean} isAnimated Indicates if animated
		 * @param {Boolean} isCurrentShown Indicates if parent
		 */
		updateVisibility: function( fieldName, isAnimated, isCurrentShown ) {
			const self = this;
			if ( ! fieldName || ! self.showIfDeps[ fieldName ] ) {
				return;
			}

			if ( $ush.isUndefined( isAnimated ) ) {
				isAnimated = true;
			}
			if ( $ush.isUndefined( isCurrentShown ) ) {
				isCurrentShown = true;
			}

			/**
			 * Get the display conditions for the previous field, if it exists
			 *
			 * @type {Boolean|undefined}
			 */
			const isPrevShown = self.$fields[ fieldName ].data( 'isShown' );

			self.showIfDeps[ fieldName ].map( ( depFieldName ) => {
				var field = self.fields[ depFieldName ] || self.groups[ depFieldName ],
					$field = self.$fields[ depFieldName ],
					isShown = self.getCurrentShown( depFieldName ),
					condition = self.showIf[ depFieldName ],
					shouldBeShown = self.executeShowIf( condition, self.getValue.bind( self ) );

				// Check visible
				if ( ( ! shouldBeShown && isShown ) || ! isCurrentShown ) {
					isShown = false;

				} else if ( shouldBeShown && ! isShown ) {
					isShown = true;
				}

				if ( ! $ush.isUndefined( isPrevShown ) ) {
					isShown = isPrevShown && isShown;
				}

				// Cancel previous "false" when operator is "or".
				if ( condition.length === 3 && condition[1] === 'or' ) {
					isShown = isShown || shouldBeShown;
				}

				$field
					.stop( true, false )
					.data( 'isShown', isShown );

				if ( isShown ) {
					self.fireFieldEvent( $field, 'beforeShow' );
					// TODO: Add css animations is enabled isAnimated
					$field.show();
					self.fireFieldEvent( $field, 'afterShow' );
					if ( field instanceof $usof.field ) {
						field.trigger( 'change', [ field.getValue() ] );
					}

				} else {
					self.fireFieldEvent( $field, 'beforeHide' );
					// TODO: Add css animations is enabled isAnimated
					$field.hide();
					self.fireFieldEvent( $field, 'afterHide' );
					if ( field instanceof $usof.Group ) {
						field.setValue( field.getDefaultValue() );
					}
				}

				if ( self.showIfDeps[ depFieldName ] ) {
					self.updateVisibility( depFieldName, isAnimated, isShown );
				}
			} );
		},

		/**
		 * Get a shown state
		 *
		 * @param {String} fieldName The field name
		 * @return {Boolean} True if the specified field identifier is shown, False otherwise
		 */
		getCurrentShown: function( fieldName ) {
			const self = this;
			if ( ! fieldName || ! self.$fields[ fieldName ] ) {
				return true;
			}
			var $field = self.$fields[ fieldName ],
				isShown = $field.data( 'isShow' );
			if ( $ush.isUndefined( isShown ) ) {
				isShown = $field.css( 'display' ) !== 'none';
			}
			return isShown === true;
		},

		/**
		 * Get all field names that affect the given 'show_if' condition
		 *
		 * @param {[]} condition
		 * @returns {[]}
		 */
		_getShowIfVariables: function( condition ) {
			const self = this;
			if ( ! Array.isArray( condition ) || condition.length < 3 ) {
				return [];

			} else if ( [ 'and', 'or' ].includes( condition[1].toLowerCase() ) ) {
				// Complex or / and statement
				var vars = self._getShowIfVariables( condition[0] ),
					index = 2;
				while ( ! $ush.isUndefined( condition[ index ] ) ) {
					vars = vars.concat( self._getShowIfVariables( condition[ index ] ) );
					index = index + 2;
				}
				return vars;

			} else {
				return [ condition[0] ];
			}
		},

		/**
		 * Execute 'show_if' condition
		 *
		 * @param {[]} condition
		 * @param {Function} getValue Function to get the needed value
		 * @returns {Boolean} Should be shown?
		 */
		executeShowIf: function( condition, getValue ) {
			const self = this;
			var result = true;
			if ( ! Array.isArray( condition ) || condition.length < 3 ) {
				return result;

			} else if ( [ 'and', 'or' ].includes( condition[1].toLowerCase() ) ) {
				// Complex or / and statement
				result = self.executeShowIf( condition[0], getValue );
				var index = 2;
				while ( ! $ush.isUndefined( condition[ index ] ) ) {
					condition[ index - 1 ] = condition[ index - 1 ].toLowerCase();
					if ( condition[ index - 1 ] == 'and' ) {
						result = ( result && self.executeShowIf( condition[ index ], getValue ) );

						// TODO: Conditions are not used and do not work correctly, needs to be fixed!
					} else if ( condition[ index - 1 ] == 'or' ) {
						result = ( result || self.executeShowIf( condition[ index ], getValue ) );
					}
					index = index + 2;
				}

			} else {
				const value = getValue( condition[0] );
				if ( $ush.isUndefined( value ) ) {
					return true;
				}
				if ( condition[1] == '=' ) {
					if ( Array.isArray( condition[2] ) ) {
						result = condition[2].includes( value );
					} else {
						result = ( value == condition[2] );
					}

				} else if ( condition[1] == '!=' ) {
					if ( Array.isArray( condition[2] ) ) {
						result = ! condition[2].includes( value );
					} else {
						result = ( value != condition[2] );
					}

				} else if ( condition[1] == '<=' ) {
					result = ( value <= condition[2] );
				} else if ( condition[1] == '<' ) {
					result = ( value < condition[2] );
				} else if ( condition[1] == '>' ) {
					result = ( value > condition[2] );
				} else if ( condition[1] == '>=' ) {
					result = ( value >= condition[ 2 ] );
				} else if ( condition[1] == 'str_contains' ) {
					result = ( '' + value ).indexOf( '' + condition[2] ) > -1;
				} else {
					result = true;
				}
			}
			return result;
		},

		/**
		 * Find all the fields within $container and fire a certain event there
		 *
		 * @param {jQuery} $container
		 * @param {String} trigger
		 */
		fireFieldEvent: function( $container, trigger ) {
			if ( ! $container.hasClass( 'usof-form-row' ) ) {
				$( '.usof-form-row', $container ).each( ( _, row ) => {
					var $row = $( row ),
						isShown = $row.data( 'isShown' );
					if ( $ush.isUndefined( isShown ) ) {
						isShown = $row.css( 'display' ) != 'none';
					}
					// The block is not actually shown or hidden in this case
					// Note: Fields with `class="hidden"` will not be initialized!
					if ( ! isShown && [ 'beforeShow', 'afterShow', 'beforeHide', 'afterHide' ].includes( trigger ) ) {
						return;
					}
					if ( $ush.isUndefined( $row.data( 'usofField' ) ) ) {
						return;
					}
					$row.data( 'usofField' ).trigger( trigger );
				} );

			} else if ( $container.data( 'usofField' ) instanceof $usof.field ) {
				$container.data( 'usofField' ).trigger( trigger );
			}
		},

		/**
		 * Get the value
		 *
		 * @param {String} id The id
		 * @return {*} The value
		 */
		getValue: function( id ) {
			const self = this;
			if ( $ush.isUndefined( self.fields[ id ] ) ) {
				return _undefined;
			}
			return self.fields[ id ].getValue();
		},

		/**
		 * Set some particular field value
		 *
		 * @param {String} id
		 * @param {String} value
		 * @param {Boolean} quiet Don't fire onchange events
		 */
		setValue: function( id, value, quiet ) {
			const self = this;
			if ( $ush.isUndefined( self.fields[ id ] ) ) {
				return;
			}
			const shouldFireShow = ! self.fields[ id ].inited;
			if ( shouldFireShow ) {
				self.fields[ id ].trigger( 'beforeShow' );
				self.fields[ id ].trigger( 'afterShow' );
			}
			self.fields[ id ].setValue( value, quiet );
			if ( shouldFireShow ) {
				self.fields[ id ].trigger( 'beforeHide' );
				self.fields[ id ].trigger( 'afterHide' );
			}
		},

		/**
		 * Get the values
		 *
		 * @return {*} The values
		 */
		getValues: function() {
			const self = this;
			const values = {};

			// Regular values
			for ( const fieldId in self.fields ) {
				if ( ! self.fields.hasOwnProperty( fieldId ) ) {
					continue;
				}
				values[ fieldId ] = self.getValue( fieldId );
			}

			// Groups values
			for ( const groupId in self.groups ) {
				values[ groupId ] = self.groups[ groupId ].getValue();
			}

			return values;
		},

		/**
		 * Set the values
		 *
		 * @param {{}} values
		 * @param {Boolean} quiet Don't fire onchange events, just change the interface
		 */
		setValues: function( values, quiet ) {
			const self = this;

			// Regular values
			for ( const fieldId in self.fields ) {
				if ( values.hasOwnProperty( fieldId ) ) {
					const currentValue = values[ fieldId ];
					self.setValue( fieldId, currentValue, quiet );
					if ( ! quiet ) {
						self.fields[ fieldId ].trigger( 'change', [ currentValue ] );
					}

					// Set default value
				} else if ( self._defaultValues.hasOwnProperty( fieldId ) ) {
					self.setValue( fieldId, self._defaultValues[ fieldId ], quiet );
				}
			}

			// Groups values
			for ( const groupId in self.groups ) if ( ! $ush.isUndefined( values[ groupId ] ) ) {
				self.groups[ groupId ].setValue( values[ groupId ] );
			}

			if ( quiet ) {
				// Update fields visibility anyway
				for ( const fieldName in self.showIfDeps ) {
					if (
						! self.showIfDeps.hasOwnProperty( fieldName )
						|| $ush.isUndefined( self.fields[ fieldName ] )
					) {
						continue;
					}
					self.updateVisibility( fieldName, /* isAnimated */false );
				}
			}
		},

		/**
		 * Get the current values.
		 *
		 * @return {{}} Returns the current value given the selected response state, if any.
		 */
		getCurrentValues: function() {
			const self = this;
			const result = {};
			for ( const name in self.fields ) {
				result[ name ] = self.fields[ name ].getCurrentValue();
			}
			for ( const name in self.groups ) {
				result[ name ] = self.groups[ name ].getCurrentValue();
			}
			return result;
		},

		/**
		 * JavaScript representation of us_prepare_icon_tag helper function + removal of wrong symbols
		 *
		 * @param {String} iconClass
		 * @returns {String}
		 */
		prepareIconTag: function( iconValue ) {
			iconValue = iconValue.trim().split( '|' );
			if ( iconValue.length != 2 ) {
				return '';
			}
			var iconTag = '';
			iconValue[0] = iconValue[0].toLowerCase();
			if ( iconValue[0] == 'material' ) {
				iconTag = `<i class="material-icons">${iconValue[1]}</i>`;
			} else {
				if ( iconValue[1].substr( 0, 3 ) == 'fa-' ) {
					iconTag = `<i class="${iconValue[0]} ${iconValue[1]}"></i>`;
				} else {
					iconTag = `<i class="${iconValue[0]} fa-${iconValue[1]}"></i>`;
				}
			}

			return iconTag
		},

		/**
		 * Init the check of the data indicator.
		 */
		initDataIndicator: function() {
			const self = this;

			// Default
			const tmpDataIndicator = {
				params: {},
				tabIndexes: {},
				lastChecksum: 0,
			}

			// Field changes
			const changeField = ( theField ) => {

				if ( ! ( theField instanceof $usof.field ) ) {
					return;
				}

				tmpDataIndicator.params[ theField.name ] = theField.hasValue();

				var checksum = $ush.checksum( tmpDataIndicator.params );
				if ( tmpDataIndicator.lastChecksum === checksum ) {
					return;
				}
				tmpDataIndicator.lastChecksum = checksum;

				var hasValues = {};
				for ( const name in tmpDataIndicator.tabIndexes ) {
					var tabIndex = tmpDataIndicator.tabIndexes[ name ];
					hasValues[ tabIndex ] = hasValues[ tabIndex ] || tmpDataIndicator.params[ name ];
				}

				self.trigger( 'dataIndicatorChanged', hasValues );
			};

			// Fields
			for ( const name in self.fields ) {
				const theField = self.fields[ name ];
				if ( theField.checkParamForDataIndicator ) {
					tmpDataIndicator.params[ name ] = theField.hasValue();
					tmpDataIndicator.tabIndexes[ name ] = theField.$row.closest( '.usof-tabs-section' ).index();
					theField.on( 'change', changeField );
				}
			}

			// Groups
			for ( const name in self.groups ) {
				const theGroup = self.groups[ name ];
				if ( theGroup.checkParamForDataIndicator ) {
					tmpDataIndicator.params[ name ] = theGroup.hasValue();
					tmpDataIndicator.tabIndexes[ name ] = theGroup.$container.closest( '.usof-tabs-section' ).index();
					theGroup.on( 'change', changeField );
				}
			}
		},
	} );

	if ( $ush.isUndefined( $usof._$$data ) ) {
		$usof._$$data = {};
	}

	/**
	 * Get USOF data by key.
	 *
	 * @param {String} key Key to the data object.
	 * @return {{}} Returns a data object on success, otherwise an empty simple object.
	 */
	$usof.getData = function( key ) {
		const self = this;
		if ( typeof key !== 'string' ) {
			return {};
		}
		if ( ! $.isPlainObject( self._$$data[ key ] ) ) {
			try {
				self._$$data[ key ] = JSON.parse( self._$$data[ key ] || '{}' );
			} catch ( e ) {
				self._$$data[ key ] = {};
			}
		}
		return $ush.clone( self._$$data[ key ] || {} );
	};

}( jQuery );

// USOF Field
! function( $, _undefined ) {
	"use strict";

	$usof.field = function( row, options ) {
		const self = this;

		// Elements
		self.$document = $( document );
		self.$row = $( row );
		self.$responsive = $( '> .usof-form-row-responsive', self.$row );

		const data = self.$row.data() || {};

		// Private "Variables"
		self.type = self.$row.usMod( 'type' );
		self.id = data.id;
		self.uniqid = $ush.uniqid();
		self.name = data.name;
		self.inited = !! data.inited;
		self.relatedOn = data.relatedOn;
		self.checkParamForDataIndicator = self.$row.hasClass( 'check_param_for_data_indicator' );

		// Get current input by name
		self.$input = $( `[name="${data.name}"]:not(.js_hidden)`, self.$row );

		if ( self.inited ) {
			return;
		}

		// Boundable field events
		self.$$events = {
			beforeShow: [],
			afterShow: [],
			change: [],
			beforeHide: [],
			afterHide: []
		};

		// Overloading selected functions, moving parent functions to "parent" namespace: init => parentInit
		if ( ! $ush.isUndefined( $usof.field[ self.type ] ) ) {
			for ( const fn in $usof.field[ self.type ] ) {
				if (
					! $usof.field[ self.type ].hasOwnProperty( fn )
					|| fn.substr(0, 2) === '_$' // deny access via parent for private methods
				) {
					continue;
				}
				if ( ! $ush.isUndefined( self[ fn ] ) ) {
					const parentFn = 'parent' + fn.charAt(0).toUpperCase() + fn.slice(1);
					self[ parentFn ] = self[ fn ];
				}
				self[ fn ] = $usof.field[ self.type ][ fn ];
			}
		}

		// Forwarding events through document
		self.$document.on( 'usb.syncResponsiveState', self._usbSyncResponsiveState.bind( self ) );

		// Save current object to row element
		self.$row.data( 'usofField', self );

		// Init on first show
		function initEvent() {
			self.init( options );
			self.inited = true;
			self.$row.data( 'inited', self.inited );
			self.off( 'beforeShow', initEvent );
			// Remember the default value
			self._std = data.hasOwnProperty( 'std' )
				? data.std // NOTE: Used for now only for "type=select"
				: self.getCurrentValue();
			// If responsive mode support is enabled for the field, then we initialize the functionality
			self.initResponsive();
		};
		self.on( 'beforeShow', initEvent );
	};

	// Field API
	$.extend( $usof.field.prototype, $usof.mixins.Events, {

		init: function() {
			const self = this;
			if ( $ush.isUndefined( self._events ) ) {
				self._events = {};
			}
			self._events.change = () => {
				self.trigger( 'change', [ self.getValue() ] );
			};
			self.$input.on( 'change', self._events.change );
			return self;
		},

		/**
		 * Determines if Live Builder.
		 *
		 * @return {Boolean} True if Live Builder, False otherwise.
		 */
		isLiveBuilder: function() {
			return this.$row.closest( '.usb-panel-fieldset, .usb-panel-body' ).length > 0;
		},

		/**
		 * Initializes the necessary functionality for responsive mode.
		 */
		initResponsive: function() {
			const self = this;

			if ( ! self.hasResponsive() ) {
				return;
			}

			// Elements
			self.$switchResponsive = $( '.usof-switch-responsive:first', self.$row );
			self.$responsiveButtons = $( '[data-responsive-state]', self.$responsive );

			// Private "Variables"
			self._currentState = 'default';
			self._states = [ 'default' ];

			// Get responsive states
			if ( self.$responsive.is( '[onclick]' ) ) {
				self._states = self.$responsive[0].onclick() || self._states;
				self.$responsive.removeAttr( 'onclick' );
			}

			// Events
			self.$switchResponsive
				.on( 'click', self._$switchResponsive.bind( self ) );
			self.$responsive
				.on( 'click', '[data-responsive-state]', self._$selectResponsiveState.bind( self ) );
		},

		/**
		 * Determine if there is a responsive mode.
		 *
		 * @return {Boolean} True has responsive, False otherwise.
		 */
		hasResponsive: function() {
			return this.$responsive.length > 0;
		},

		/**
		 * Determine if responsive mode is enabled.
		 *
		 * @return {Boolean} True if responsive, False otherwise.
		 */
		isResponsive: function() {
			return this.hasResponsive() && this.$row.hasClass( 'responsive' );
		},

		/**
		 * Determine responsive value format or not.
		 *
		 * @param {*} value The checked value.
		 * @return {Boolean} True if responsive value, False otherwise.
		 */
		isResponsiveValue: function( value ) {
			const self = this;
			if ( value ) {
				if ( self.isObjectValue( value ) ) {
					value = $ush.toPlainObject( value );
				}
				if ( $.isPlainObject( value ) ) {
					for ( const i in self._states ) {
						if ( value.hasOwnProperty( self._states[ i ] ) ) {
							return true;
						}
					}
				}
			}
			return false;
		},

		/**
		 * Determines whether the specified value is object value.
		 *
		 * @param {String} value The value.
		 * @return {String} True if the specified value is object value, False otherwise.
		 * TODO:Remove here and in the `./field_typography_options.js`.
		 */
		isObjectValue: function( value ) {
			return value && $ush.toString( value ).indexOf( $ush.rawurlencode( '{' ) ) === 0;
		},

		/**
		 * Determines whether the specified state is valid state.
		 *
		 * @param {*} state The state.
		 * @return {Boolean} True if the specified state is valid state, False otherwise.
		 */
		isValidState: function( state ) {
			return state && ( this._states || [] ).includes( $ush.toString( state ) );
		},

		/**
		 * Determines if a value is a param for WPBakery.
		 *
		 * @return {Boolean}True if vc parameter value, False otherwise.
		 */
		isWPBakeryParamValue: function() {
			return this.$input.hasClass( 'wpb_vc_param_value' );
		},

		/**
		 * Determines whether the specified value is dynamic variable.
		 *
		 * @param {String} value The value.
		 * @return {Boolean} True if the specified value is dynamic variable, False otherwise.
		 */
		isDynamicVariable: function( value ) {
			return value && /^{{([\dA-z\/\|\-_]+)}}$/.test( $ush.toString( value ).trim() );
		},

		/**
		 * Check if the value is set
		 *
		 * @return {Boolean} Returns true if the value is set, false otherwise.
		 */
		hasValue: function() {
			return this.getValue() !== this.getDefaultValue();
		},

		/**
		 * Get parent object.
		 *
		 * @return {*} Returns the parent object if successful, otherwise undefined.
		 */
		getParent: $.noop,

		/**
		 * Get the related field.
		 * Note: The method is overridden to '/plugins-support/js_composer/js/usof_compatibility.js'
		 *
		 * @return {$usof.field|undefined} Returns the related field object, otherwise undefined.
		 */
		getRelatedField: function() {
			const self = this;
			const parent = self.getParent();
			if (
				! $ush.isUndefined( self.relatedOn )
				&& parent instanceof $usof.GroupParams
			) {
				return ( parent.fields || {} )[ $ush.toString( self.relatedOn ) ];
			}
			return _undefined;
		},

		/**
		 * Get field object by its name.
		 *
		 * @param {String} name The name.
		 * @return {$usof.field|undefined} Returns a reference to a field object by its name, otherwise undefined.
		 */
		getFieldByName: function( name ) {
			if ( name ) {
				return ( ( this.getParent() || {} )[ 'fields' ] || {} )[ name ];
			}
			return;
		},

		/**
		 * Get the current state.
		 *
		 * @return {String} The current state.
		 */
		getCurrentState: function() {
			const self = this;
			if ( ! self.isValidState( self._currentState ) ) {
				self._currentState = 'default';
			}
			return self._currentState;
		},

		/**
		 * Get the default value.
		 * Note: This is the default value from the config,
		 * not the default value from the responsive value.
		 *
		 * @return {*} The default value.
		 */
		getDefaultValue: function() {
			return $ush.isUndefined( this._std ) ? '' : this._std;
		},

		/**
		 * Get the value by state name.
		 *
		 * @param {String} state The state name.
		 * @param {String} value The value.
		 * @return {String} Returns values by state name or default.
		 */
		getValueByState: function( state, value ) {
			const self = this;
			if ( self.isResponsiveValue( value ) ) {
				if ( ! self.isValidState( state ) ) {
					state = 'default';
				}
				if ( ! $.isPlainObject( value ) ) {
					value = $ush.toPlainObject( value );
				}
				if ( value.hasOwnProperty( state ) ) {
					return value[ state ];
				}
			}
			return self.getDefaultValue();
		},

		/**
		 * Set the value by state.
		 *
		 * @param {String} state The state.
		 * @param {String} input The input value.
		 * @param {String} value The value.
		 * @return {String} Returns the value from the updated data for the state.
		 */
		setValueByState: function( state, input, value ) {
			const self = this;
			if ( ! self.isValidState( state ) ) {
				return '';
			}
			if ( self.isResponsiveValue( value ) ) {
				value = $ush.toPlainObject( value );
			} else {
				value = {};
			}
			value[ state ] = input;
			return $ush.toString( value );
		},

		/**
		 * Get the current value, taking into account the state if used.
		 *
		 * @return {*} The current value.
		 */
		getCurrentValue: function() {
			const self = this;
			var value = self.getValue();
			if ( self.isResponsiveValue( value ) ) {
				value = self.getValueByState( self._currentState, value );
			}
			if ( self.isObjectValue( value ) ) {
				value = $ush.toPlainObject( value );
			}
			return value;
		},

		/**
		 * Set the current value, taking into account the state if used.
		 *
		 * @param {*} value The value.
		 * @param {Boolean} quiet The quiet.
		 */
		setCurrentValue: function( value, quiet ) {
			const self = this;
			if ( self.isResponsive() ) {
				value = self.setValueByState( self._currentState, value, self.getValue() );
			}
			if ( $.isPlainObject( value ) ) {
				value = $ush.toString( value );
			}
			// Note: setValue should not be used here since it is intended to be set from outside!
			self.$input.val( value );
			if ( ! quiet ) {
				self.trigger( 'change', value );
			}
			// Run events on a hidden field for WPBakery as it is tied to it
			if ( self.isWPBakeryParamValue() && self.$input.is( ':hidden' ) ) {
				self.$input.trigger( 'change' );
			}
		},

		/**
		 * Get the value.
		 *
		 * @return {String} The value.
		 */
		getValue: function() {
			return this.$input.val();
		},

		/**
		 * Set the value.
		 *
		 * @param {*} value The value.
		 * @param {Boolean} quiet The quiet.
		 */
		setValue: function( value, quiet ) {
			const self = this;
			// Responsive mode switch by value
			if (
				! self.isResponsive()
				&& self.isResponsiveValue( value )
			) {
				self.$row.addClass( 'responsive' );
			}
			self.$input.val( value );
			if ( ! quiet ) {
				self.trigger( 'change', [ value ] );
			}
			// For fields bound to WPBakery values, we trigger an event
			// to ensure proper execution of WPBakery logic.
			if ( self.isWPBakeryParamValue() ) {
				self.$input.trigger( 'change' );
			}
		},

		/**
		 * This is the install handler `responsiveState` of builder.
		 * Note: This event is global and can be overridden as needed.
		 *
		 * @event handler
		 * @param {Event} _ The Event interface represents an event which takes place in the DOM.
		 * @param {string} state The device type.
		 */
		_usbSyncResponsiveState: function( _, state ) {
			const self = this;
			state = state || 'default';
			if ( ! self.isResponsive() || ! self.isValidState( state ) ) {
				return;
			}
			self._$setResponsiveState( state );
		},

		/**
		 * Set responsive state.
		 *
		 * @param {String} state.
		 */
		_$setResponsiveState: function( state ) {
			const self = this;

			if ( ! self.hasResponsive() ) {
				return;
			}
			if ( ! self.isValidState( state ) ) {
				state = 'default';
			}

			self.$responsiveButtons
				.removeClass( 'active' )
				.filter( `[data-responsive-state="${state}"]` )
				.addClass( 'active' );

			self._currentState = state;

			self.trigger( 'setResponsiveState', state );
		},

		/**
		 * Responsive mode switch.
		 *
		 * @event handler
		 */
		_$switchResponsive: function() {
			const self = this;
			if ( ! self.hasResponsive() ) {
				return;
			}

			const nextMode = ! self.isResponsive();

			self.$row.toggleClass( 'responsive', nextMode );

			var value = self.getCurrentValue();
			if ( nextMode ) {
				var responsiveValue = {};
				self._states.map( ( state ) => {
					responsiveValue[ state ] = value;
				} );
				value = $ush.toString( responsiveValue );

			} else {
				self._$setResponsiveState( 'default' );

				// Set value if it is plain object
				if ( $.isPlainObject( value ) ) {
					value = $ush.toString( value );
				}
			}

			self.setValue( value );
		},

		/**
		 * Handler for selecting a responsive state on click of a button.
		 *
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		_$selectResponsiveState: function( e ) {
			const self = this;
			if ( ! self.isResponsive() ) {
				return;
			}

			const state = $( e.target ).data( 'responsive-state' ) || self._currentState;

			self._$setResponsiveState( state );

			// Forward events to other handlers (for example, in Live Builder)
			self.trigger( 'syncResponsiveState', state );

			self.$document.trigger( 'field.syncResponsiveState', state );
		}
	} );

	/**
	 * Field initialization.
	 */
	$.fn.usofField = function( options ) {
		return new $usof.field( this, options );
	};

}( jQuery );

// USOF Group
! function( $, _undefined ) {
	"use strict";

	$usof.Group = function( row, options ) {
		this.init( row, options );
	};

	// Handlers for filters
	const _filtersHandler = {

		/**
		 * Sanitize color slug.
		 * Keys are used as internal identifiers. Lowercase alphanumeric characters,
		 * dashes, and underscores are allowed.
		 *
		 * @param {String} value The value to be sanitized.
		 * @return {Stringg} Returns a sanitized color slug.
		 */
		sanitize_color_slug: function( value ) {
			if ( value.charAt(0) !== '_' ) {
				value = '_' + value;
			}

			return $ush.toLowerCase( value )
				.replace( /[\p{Zs}|-]+/gu, '_' ) // replace spaces
				.replace( /[^a-z\d\_]+/g, '' )   // remove illegal characters
				.replace( /[\_]+/g, '_' );       // remove duplicates
		},

		/**
		 * Check value for uniqueness.
		 *
		 * @param {String} value The current value.
		 * @param {Boolean|[]} reserved_values The reserved values [optional].
		 * @param {$usof.filed} usofField The usof field.
		 * @return {String} Returns the unique value of a field in a group.
		 */
		unique_value: function( value, reserved_values, usofField ) {
			const self = this;
			const name = usofField.name;
			const values = $ush.toArray( reserved_values );

			self.groupParams.map( ( groupParams ) => {
				// Skip current field value
				if ( groupParams.fields[ name ] === usofField ) {
					return;
				}
				const value = groupParams.fields[ name ].getCurrentValue();
				if ( value ) {
					values.push( value );
				}
			} );

			// If the value is occupied, then find a new one with the number
			if ( values.indexOf( value ) > -1 ) {
				// Get head value if there is a number, example: "{head}_{tail}"
				value = ( value.match( /(.*)([-_\p{Zs}]\d+)$/u ) || [] )[1] || value;
				// Define separator
				const separator = (
					$ush.toPlainObject( self._filters[ name ] ).sanitize_color_slug
						? '_'
						: ' '
				);
				// Find a unique value
				var i = 1;
				while ( i++ <= /* max iterations */1000 ) {
					const newValue = value + separator + i;
					if ( values.indexOf( newValue ) < 0 ) {
						value = newValue;
						break;
					}
				}
			}
			return value;
		},
	};

	// Group API
	$.extend( $usof.Group.prototype, $usof.mixins.Events, {

		init: function( container, options ) {
			const self = this;

			// Elements
			self.$container = $( container );
			self.$btnAddGroup = $( '.usof-form-group-add', container );
			self.$prototype = $( '.usof-form-group-prototype', container );

			// Variables
			self.groupName = self.$container.data( 'name' );
			self.groupParams = [];
			self._filters = {}; // rules for using filters for params
			self.isBuilder = self.$container.parents( '.us-bld-window' ).length > 0; // is the builder located in the admin panel
			self.isLiveBuilder = self.$container.parents( '.usb-panel-fieldset' ).length > 0;
			self.isSortable = self.$container.hasClass( 'sortable' );
			self.isAccordion = self.$container.hasClass( 'type_accordion' );
			self.isButtonPreview = self.$container.hasClass( 'preview_button' );
			self.isFieldPreview = self.$container.hasClass( 'preview_input_fields' );
			self.isCustomColors = self.$container.hasClass( 'for_custom_colors' );
			self.checkParamForDataIndicator = self.$container.hasClass( 'check_param_for_data_indicator' );

			// Load translations
			var $translations = $( '.usof-form-group-translations', container );
			self.groupTranslations = (
				$translations.length
					? ( $translations[0].onclick() || {} )
					: {}
			);

			// Load group filters for params
			if ( self.$container.is( '[data-filters]' ) ) {
				self._filters = $ush.toPlainObject( self.$container.data( 'filters' ) );
				self.$container.removeAttr( 'data-filters' );
			}

			// Bondable events
			self._events = {
				changeGroupParam: self._changeGroupParam.bind( self ),
				applyFiltersToParam: self._applyFiltersToParam.bind( self ),
			};

			if ( self.isBuilder ) {
				self.$parentElementForm = self.$container.closest( '.usof-form' );
				self.elementName = self.$parentElementForm.usMod( 'for' );
				self.$builderWindow = self.$container.closest( '.us-bld-window' );

			} else {
				self.$parentSection = self.$container.closest( '.usof-section' );
				self._reInitGroupParams();
			}

			// The value is a string otherwise it will be an object
			self.hasStringValue = self.$container.closest( '.usb-panel-fieldset' ).length > 0;

			// Remember the default value
			self._std = self.getValue();

			// Events
			self.$btnAddGroup
				.off( 'click' ) // TODO: Fix double initialization for Live Builder
				.on( 'click', self.addGroup.bind( self, _undefined ) );
			self.$container
				.on( 'change', () => { self.trigger( 'change', self ); } )
				.on( 'click', '.ui-icon_duplicate', self.duplicateGroup.bind( self ) )
				.on( 'click', '.usof-form-group-item-controls > .ui-icon_delete', ( e ) => {
					e.stopPropagation();
					self.deleteGroup( $( e.target ).closest( '.usof-form-group-item' ) );
				} );

			// Init accordion
			if ( self.isAccordion ) {
				self.$sections = $( '.usof-form-group-item', container );
				self.$container.on( 'click', '.usof-form-group-item-title', ( e ) => {
					// Ignores all elements except div (these can be form elements or buttons)
					if ( $ush.toLowerCase( e.target.tagName ) !== 'div' ) {
						return;
					}
					self.$sections = $( '.usof-form-group-item', container );

					const $parentSection = $( e.target ).closest( '.usof-form-group-item' );

					if ( $parentSection.hasClass( 'active' ) ) {
						$parentSection
							.removeClass( 'active' )
							.children( '.usof-form-group-item-content' )
							.slideUp();
					} else {
						$parentSection
							.addClass( 'active' )
							.children( '.usof-form-group-item-content' )
							.slideDown();
					}
				} );
			}

			// Init sortable
			if ( self.isSortable ) {
				// Elements
				self.$body = $( document.body );
				self.$window = $( window );
				self.$dragshadow = $( '<div class="us-bld-editor-dragshadow"></div>' );

				// Extend handlers
				$.extend( self._events, {
					maybeDragMove: self.maybeDragMove.bind( self ),
					dragMove: self.dragMove.bind( self ),
					dragEnd: self.dragEnd.bind( self )
				} );

				// Events
				self.$container
					.on( 'dragstart', ( e ) => { e.preventDefault() })
					.on( 'mousedown', '.ui-icon_move', self._dragStart.bind( self ) );
			}
		},

		// TODO: Refactor this method and replace it with a proper solution.
		_hasClass: function( node, className ) {
			return ( ' ' + node.className + ' ' ).indexOf( ' ' + className + ' ' ) > - 1;
		},

		/**
		 * Determines whether the specified node is shadow.
		 *
		 * @param {Node} node The node.
		 * @return {Boolean} True if the specified node is shadow, False otherwise.
		 */
		_isShadow: function( node ) {
			return this._hasClass( node, 'usof-form-group-dragshadow' );
		},

		/**
		 * Determines whether the specified node is sortable.
		 *
		 * @param {Node} node The node.
		 * @return {Boolean} True if the specified node is sortable, False otherwise.
		 */
		_isSortable: function( node ) {
			return this._hasClass( node, 'usof-form-group-item' );
		},

		/**
		 * Handler of field changes in a parameter group.
		 * Note: Here 'change' is not the same 'input:onchange'.
		 *
		 * @event handler
		 */
		_changeGroupParam: function() {
			this.trigger( 'change', this );
		},

		/**
		 * Apply filters to the param.
		 *
		 * @event handler
		 * @param {$usof.field} usofField.
		 */
		_applyFiltersToParam: function( usofField ) {
			const self = this;
			const name = usofField.name;

			if ( ! self._filters[ name ] ) {
				return
			}

			const filters = $ush.toPlainObject( self._filters[ name ] );
			const value = usofField.getValue();

			var newValue = $ush.toString( value );

			// The order is important - do not change unless necessary!
			[
				'sanitize_color_slug',
				'unique_value',
			]
			.map( ( handler ) => {
				if ( newValue && filters[ handler ] && typeof _filtersHandler[ handler ] === 'function' ) {
					newValue = _filtersHandler[ handler ].call( self, newValue, filters[ handler ], usofField );
				}
			} );
			if ( newValue !== value ) {
				usofField.setValue( newValue );
			}
		},

		/**
		 * Reinit group params.
		 */
		_reInitGroupParams: function() {
			const self = this;
			self.groupParams = [];
			$( '.usof-form-group-item', self.$container ).each( ( i, groupParams ) => {
				const $groupParams = $( groupParams );
				if( $groupParams.closest( '.usof-form-group-prototype' ).length ) {
					return;
				}
				var groupParams = $groupParams.data( 'usof.GroupParams' );
				if ( $ush.isUndefined( groupParams ) ) {
					groupParams = new $usof.GroupParams( $groupParams );
				}
				for ( const k in groupParams.fields ) {
					const field = groupParams.fields[ k ];
					field
						.off( 'change', self._events.changeGroupParam )
						.on( 'change', self._events.changeGroupParam );

					// Subscribe filter handlers to events
					if ( ! $.isEmptyObject( self._filters[ k ] ) ) {
						field
							.off( 'blur', self._events.applyFiltersToParam )
							.on( 'blur', self._events.applyFiltersToParam );
					}
				}
				self.groupParams.push( groupParams );
			} );
		},

		/**
		 * Reinit global values changed.
		 */
		_reInitValuesChanged: function() {
			const self = this;
			if ( ! self.isBuilder ) {
				if ( $.isEmptyObject( $usof.instance.valuesChanged ) ) {
					clearTimeout( $usof.instance.saveStateTimer );
					$usof.instance.$saveControl.usMod( 'status', 'notsaved' );
				}
				const value = self.getValue();
				$usof.instance.valuesChanged[ self.groupName ] = value;
				self.$container.trigger( 'change', value );
			}
		},

		/**
		 * Check if the value is set
		 *
		 * @return {Boolean} Returns true if the value is set, false otherwise.
		 */
		hasValue: function() {
			return $ush.checksum( this.getValue() ) !== $ush.checksum( this.getDefaultValue() );
		},

		/**
		 * Get the default field value.
		 *
		 * @return {*} The default value.
		 */
		getDefaultValue: function() {
			return $ush.isUndefined( this._std ) ? '' : this._std;
		},

		/**
		 * Get the current value.
		 *
		 * @return {[]} Returns the current value given the selected response state, if any.
		 */
		getCurrentValue: function() {
			const self = this;
			var result = [];
			for ( const i in self.groupParams ) {
				result.push( self.groupParams[ i ].getCurrentValues() );
			}
			if ( self.hasStringValue ) {
				try {
					result = $ush.toString( result );
				} catch ( err ) {
					console.error( result, err );
					result = '';
				}
			}
			return result;
		},

		/**
		 * Set the value.
		 *
		 * @param {String|[]} value The value.
		 */
		setValue: function( value ) {
			const self = this;
			// If the value came as a string, then we will try to convert it into an object
			if ( typeof value === 'string' && self.hasStringValue ) {
				try {
					value = JSON.parse( $ush.rawurldecode( value ) || '[]' );
				} catch ( err ) {
					console.error( value, err );
					value = [];
				}
			}
			self.groupParams = [];
			$( '.usof-form-group-item', self.$container ).each( ( i, groupParams ) => {
				const $groupParams = $( groupParams );
				if ( ! $groupParams.parent().hasClass( 'usof-form-group-prototype' ) ) {
					$groupParams.remove();
				}
			} );
			$.each( value, ( index, paramsValues ) => {
				const $groupParams = $( self.$prototype.html() );
				if ( self.$btnAddGroup.length ) {
					self.$btnAddGroup.before( $groupParams );
				} else {
					self.$container.append( $groupParams );
				}
				const groupParams = new $usof.GroupParams( $groupParams );
				groupParams.setValues( paramsValues, true );
				for ( const  k in groupParams.fields ) {
					if ( ! groupParams.fields.hasOwnProperty( k ) ) {
						continue;
					}
					groupParams.fields[ k ].trigger( 'change' );
					break;
				}

				// Set preview class
				if ( self.isButtonPreview || self.isFieldPreview ) {
					const uniqueClass = String( $( '[data-preview-class-format]', $groupParams ).data( 'preview-class-format' ) );
					$( '.usof-preview-class-main', $groupParams ).text( uniqueClass.replace( '%s', paramsValues.id ) );
				}
			} );

			self._reInitGroupParams();
			self._reInitValuesChanged();
		},

		/**
		 * Get the value.
		 *
		 * @return {String|[]} The value
		 */
		getValue: function() {
			const self = this;
			var result = [];
			$.each( self.groupParams, ( _, groupParams ) => { result.push( groupParams.getValues() ); } );
			if ( self.hasStringValue ) {
				if ( result.length ) {
					try {
						result = $ush.toString( result );
					} catch ( err ) {
						console.error( result, err );
						result = self.getDefaultValue();
					}
				} else {
					result = self.getDefaultValue();
				}
			}
			return result;
		},

		/**
		 * Add group.
		 *
		 * @param {Number} index Add a group after the specified index
		 * @return {{}} $usof.GroupParams
		 */
		addGroup: function( index ) {
			const self = this;
			self.$btnAddGroup.addClass( 'adding' );
			var $groupPrototype = $( self.$prototype.html() );
			if ( ( self.isButtonPreview || self.isFieldPreview ) && ! $ush.isUndefined( index ) ) {
				self.$btnAddGroup
					.closest( '.usof-form-group' )
					.find( ` > .usof-form-group-item:eq(${parseInt( index )})` )
					.after( $groupPrototype );
			} else {
				self.$btnAddGroup.before( $groupPrototype );
			}
			const groupParams = new $usof.GroupParams( $groupPrototype );
			for ( const k in groupParams.fields ) {
				const field = groupParams.fields[ k ];
				field.on( 'change', self._events.changeGroupParam );
				// Subscribe filter handlers to events
				if ( ! $.isEmptyObject( self._filters[ k ] ) ) {
					field
						.on( 'blur', self._events.applyFiltersToParam )
						.trigger( 'blur' ); // apply default filters
				}
			}
			if ( ( self.isButtonPreview || self.isFieldPreview ) && index !== _undefined ) {
				self.groupParams.splice( index + 1, 0, groupParams );
			} else {
				self.groupParams.push( groupParams )
			}

			if ( ! self.isBuilder ) {
				if ( $.isEmptyObject( $usof.instance.valuesChanged ) ) {
					clearTimeout( $usof.instance.saveStateTimer );
					$usof.instance.$saveControl.usMod( 'status', 'notsaved' );
				}
				const value = self.getValue();
				$usof.instance.valuesChanged[ self.groupName ] = value;
				self.$container.trigger( 'change', value );
			}
			// TODO: Need to get rid of the crutch this.isButtonPreview
			// TODO: Make a universal method to find a unique value
			if ( self.isButtonPreview || self.isFieldPreview ) {
				var newIndex = self.groupParams.length,
					newId = 1,
					newIndexIsUnique;
				for ( const i in self.groupParams ) {
					newId = Math.max( ( parseInt( self.groupParams[ i ].fields.id.getValue() ) || 0 ) + 1, newId );
				}
				do {
					newIndexIsUnique = true;
					for ( const i in self.groupParams ) {
						if ( self.groupParams[ i ].fields.name.getValue() == self.groupTranslations.style + ' ' + newIndex ) {
							newIndex ++;
							newIndexIsUnique = false;
							break;
						}
					}
				} while ( ! newIndexIsUnique );
				groupParams.fields.name.setValue( self.groupTranslations.style + ' ' + newIndex );
				groupParams.fields.id.setValue( newId );

				// Set preview class
				const uniqueClass = String( $( '[data-preview-class-format]', groupParams.$container ).data( 'preview-class-format' ) );
				$( '.usof-preview-class-main', groupParams.$container ).text( uniqueClass.replace( '%s', newId ) );
			}

			// If the group is running in a EditLive context then set the title for accordion
			// NOTE: This is a forced decision that will be fixed when refactoring the code!
			if ( self.isLiveBuilder ) {
				groupParams.setAccordionTitle();
			}

			self.$btnAddGroup.removeClass( 'adding' );
			return groupParams;
		},

		/**
		 * Duplicate group.
		 *
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		duplicateGroup: function( e ) {
			const self = this;
			const $target = $( e.currentTarget );
			const $group = $target.closest( '.usof-form-group-item' );
			const index = $group.index() - 1;
			if ( self.groupParams.hasOwnProperty( index ) ) {
				var $item = self.groupParams[ index ],
					values = $item.getValues(),
					number = 0;
				values.name = values.name.replace( /\s?\(.*\)$/, '' ).trim();
				// Create new group name
				for ( const i in self.groupParams ) {
					const name = self.groupParams[ i ].getValue( 'name' ) || '';
					const numMatches = name.match( new RegExp( values.name + '\\s?\\((\\d+)*', 'm' ) );
					if ( numMatches !== null ) {
						number = Math.max( number, parseInt( numMatches[1] || 1 ) );
					}
				}
				values.name += ' (' + ( ++ number ) + ')';
				const newGroup = self.addGroup( index );
				newGroup.setValues( $.extend( values, {
					id: newGroup.getValue( 'id' )
				} ) );
			}
		},

		/**
		 * Delete group.
		 *
		 * @param {Node} $group The group.
		 */
		deleteGroup: function( $group ) {
			$group.remove();
			this._reInitGroupParams();
			this._reInitValuesChanged();
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		_dragStart: function( e ) {
			const self = this;
			e.stopPropagation();
			self.$draggedElm = $( e.target ).closest( '.usof-form-group-item' );
			self.detached = false;
			self._updateBlindSpot( e );
			self.elmPointerOffset = [ e.pageX, e.pageY ].map( $ush.parseInt );
			self.$body.on( 'mousemove', self._events.maybeDragMove );
			self.$window.on( 'mouseup', self._events.dragEnd );
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		_updateBlindSpot: function( e ) {
			this.blindSpot = [ e.pageX, e.pageY ].map( $ush.parseInt );
		},

		/**
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		_isInBlindSpot: function( e ) {
			const self = this;
			return (
				Math.abs( e.pageX - self.blindSpot[0] ) <= 20
				&& Math.abs( e.pageY - self.blindSpot[1] ) <= 20
			);
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		maybeDragMove: function( e ) {
			const self = this;
			e.stopPropagation();
			if ( self._isInBlindSpot( e ) ) {
				return;
			}
			self.$body.off( 'mousemove', self._events.maybeDragMove );
			self._detach();
			self.$body.on( 'mousemove', self._events.dragMove );
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		_detach: function( e ) {
			const self = this;
			const offset = self.$draggedElm.offset();
			self.elmPointerOffset[0] -= offset.left;
			self.elmPointerOffset[1] -= offset.top;
			$( '.usof-form-group-item-title', self.$draggedElm ).hide();
			if ( ! self.isAccordion || self.$draggedElm.hasClass( 'active' ) ) {
				$( '.usof-form-group-item-content', self.$draggedElm ).hide();
			}
			self.$dragshadow.css( {
				width: self.$draggedElm.outerWidth()
			} ).insertBefore( self.$draggedElm );
			self.$draggedElm.addClass( 'dragged' ).css( {
				position: 'absolute',
				'pointer-events': 'none',
				zIndex: 10000,
				width: self.$draggedElm.width(),
				height: self.$draggedElm.height()
			} ).css( offset ).appendTo( self.$body );
			if ( self.isBuilder ) {
				self.$builderWindow.addClass( 'dragged' );
			}
			self.$container.addClass( 'dragging' );
			self.detached = true;
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		dragMove: function( e ) {
			const self = this;
			e.stopPropagation();
			self.$draggedElm.css( {
				left: e.pageX - self.elmPointerOffset[0],
				top: e.pageY - self.elmPointerOffset[1]
			} );
			if ( self._isInBlindSpot( e ) ) {
				return;
			}
			var element = e.target;
			// Checking two levels up
			for ( var level = 0; level <= 2; level ++, element = element.parentNode ) {
				if ( self._isShadow( element ) ) {
					return;
				}
				if ( self._isSortable( element ) ) {
					// Dropping element before or after sortables based on their relative position in DOM
					var nextElement = element.previousSibling,
						shadowAtLeft = false;
					while ( nextElement ) {
						if ( nextElement == this.$dragshadow[0] ) {
							shadowAtLeft = true;
							break;
						}
						nextElement = nextElement.previousSibling;
					}
					self.$dragshadow[ shadowAtLeft ? 'insertAfter' : 'insertBefore' ]( element );
					self._dragDrop( e );
					break;
				}
			}
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		_dragDrop: function( e ) {
			this._updateBlindSpot( e );
		},

		/**
		 * @event handler
		 * @param {Event} e The Event interface represents an event which takes place in the DOM.
		 */
		dragEnd: function( e ) {
			const self = this;
			self.$body
				.off( 'mousemove', self._events.maybeDragMove )
				.off( 'mousemove', self._events.dragMove );
			self.$window
				.off( 'mouseup', self._events.dragEnd );
			if ( self.detached ) {
				self.$draggedElm
					.removeClass( 'dragged' )
					.removeAttr( 'style' )
					.insertBefore( self.$dragshadow );
				self.$dragshadow.detach();
				if ( self.isBuilder ) {
					self.$builderWindow.removeClass( 'dragged' );
				}
				$( '.usof-form-group-item-title', self.$draggedElm ).show();
				if ( ! self.isAccordion || self.$draggedElm.hasClass( 'active' ) ) {
					$( '.usof-form-group-item-content', self.$draggedElm ).show();
				}
				self._reInitGroupParams();
				self._reInitValuesChanged();
			}
			self.$container.removeClass( 'dragging' );
		}

	} );

	// Group initialization
	$.fn.usofGroup = function( options ) {
		return new $usof.Group( this, options );
	};

}( jQuery );

/**
 * USOF GroupParams
 */
! function( $, _undefined ) {
	"use strict";

	$usof.GroupParams = function( container ) {
		const self = this;

		self.$container = $( container );
		self.$group = self.$container.closest( '.usof-form-group' );
		self.group = self.$group.data( 'name' );

		self.isGroupParams = true;
		self.isBuilder = self.$container.parents( '.us-bld-window' ).length > 0;
		self.isButtonPreview = self.$group.hasClass( 'preview_button' );
		self.isFieldPreview = self.$group.hasClass( 'preview_input_fields' );

		self._events = {
			setAccordionTitle: self.setAccordionTitle.bind( self ),
		};

		self.initFields( self.$container );
		self.fireFieldEvent( self.$container, 'beforeShow' );
		self.fireFieldEvent( self.$container, 'afterShow' );

		var accordionTitle = self.$group.data( 'accordion-title' );
		if ( ! $ush.isUndefined( accordionTitle ) ) {
			accordionTitle = decodeURIComponent( accordionTitle );
		}
		self.accordionTitle = accordionTitle;

		// If the title for the accordion is not empty then we will watch
		// the changes in the fields in order to correctly update the title
		if ( self.hasAccordionTitle() ) {
			for ( const fieldId in self.fields ) {
				if ( ! self.fields.hasOwnProperty( fieldId ) ) {
					continue;
				}
				self.fields[ fieldId ].on( 'change', self._events.setAccordionTitle );
			}
		}

		// Live Builder extra class for the buttons
		if ( self.isButtonPreview || self.isFieldPreview ) {
			for ( const fieldId in self.fields ) {
				if ( fieldId !== 'class' && self.fields.hasOwnProperty( fieldId ) ) {
					continue;
				}
				self.fields[ fieldId ].on( 'change', ( _, value ) => {
					self.$extraClass = $( '.usof-preview-class-extra', self.$container );
					self.$extraClass.text( value );
				} );
			}
		}

		if ( ! self.isBuilder ) {
			for ( const fieldId in self.fields ) {
				if ( ! self.fields.hasOwnProperty( fieldId ) ) {
					continue;
				}
				self.fields[ fieldId ].on( 'change', () => {
					if ( $usof.instance && $.isEmptyObject( $usof.instance.valuesChanged ) ) {
						clearTimeout( $usof.instance.saveStateTimer );
						$usof.instance.$saveControl.usMod( 'status', 'notsaved' );
					}
					if ( $ush.isUndefined( self.group ) ) {
						return;
					}
					if ( $usof.instance.groups[ self.group ] instanceof $usof.Group ) {
						$usof.instance.valuesChanged[ self.group ] = $usof.instance.groups[ self.group ].getValue();
					}
				} );
			}
		}

		// Used in "USOF_ButtonPreview" and "USOF_FieldPreview"
		self.$container.data( 'usof.GroupParams', self );

		if ( self.isButtonPreview ) {
			$( '.usof-btn-preview', self.$container ).USOF_ButtonPreview();

		} else if ( self.isFieldPreview ) {
			$( '.usof-input-preview', self.$container ).USOF_FieldPreview()
		}
	};

	// GroupParams API
	$.extend( $usof.GroupParams.prototype, $usof.mixins.Fieldset, {

		/**
		 * Determines if accordion title.
		 *
		 * @return {Boolean} True if accordion title, False otherwise.
		 */
		hasAccordionTitle: function() {
			return $ush.toString( this.accordionTitle ) !== '';
		},

		/**
		 * Set the title for accordion
		 */
		setAccordionTitle: function() {
			const self = this;

			if ( ! self.hasAccordionTitle() ) {
				return;
			}

			self.$title = $( '.usof-form-group-item-title', self.$container );
			if ( self.isButtonPreview ) {
				self.$title = $( '.usof-btn-label', self.$title );
			}
			if ( self.isFieldPreview ) {
				self.$title = $( 'input.usof-input-preview-elm', self.$title );
			}

			var title = self.accordionTitle;
			for ( const fieldId in self.fields ) {
				if (
					! self.fields.hasOwnProperty( fieldId )
					|| title.indexOf( fieldId ) < 0
				) {
					continue;
				}
				const field = self.fields[ fieldId ];
				var value = self.getValue( fieldId );
				if (
					field.hasOwnProperty( 'type' )
					&& field.type === 'select'
				) {
					var $option = $( `option[value="${value}"]`, field.$container );
					if ( $option.length && $option.html() !== '' ) {
						value = $option.html();
					}
				}
				title = title.replace( fieldId, value );
			}

			if ( self.isFieldPreview ) {
				self.$title.attr( 'placeholder', title );
			} else {
				self.$title.text( title );
			}
		}
	} );

}( jQuery );

/**
 * USOF Meta
 */
! function( $, _undefined ) {
	"use strict";

	$usof.Meta = function( container ) {
		const self = this;

		window.USMMSettings = window.USMMSettings || {};

		self.$container = $( container );
		self.initFields( self.$container );

		self.fireFieldEvent( self.$container, 'beforeShow' );
		self.fireFieldEvent( self.$container, 'afterShow' );

		for ( const fieldId in self.fields ) {
			if ( ! self.fields.hasOwnProperty( fieldId ) ) {
				continue;
			}
			self.fields[ fieldId ].on( 'change', ( field, value ) => {
				for ( const savingFieldId in self.fields ) {
					window.USMMSettings[ savingFieldId ] = self.fields[ savingFieldId ].getValue();
				}
				$( document.body ).trigger( 'usof_mm_save' );
			} );
		}

		self.$container.data( 'usof.Meta', self );
	};

	// Meta API
	$.extend( $usof.Meta.prototype, $usof.mixins.Fieldset );

	$( () => {
		$.each( $( '.usof-container.for_meta' ), ( _, node ) => { new $usof.Meta( node ); } );

		$( document.body ).off( 'usof_mm_load' ).on( 'usof_mm_load', () => {
			$( '.us-mm-settings' ).each( ( _, node ) => { new $usof.Meta( node ); } );
		} );
	} );

}( jQuery );

/**
 * USOF Form
 */
! function( $, _undefined ) {
	"use strict";

	const max = Math.max;
	const JSON_MIME_TYPE = 'application/json';

	$usof.Form = function( container ) {
		const self = this;

		// Elements
		self.$window = $( window );
		self.$container = $( container );

		if ( self.$container.length === 0 ) {
			return;
		}

		self.$header = $( '.usof-header', self.$container );
		self.$title = $( '.usof-header-title h2', self.$container );
		self.$controlForSchemes = $( '.for_color_schemes', self.$container );
		self.$controlForImportExport = $( '.for_import_export', self.$container );

		self.$container.addClass( 'inited' );

		self.active = null;
		self.$sections = {};
		self.$sectionContents = {};
		self.sectionFields = {};
		self.isThemeOptionsPage = self.$container.hasClass( 'theme_options_page' );

		$usof.instance = self;
		self.initFields( self.$container );
		self.initDataIndicator();

		self._events = {
			scroll: self.scroll.bind( self ),
			resize: self.resize.bind( self ),
			onImportStyles: self.onImportStyles.bind( self ),
			onExportStyles: self.onExportStyles.bind( self ),
			disableExportStyles: $ush.debounce( self.disableExportStyles.bind( self ), 2 ),
		};

		$( '.usof-section', self.$container ).each( ( index, section ) => {
			var $section = $( section ),
				sectionId = $section.data( 'id' );
			self.$sections[ sectionId ] = $section;
			self.$sectionContents[ sectionId ] = $( '.usof-section-content', $section );
			if ( $section.hasClass( 'current' ) ) {
				self.active = sectionId;
			}
			self.sectionFields[ sectionId ] = [];
			$( '.usof-form-row', $section ).each( ( index, row ) => {
				const fieldName = $( row ).data( 'name' );
				if ( fieldName ) {
					self.sectionFields[ sectionId ].push( fieldName );
				}
			} );
		} );

		self.sectionTitles = {};
		$( '.usof-nav-item.level_1', self.$container ).each( ( index, item ) => {
			const $item = $( item );
			self.sectionTitles[ $item.data( 'id' ) ] = $( '.usof-nav-title', $item ).html();
		} );

		self.navItems = $( '.usof-nav-item.level_1, .usof-section-header', self.$container );
		$( '.usof-section-header', self.$container ).each( ( _, item ) => {
			const $item = $( item );
			$item.on( 'click', () => self.openSection( $item.data( 'id' ) ) );
		} );

		// Initializing fields at the shown section
		if ( ! $ush.isUndefined( self.$sections[ self.active ] ) ) {
			self.fireFieldEvent( self.$sections[ self.active ], 'beforeShow' );
			self.fireFieldEvent( self.$sections[ self.active ], 'afterShow' );
		}

		// Save changes
		self.$saveControl = $( '.usof-control.for_save', self.$container );
		self.$saveBtn = $( '.usof-button', self.$saveControl ).on( 'click', self.saveChanges.bind( self ) );
		self.$saveMessage = $( '.usof-control-message', self.$saveControl );
		self.valuesChanged = {};
		self.saveStateTimer = null;

		for ( const fieldId in self.fields ) {
			if ( ! self.fields.hasOwnProperty( fieldId ) ) {
				continue;
			}
			self.fields[ fieldId ].on( 'change', ( field, value ) => {
				if ( $.isEmptyObject( self.valuesChanged ) ) {
					clearTimeout( self.saveStateTimer );
					self.$saveControl.usMod( 'status', 'notsaved' );
				}
				self.valuesChanged[ field.name ] = value;
			} );
		}

		self.resize();

		if ( self.isThemeOptionsPage ) {

			self.$importStyles = $( '.import_styles', self.$controlForImportExport );
			self.$exportStyles = $( '.export_styles', self.$controlForImportExport );

			if ( self.groups['buttons'] instanceof $usof.Group ) {
				self.groups['buttons'].on( 'change', self._events.disableExportStyles );
			}
			if ( self.groups['input_fields'] instanceof $usof.Group ) {
				self.groups['input_fields'].on( 'change', self._events.disableExportStyles );
			}

			self.$controlForSchemes
				.on( 'click', () => $( '.usof-form-row.type_style_scheme' ).show() );

			self.$controlForImportExport
				.on( 'click', '.export_styles', self._events.onExportStyles )
				.on( 'click', '.import_styles', self._events.onImportStyles );
		}

		self.$window
			.on( 'resize load', self._events.resize )
			.on( 'scroll', self._events.scroll )
			.on( 'hashchange', () => self.openSection( document.location.hash.substring(1) ) );

		self.$window.on( 'keydown', ( event ) => {
			if ( event.ctrlKey || event.metaKey ) {
				if ( String.fromCharCode( event.which ).toLowerCase() == 's' ) {
					event.preventDefault();
					$usof.instance.saveChanges();
				}
			}
		} );

		// Handling initial document hash
		if ( document.location.hash && document.location.hash.indexOf( '#!' ) == - 1 ) {
			self.openSection( document.location.hash.substring(1) );
		}

		self.$container.data( 'usof.Form', self );
	};

	// Form API
	$.extend( $usof.Form.prototype, $usof.mixins.Fieldset, {

		openSection: function( sectionId ) {
			const self = this;
			if ( sectionId == self.active || $ush.isUndefined( self.$sections[ sectionId ] ) ) {
				return;
			}
			if ( ! $ush.isUndefined( self.$sections[ self.active ] ) ) {
				self.hideSection();
			}

			// Toggles specific controls
			self.$controlForSchemes.toggleClass( 'hidden', sectionId !== 'colors' );
			self.$controlForImportExport.toggleClass( 'hidden', ! [ 'buttons', 'input_fields', 'typography' ].includes( sectionId ) );

			self.showSection( sectionId );
		},

		showSection: function( sectionId ) {
			const self = this;
			const $curItem = self.navItems.filter( `[data-id="${sectionId}"]` );
			$curItem.addClass( 'current' );
			self.fireFieldEvent( self.$sectionContents[ sectionId ], 'beforeShow' );
			self.$sectionContents[ sectionId ].stop( true, false ).fadeIn();
			self.$title.html( self.sectionTitles[ sectionId ] );
			self.fireFieldEvent( self.$sectionContents[ sectionId ], 'afterShow' );
			// Item popup
			const itemPopup = $( '.usof-nav-popup', $curItem );
			if ( itemPopup.length > 0 ) {
				// Current usof_visited_new_sections cookie
				const matches = document.cookie.match( /(?:^|; )usof_visited_new_sections=([^;]*)/ );
				const cookieValue = matches ? decodeURIComponent( matches[1] ) : '';
				const visitedNewSections = ( cookieValue == '' ) ? [] : cookieValue.split( ',' );
				if ( visitedNewSections.indexOf( sectionId ) == - 1 ) {
					visitedNewSections.push( sectionId );
					document.cookie = 'usof_visited_new_sections=' + visitedNewSections.join( ',' )
				}
				itemPopup.remove();
			}
			self.active = sectionId;
		},

		hideSection: function() {
			const self = this;
			self.navItems.filter( `[data-id="${self.active}"]` ).removeClass( 'current' );
			self.fireFieldEvent( self.$sectionContents[ self.active ], 'beforeHide' );
			self.$sectionContents[ self.active ].stop( true, false ).hide();
			self.$title.html( '' );
			self.fireFieldEvent( self.$sectionContents[ self.active ], 'afterHide' );
			self.active = null;
		},

		onExportStyles: function() {
			const self = this;
			const sectionId = document.location.hash.substring(1);
			const allValues = self.getValues();
			var name = sectionId;
			if ( sectionId === 'buttons' ) {
				name = 'button_styles';
			}
			if ( sectionId === 'input_fields' ) {
				name = 'field_styles';
			}

			var data = {};
			if ( sectionId === 'typography' ) {
				const typographyKeys = [
					'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'adobe_fonts', 'custom_font', 'font-family',
					'font-size', 'font-style', 'font-weight', 'font-display', 'uploaded_fonts'
				];
				typographyKeys.forEach( key => {
					if ( ! $ush.isUndefined( allValues[ key ] ) && key !== 'adobe_fonts' ) {
						data[ key ] = allValues[ key ];
					}
					if ( key === 'adobe_fonts' ) {
						const typekitId = $( '[name="typekit_id"]' ).val();
						if ( typekitId ) {
							data[ key ] = typekitId;
						}
					}
				} );
				data = JSON.stringify( data );

			} else {
				data = JSON.stringify( ( allValues || {} )[ sectionId ] ?? {} );
			}
			if ( data ) {
				$ush.download( data, `${ name }_[%s].json`.replace( '%s', window.location.host ), JSON_MIME_TYPE );
			}
		},

		onImportStyles: function() {
			const self = this;
			const fileInput = document.createElement( 'input' );
			const ERROR_INCORRECT_FILE = 'Incorrect file';
			const sectionId = document.location.hash.substring(1);
			const loadStyles = ( e ) => {
				try {
					const fileData = JSON.parse( String( e.target.result ).trim() );

					if ( sectionId === 'typography' ) {
						if (
							! fileData
							|| $ush.isUndefined( ( fileData || {} )['font-family'] )
						) {
							throw new Error();
						}
						if ( ! confirm( 'Override the current Typography settings?' ) ) {
							return;
						}
						const allValues = self.getValues() || {};

						Object.keys( fileData ).forEach( ( key ) => {
							allValues[ key ] = fileData[ key ];
						} );

						self.setValues( allValues );
						$( window ).trigger( 'usof_typography_import' );

						// Set adobe fonts
						if ( fileData['adobe_fonts'] ) {
							$( '[name="typekit_id"]' )
								.val( fileData['adobe_fonts'] )
								.trigger( 'change' );
							$( '.usof-button.type_adobe_fonts_apply' ).trigger( 'click' );
						}

					} else if ( self.groups[ sectionId ] instanceof $usof.Group ) {
						if (
							! Array.isArray( fileData )
							|| fileData.length === 0
						) {
							throw new Error;
						}
						// Check if buttons styles in import
						if ( sectionId === 'buttons' && $ush.isUndefined( fileData[0].hover_text_animation ) ) {
							throw new Error;
						}
						// Check if input styles in import
						if ( sectionId === 'input_fields' && $ush.isUndefined( fileData[0].checkbox_size ) ) {
							throw new Error;
						}
						var maxId = 0,
							values = $ush.toArray( self.groups[ sectionId ].getValue() );
						values.map( ( style ) => {
							maxId = max( maxId, $ush.parseInt( style.id ) );
						} );
						if ( maxId ) {
							fileData.map( ( item ) => { item.id = ++maxId; } );
						}
						self.groups[ sectionId ].setValue( values.concat( fileData ) );
					}
				} catch ( err ) {
					return alert( ERROR_INCORRECT_FILE );
				}
			};
			fileInput.type = 'file';
			fileInput.accept = JSON_MIME_TYPE;
			fileInput.onchange = () => {
				const stylesFile = fileInput.files[0];
				if ( ! stylesFile || stylesFile.type !== JSON_MIME_TYPE ) {
					return alert( ERROR_INCORRECT_FILE );
				}
				self.$importStyles.addClass( 'disabled' );
				const reader = new FileReader;
				reader.addEventListener( 'load', loadStyles );
				reader.addEventListener( 'loadend', () => {
					$ush.timeout( () => { self.$importStyles.removeClass( 'disabled' ); }, 5 );
				} );
				reader.addEventListener( 'error', () => { alert( 'Error reading the file. Please try again.' ); } );
				reader.readAsText( stylesFile );
			};
			fileInput.click();
		},

		disableExportStyles: function( theGroup ) {
			const self = this;
			var value = theGroup.getValue();
			if ( ! Array.isArray( value ) ) {
				value = [];
			}
			self.$exportStyles.toggleClass( 'disabled', value.length === 0 );
		},

		saveChanges: function() {
			const self = this;
			if ( $.isEmptyObject( self.valuesChanged ) ) {
				return;
			}
			clearTimeout( self.saveStateTimer );
			self.$saveMessage.html( '' );
			self.$saveControl.usMod( 'status', 'loading' );

			$.ajax( {
				type: 'POST',
				url: $usof.ajaxUrl,
				dataType: 'json',
				data: {
					action: 'usof_save',
					usof_options: JSON.stringify( self.valuesChanged ),
					_wpnonce: $( '[name="_wpnonce"]', self.$container ).val(),
					_wp_http_referer: $( '[name="_wp_http_referer"]', self.$container ).val()
				},
				success: ( result ) => {
					if ( result.success ) {
						self.valuesChanged = {};
						self.$saveMessage.html( result.data.message );
						self.$saveControl.usMod( 'status', 'success' );
						self.saveStateTimer = setTimeout( () => {
							self.$saveMessage.html( '' );
							self.$saveControl.usMod( 'status', 'clear' );
						}, 4000 );
					} else {
						self.$saveMessage.html( result.data.message );
						self.$saveControl.usMod( 'status', 'error' );
						self.saveStateTimer = setTimeout( () => {
							self.$saveMessage.html( '' );
							self.$saveControl.usMod( 'status', 'notsaved' );
						}, 4000 );
					}
				}
			} );
		},

		scroll: function() {
			this.$container.toggleClass( 'footer_fixed', this.$window.scrollTop() > this.headerAreaSize );
		},

		resize: function() {
			const self = this;
			if ( ! self.$header.length ) {
				return;
			}
			self.headerAreaSize = self.$header.offset().top + self.$header.outerHeight();
			self.scroll();
		},

	} );

	$( () => new $usof.Form( '.usof-container:not(.inited)' ) );

}( jQuery );
