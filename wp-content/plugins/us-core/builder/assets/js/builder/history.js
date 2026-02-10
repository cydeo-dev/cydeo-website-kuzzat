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
	_window.$usof = _window.$usof || {};
	_window.$usbcore = _window.$usbcore || {};

	// The type of data history being used
	// const HISTORY_TYPE = {
	// 	REDO: 'redo',
	// 	UNDO: 'undo'
	// };

	// Actions that are applied when content changes
	// const ACTION_CONTENT = {
	// 	CALLBACK: 'callback', // recovery via callback function
	// 	CREATE: 'create', // create new shortcode and add to content
	// 	MOVE: 'move', // move shortcode
	// 	REMOVE: 'remove', // remove shortcode from content
	// 	UPDATE: 'update' // update shortcode in content
	// };

	// Data change history stack
	const _changesHistory = {
		redo: [], // data redo stack
		tasks: [], // all tasks to recover
		undo: [] // data undo stack
	};

	// Private temp data
	const _$tmp = {
		isActiveRecoveryTask: false, // active data recovery process
		_latestShortcodeUpdate: {}, // latest updated shortcode data (The cache provides correct data when multiple threads `debounce` or `throttle` are run)
	};

	/**
	 * @class History - Functionality for keeping a history of changes on the page, which allows you to undo or restore changes
	 */
	function History() {
		const self = this;

		// Bondable events
		self._events = {
			historyChanged: self.historyChanged.bind( self ),
			redoChange: self.redoChange.bind( self ),
			undoChange: self.undoChange.bind( self ),
		};

		$( () => {

			// Actions
			self.$actionUndo = $( '.usb_action_undo', $usb.$panel );
			self.$actionRedo = $( '.usb_action_redo', $usb.$panel );

			// Events
			$usb.$panel
				.on( 'click', '.usb_action_undo', self._events.undoChange )
				.on( 'click', '.usb_action_redo', self._events.redoChange );
		} );

		// Private events
		$usb
			.on( 'hotkeys.ctrl+z', self._events.undoChange )
			.on( 'hotkeys.ctrl+shift+z', self._events.redoChange );

		self.on( 'historyChanged', self._events.historyChanged );

	}

	// History API
	$.extend( History.prototype, $ush.mixinEvents, {

		/**
		 * Undo handler
		 *
		 * @event handler
		 */
		undoChange: function() {
			this._createRecoveryTask( HISTORY_TYPE.UNDO );
		},

		/**
		 * Redo handler
		 *
		 * @event handler
		 */
		redoChange: function() {
			this._createRecoveryTask( HISTORY_TYPE.REDO );
		},

		/**
		 * Handler for data history changes; this method
		 * is called every time the history data is updated.
		 *
		 * @event handler
		 */
		historyChanged: function() {
			const self = this;
			[ // Controll the operation and display of undo/redo buttons
				{ $btn: self.$actionUndo, disabled: ! self.getLengthUndo() },
				{ $btn: self.$actionRedo, disabled: ! self.getLengthRedo() }
			].map( ( i ) => {
				i.$btn
					.toggleClass( 'recovery_process', !! self.getLengthTasks() )
					.toggleClass( 'disabled', i.disabled )
					.prop( 'disabled', i.disabled )
			} );
		},

		/**
		 * Get the length of 'undo'
		 *
		 * @return {Number}
		 */
		getLengthUndo: function() {
			return _changesHistory.undo.length;
		},

		/**
		 * Get the length of 'redo'
		 *
		 * @return {Number}
		 */
		getLengthRedo: function() {
			return _changesHistory.redo.length;
		},

		/**
		 * Get the length of 'tasks'
		 *
		 * @return {Number}
		 */
		getLengthTasks: function() {
			return _changesHistory.tasks.length;
		},

		/**
		 * Get the last history data by action
		 *
		 * @param {String} action The action name
		 * @return {{}} Returns the last data object for the action
		 */
		getLastHistoryDataByAction: function( action ) {
			const self = this;

			var lastData,
				undo = _changesHistory.undo;
			if (
				self.getLengthUndo()
				&& $usbcore.indexOf( action, ACTION_CONTENT ) > -1
			) {
				for ( var i = self.getLengthUndo() -1; i >= 0; i-- ) {
					if ( ( undo[ i ] || {} ).action === action ) {
						lastData = $ush.clone( undo[ i ] );
						break;
					}
				}
			}
			return lastData || {};
		},

		/**
		 * Sets the latest shortcode update.
		 *
		 * @param {{}} data The data.
		 */
		setLatestShortcodeUpdate: function( data ) {
			_$tmp._latestShortcodeUpdate = $ush.toPlainObject( data );
		},

		/**
		 * Determines if active recovery task
		 *
		 * @return {Boolean} True if active recovery task, False otherwise
		 */
		isActiveRecoveryTask: function() {
			return !! _$tmp.isActiveRecoveryTask;
		},

		/**
		 * Save data to history by interval
		 * Note: The code is moved to a separate function since `throttle` must be initialized before call
		 *
		 * @param {Function} fn The function to be executed
		 * @type throttle
		 */
		__saveDataToHistory: $ush.throttle( $ush.fn, 2000, /* no_trailing */true ),

		/**
		 * Commit to save changes to history
		 * Note: This method is designed to work only with builder elements
		 *
		 * @param {String} id Shortcode's usbid, e.g. "us_btn:1"
		 * @param {String} action The action that is executed to apply the changes
		 * @param {Boolean} useThrottle Using the interval when save data
		 * @param {{}} extData External end-to-end data
		 */
		commitChange: function( id, action, useThrottle, extData ) {
			const self = this;
			if (
				! action
				|| ! $usb.builder.isValidId( id )
				|| self.isActiveRecoveryTask()
				|| $usbcore.indexOf( action, ACTION_CONTENT ) < 0
			) {
				return;
			}

			// Save change data in history
			const saveDataToHistory = () => {
				// The current data of the shortcode before apply the action
				var data = {
					action: action,
					id: id,
					extData: $.isPlainObject( extData ) ? extData : {},
				};

				// Get and save the position of an element
				if ( [ ACTION_CONTENT.MOVE, ACTION_CONTENT.REMOVE ].includes( action ) ) {
					data.index = $usb.builder.getElmIndex( id );
					data.parentId = $usb.builder.getElmParentId( id );
				}
				// Get and save the preview of an element
				if ( [ ACTION_CONTENT.UPDATE, ACTION_CONTENT.REMOVE ].includes( action ) ) {
					data.content = $usb.builder.getElmShortcode( id );
					data.preview = $usb.builder.getElmOuterHtml( id );

					// Сheck the load of the element, if the preview contains the class for update the element,
					// then we will skip save to history
					const pcre = new RegExp( 'class="(.*)?'+ $usb.config( 'className.elmLoad', 'usb-elm-loading' ) +'(\s|")' );
					if ( data.preview && pcre.test( data.preview ) ) {
						return;
					}
				}
				/**
				 * Get data from shared cache
				 * Note: The cache provides correct data when multiple threads `debounce` or `throttle` are run
				 */
				if ( ACTION_CONTENT.UPDATE === action && ! $.isEmptyObject( _$tmp._latestShortcodeUpdate ) ) {
					$.extend( data, _$tmp._latestShortcodeUpdate );
					_$tmp._latestShortcodeUpdate = {};
				}

				// Get parameters before delete, this will help restore the element
				if ( ACTION_CONTENT.REMOVE === action ) {
					data.values = $usb.builder.getElmValues( id );
				}

				// Check against the latest data to eliminate duplicates
				if ( ACTION_CONTENT.UPDATE === action ) {

					// Get the last history data by action
					var lastData = self.getLastHistoryDataByAction( ACTION_CONTENT.UPDATE );

					// Check for duplicate objects
					const props = [ 'index', 'parentId', 'timestamp' ]; // properties to remove
					if (
						! $.isEmptyObject( lastData )
						&& $ush.comparePlainObject(
							$usbcore.clearPlainObject( lastData, props ),
							$usbcore.clearPlainObject( data, props )
						)
					) {
						return;
					}
				}

				// If the maximum limit is exceeded, then we will delete the old data
				if ( self.getLengthUndo() >= $ush.parseInt( $usb.config( 'maxDataHistory', /* default */100 ) ) ) {
					_changesHistory.undo = _changesHistory.undo.slice( 1 );
				}

				// Save data in `undo` and destroy `redo`
				_changesHistory.undo.push( $.extend( data, { timestamp: Date.now() } ) );
				_changesHistory.redo = [];

				self.trigger( 'historyChanged' );
			};

			// Save data with and without interval
			if ( !! useThrottle ) {
				self.__saveDataToHistory( saveDataToHistory );
			} else {
				saveDataToHistory();
			}
		},

		/**
		 * Commit to save data to history
		 * Note: This method is for store arbitrary data and restore via a callback function
		 *
		 * @param {*} data The commit data
		 * @param {Function} callback The restore callback function
		 * @param {Boolean} useThrottle Using the interval when save data
		 */
		commitData: function( customData, callback, useThrottle ) {
			const self = this;
			if (
				$ush.isUndefined( customData )
				|| typeof callback !== 'function'
			) {
				return;
			}

			// Save change data in history
			const saveDataToHistory = () => {
				var data = {
					action: ACTION_CONTENT.CALLBACK,
					callback: callback,
					data: customData
				};

				// Get the last history data by action
				var lastData = self.getLastHistoryDataByAction( ACTION_CONTENT.CALLBACK );

				// Check for duplicate objects
				if (
					! $.isEmptyObject( lastData )
					&& $ush.comparePlainObject(
						$usbcore.clearPlainObject( lastData, [ 'callback', 'timestamp' ] ),
						$usbcore.clearPlainObject( data, 'callback' )
					)
				) {
					return;
				}

				// If the maximum limit is exceeded, then we will delete the old data
				if ( self.getLengthUndo() >= $ush.parseInt( $usb.config( 'maxDataHistory', 100 ) ) ) {
					_changesHistory.undo = _changesHistory.undo.slice( 1 );
				}

				// Save data in `undo` and destroy `redo`
				_changesHistory.undo.push( $.extend( data, { timestamp: Date.now() } ) );
				_changesHistory.redo = [];

				self.trigger( 'historyChanged' );
			};

			// Save data with and without interval
			if ( !! useThrottle ) {
				self.__saveDataToHistory( saveDataToHistory );
			} else {
				saveDataToHistory();
			}
		},

		/**
		 * Create a recovery task
		 *
		 * @param {Number} type Task type, the value can be or greater or less than zero
		 */
		_createRecoveryTask: function( type ) {
			const self = this;
			// Check the correctness of the task type
			if ( ! type || ! [ HISTORY_TYPE.UNDO, HISTORY_TYPE.REDO ].includes( type ) ) {
				return;
			}

			var task, // Found recovery task
				lengthUndo = self.getLengthUndo(),
				lengthRedo = self.getLengthRedo();

			// Get data from `undo`
			if ( type === HISTORY_TYPE.UNDO && lengthUndo ) {
				task = _changesHistory.undo[ --lengthUndo ];
				_changesHistory.undo = _changesHistory.undo.slice( 0, lengthUndo );
			}
			// Get data from `redo`
			if ( type === HISTORY_TYPE.REDO && lengthRedo ) {
				task = _changesHistory.redo[ --lengthRedo ];
				_changesHistory.redo = _changesHistory.redo.slice( 0, lengthRedo );
			}

			// Add a recovery task to the queue
			if ( ! $.isEmptyObject( task ) ) {
				_changesHistory.tasks.push( $ush.clone( task, { type: type } ) );
				self.trigger( 'historyChanged' );
				self.__startRecoveryTasks.call( self ); // apply all recovery tasks
			}
		},

		/**
		 * Start all recovery tasks
		 * Note: The code is moved to a separate function since `debounced` must be initialized before call
		 *
		 * @param {Function} fn The function to be executed
		 * @type debounced
		 */
		__startRecoveryTasks: $ush.debounce( function() {
			const self = this;
			if ( self.isActiveRecoveryTask() ) {
				return;
			}
			_$tmp.isActiveRecoveryTask = true;
			self._recoveryTaskManager();
		}, 100 ),

		/**
		 * Recovery Task Manager
		 * Note: Manage and apply tasks from a shared queue for data recovery
		 */
		_recoveryTaskManager: function() {
			const self = this;

			var lengthTasks = self.getLengthTasks(),
				task = _changesHistory.tasks[ --lengthTasks ]; // get last task

			// Check the availability of the task
			if ( $.isEmptyObject( task ) ) {
				_$tmp.isActiveRecoveryTask = false;
				self.trigger( 'historyChanged' );
				return;
			}

			// Remove the task from the general list
			_changesHistory.tasks = _changesHistory.tasks.slice( 0, lengthTasks );

			/**
			 * Apply changes from task
			 * Note: Timeout will allow to collect data and update the task before recovery
			 */
			$ush.timeout( self._applyChangesFromTask.bind( self, $ush.clone( task ), /* originalTask */task ), 1 );

			// Reverse actions Create/Remove in a task
			switch( task.action ) {
				case ACTION_CONTENT.CREATE:
					task.action = ACTION_CONTENT.REMOVE;
					break;
				case ACTION_CONTENT.REMOVE:
					task.action = ACTION_CONTENT.CREATE;
					break;
			}

			// Get and save the preview of an element
			if ( [ ACTION_CONTENT.UPDATE, ACTION_CONTENT.REMOVE ].includes( task.action ) ) {
				task.content = $usb.builder.getElmShortcode( task.id );
				task.preview = $usb.builder.getElmOuterHtml( task.id );
			}

			// Position updates on movements
			if ( [ ACTION_CONTENT.MOVE, ACTION_CONTENT.REMOVE ].includes( task.action ) ) {
				task.index = $usb.builder.getElmIndex( task.id );
				task.parentId = $usb.builder.getElmParentId( task.id );
			}

			// Move the task in the reverse direction.
			var type = task.type;
			delete task.type;
			if ( type === HISTORY_TYPE.UNDO ) {
				_changesHistory.redo.push( task );
			} else {
				_changesHistory.undo.push( task );
			}
		},

		/**
		 * Apply changes from task
		 *
		 * @param {{}} task Cloned version of the task
		 * @param {{}} originalTask Task object from history
		 */
		_applyChangesFromTask: function( task, originalTask ) {
			const self = this;
			if ( $.isEmptyObject( task ) ) {
				_$tmp.isActiveRecoveryTask = false;
				return;
			}
			// Сheck the validation of the task
			if ( ! task.action ) {
				$usb.log( 'Error: Invalid change action:', task );
				return;
			}

			// Data recovery depend on the applied action
			if ( task.action === ACTION_CONTENT.CREATE ) {
				$usb.builder.removeElm( task.id );

				// Move the element to a new position
			} else if ( task.action === ACTION_CONTENT.MOVE ) {
				$usb.builder.moveElm( task.id, task.parentId, task.index );

				// Create the element
			} else if ( task.action === ACTION_CONTENT.REMOVE ) {
				// Added shortcode to content
				if ( ! $usb.builder.insertShortcodeIntoContent( task.parentId, task.index, task.content ) ) {
					return false;
				}
				// Get insert position
				var insert = $usb.builder.getInsertPosition( task.parentId, task.index );
				// Add new shortcde to preview page
				$usb.postMessage( 'insertElm', [ insert.parent, insert.position, '' + task.preview ] );
				$usb.postMessage( 'maybeInitElmJS', [ task.id ] ); // init its JS if needed

				// Update element from task
			} else if ( task.action === ACTION_CONTENT.UPDATE ) {
				// Shortcode updates
				$usb.builder.pageData.content = ( '' + $usb.builder.pageData.content )
					.replace( $usb.builder.getElmShortcode( task.id ), task.content );
				// Refresh shortcode preview
				$usb.postMessage( 'updateSelectedElm', [ task.id, '' + task.preview ] );

				// Refresh data in edit active fieldset
				const id = ( task.extData || {} ).originalId || task.id;
				if ( id === $usb.builder.selectedElmId && $usb.builderPanel.activeElmFieldset instanceof $usof.Form ) {
					$usb.builderPanel.activeElmFieldset.setValues( $usb.builder.getElmValues( $usb.builder.selectedElmId ), /* quiet mode */true );
				}

				// Pass the committed data to a custom handle
			} else if ( task.action === ACTION_CONTENT.CALLBACK ) {
				// If there is a handler, then call it and pass the captured data
				if ( typeof task.callback === 'function' ) {
					task.callback.call( self, $ush.clone( task ).data, originalTask );
				}

			} else {
				$usb.log( 'Error: Unknown recovery action:', action );
				return;
			}

			// Trigger the content change event
			if ( [ ACTION_CONTENT.UPDATE, ACTION_CONTENT.REMOVE ].includes( task.action ) ) {
				$usb.trigger( 'builder.contentChange' );
			}

			self.trigger( 'historyChanged' );
			$usb.trigger( 'history.changed', task );

			// Note: The timeout helps prevent recovery bugs during browser loading.
			$ush.timeout( self._recoveryTaskManager.bind( self ), 0 );
		}
	} );

	// Export API
	$usb.history = new History;

} ( jQuery );
