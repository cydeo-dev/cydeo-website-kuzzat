/**
 * Add Element panel view for the frontend editor.
 * Extends the backend editors Add Element panel view.
 */

/* global vc, i18nLocale */
( function ( $ ) {
	'use strict';

	window.vc.AddElementUIPanelFrontendEditor = vc.AddElementUIPanelBackendEditor
		.vcExtendUI( vc.HelperPanelViewHeaderFooter )
		.extend({
			events: {
				'click [data-vc-ui-element="button-close"]': 'hide',
				'touchstart [data-vc-ui-element="button-close"]': 'hide',
				'keyup #vc_elements_name_filter': 'handleFiltering',
				'search #vc_elements_name_filter': 'handleFiltering',
				'cut #vc_elements_name_filter': 'handleFiltering',
				'paste #vc_elements_name_filter': 'handleFiltering',
				'click .vc_shortcode-link': 'createElement',
				'mouseenter .vc_shortcode-link': 'cacheElement',
				'click [data-vc-ui-element="panel-tab-control"]': 'changeTab'
			},
			/**
			 * Handler functions for different element tags.
			 * Each handler is responsible for creating the appropriate structure.
			 */
			elementHandlers: {
				/**
				 * Handles creation of a vc_section element.
				 */
				vc_section: function ( view, tag, preset, presetType ) {
					var options = view.buildOptions( tag, null, null, preset, presetType, tag );
					view.builder.create( options );
					view.model = view.builder.last();
				},
				/**
				 * Handles creation of a vc_grid_container element.
				 */
				vc_grid_container: function ( view, tag, preset, presetType, parentId, order ) {
					var options = view.buildOptions( 'vc_grid_container', null, parentId, preset, presetType, tag, order );
					view.createGridContainer( options );
				},
				/**
				 * Handles creation of a vc_flexbox_container element.
				 */
				vc_flexbox_container: function ( view, tag, preset, presetType, parentId, order ) {
					var options = view.buildOptions( 'vc_flexbox_container', null, parentId, preset, presetType, tag, order );
					view.createFlexboxContainer( options );
				},
				/**
				 * Handles creation of a vc_row or vc_row_inner element depending on context.
				 */
				vc_row: function ( view, tag, preset, presetType, parentId, order ) {
					if ( parentId && view.model.get( 'shortcode' ) !== 'vc_section' ) {
						// Add row_inner
						view.createRowOrInner( 'vc_row_inner', {}, { width: '1/1' }, parentId, order );
					} else {
						view.createRowOrInner( 'vc_row', {}, { width: '1/1' }, parentId, order );
					}
				},
				/**
				 * Default handler for generic elements.
				 */
				default: function ( view, tag, preset, presetType, parentId, order ) {
					if ( ! parentId ) {
						view.createRowWithColumnAndElement( tag, preset, presetType );
					} else {
						var options = view.buildOptions( tag, null, parentId, preset, presetType, tag, order, true );
						view.builder.create( options );
						view.model = view.builder.last();
					}
				}
			},
			/**
			 * Builds options object for element creation.
			 * @param {string} shortcode - The shortcode name.
			 * @param {Object} [params] - Parameters for the shortcode.
			 * @param {string|number} [parentId] - Parent element ID.
			 * @param {string} [preset] - Preset value.
			 * @param {string} [presetType] - Preset type.
			 * @param {string} tag - Tag name.
			 * @param {number} [order] - Order index.
			 * @param {boolean} [isAddElement] - Flag for add element.
			 * @returns {Object} Options object.
			 */
			buildOptions: function ( shortcode, params, parentId, preset, presetType, tag, order, isAddElement ) {
				var options = { shortcode: shortcode };
				if ( params ) {
					options.params = params;
				}
				if ( parentId ) {
					options.parent_id = parentId;
				}
				if ( typeof order !== 'undefined' ) {
					options.order = order;
				}
				if ( preset && presetType === tag ) {
					options.preset = preset;
				}
				if ( isAddElement ) {
					options.is_add_element = true;
				}
				return options;
			},
			/**
			 * Creates a row with a column and (optionally) an element inside.
			 * @param {string} tag - Tag name for the element.
			 * @param {string} preset - Preset value.
			 * @param {string} presetType - Preset type.
			 */
			createRowWithColumnAndElement: function ( tag, preset, presetType ) {
				var rowOptions = this.buildOptions( 'vc_row', {}, null, preset, presetType, 'vc_row' );
				this.builder.create( rowOptions );

				var columnOptions = this.buildOptions( 'vc_column', { width: '1/1' }, this.builder.lastID(), preset, presetType, 'vc_column' );
				this.builder.create( columnOptions );

				if ( tag !== 'vc_row' ) {
					var elementOptions = this.buildOptions( tag, null, this.builder.lastID(), preset, presetType, tag, undefined, true );
					this.builder.create( elementOptions );
				}
				this.model = this.builder.last();
			},

			/**
			 * Creates a row or row_inner with a column, depending on the tag.
			 * @param {string} tag - 'vc_row' or 'vc_row_inner'.
			 * @param {Object} rowParams - Parameters for the row.
			 * @param {Object} columnParams - Parameters for the column.
			 * @param {string|number} parentId - Parent element ID.
			 * @param {number} order - Order index.
			 */
			createRowOrInner: function ( tag, rowParams, columnParams, parentId, order ) {
				if ( tag === 'vc_row' ) {
					this.builder
						.create( this.buildOptions( 'vc_row', rowParams, parentId, null, null, 'vc_row', order ) )
						.create( this.buildOptions( 'vc_column', columnParams, this.builder.lastID(), null, null, 'vc_column' ) );
				} else {
					this.builder
						.create( this.buildOptions( 'vc_row_inner', {}, parentId, null, null, 'vc_row_inner', order ) )
						.create( this.buildOptions( 'vc_column_inner', { width: '1/1' }, this.builder.lastID(), null, null, 'vc_column_inner' ) );
				}
				this.model = this.builder.last();
			},

			/**
			 * Main createElement method using handler mapping for clarity and maintainability.
			 * @param {Event} e - The event object.
			 */
			createElement: function ( e ) {
				e && e.preventDefault && e.preventDefault();

				var $control = $( e.currentTarget );
				var tag = $control.data( 'tag' );
				var closestPreset = $control.closest( '[data-preset]' );
				var preset = closestPreset ? closestPreset.data( 'preset' ) : undefined;
				var presetType = closestPreset ? closestPreset.data( 'element' ) : undefined;
				var order = this.prepend ? this.getFirstPositionIndex() : vc.shortcodes.nextOrder();
				var parentId = this.model ? this.model.id : null;

				if ( this.prepend ) {
					window.vc.activity = 'prepend';
				}

				var handler = this.elementHandlers[tag] || this.elementHandlers.default;
				handler( this, tag, preset, presetType, parentId, order );

				// Handle default content
				var mapped = vc.getMapped( tag );
				if ( _.isString( mapped.default_content ) && mapped.default_content.length ) {
					var newData = this.builder.parse({}, mapped.default_content, this.builder.last().toJSON() );
					_.each( newData, function ( object ) {
						object.default_content = true;
						this.builder.create( object );
					}, this );
				}

				if ( ! this.model ) {
					this.model = this.builder.last();
				}
				window.vc.latestAddedElement = this.model;

				var showSettings = !( _.isBoolean( mapped.show_settings_on_create ) && mapped.show_settings_on_create === false );
				this.hide();

				if ( showSettings ) {
					// showEditForm call window.vc.edit_element_block_view.render( this.model );
					// window.vc.edit_element_block_view is set equal to EditElementUIPanel() in editors/frontend_editor/build.js
					// EditElementUIPanel is located in panels/views/edit-element/view.js
					// EditElementUIPanel is set equal to EditElementPanelView which is equal to PanelView
					// this.model should be available in the render method of EditElementPanelView
					this.showEditForm();
				}

				// this.builder is equal to vc.ShortcodesBuilder constructor from frontend_editor/shortcodes_builder.js
				this.builder.render( null, this.model );
			},
			createGridContainer: function ( options ) {
				if ( !options ) {
					options = {
						shortcode: 'vc_grid_container'
					};
				}

				this.builder.create( options );
				var containerModel = this.builder.last();
				var rows = parseInt( containerModel.getParam( 'rows' ) ) || 1;
				var columns = parseInt( containerModel.getParam( 'columns' ) ) || 1;
				var items = rows * columns;

				for ( var i = 0; i < items; i++ ) {
					var itemOptions = {
						shortcode: 'vc_grid_container_item',
						parent_id: containerModel.get( 'id' )
					};
					this.builder.create( itemOptions );
				}

				this.model = this.builder.last();
			},
			createFlexboxContainer: function ( options ) {
				if ( !options ) {
					options = {
						shortcode: 'vc_flexbox_container'
					};
				}

				this.builder.create( options );
				var containerModel = this.builder.last();

				var itemOptions = {
					shortcode: 'vc_flexbox_container_item',
					parent_id: containerModel.get( 'id' )
				};
				this.builder.create( itemOptions );

				this.model = this.builder.last();
			}
		});
})( window.jQuery );

