/**
 * Add Element panel view for the backend editor.
 * Extends PanelView to provide functionality for adding elements in the Visual Composer backend editor.
 */

/* global vc, i18nLocale */
( function ( $ ) {
	'use strict';

	window.vc.element_start_index = 0;

	window.vc.AddElementUIPanelBackendEditor = vc.PanelView
		.vcExtendUI( vc.HelperAjax )
		.vcExtendUI( vc.HelperPanelViewHeaderFooter )
		.vcExtendUI( vc.HelperPanelTabs )
		.vcExtendUI( vc.HelperAddElementEditPanelAjaxCache )
		.extend({
			el: '#vc_ui-panel-add-element',
			searchSelector: '#vc_elements_name_filter',
			prepend: false,
			builder: '',
			events: {
				'click [data-vc-ui-element="button-close"]': 'hide',
				'touchstart [data-vc-ui-element="button-close"]': 'hide',
				'click .vc_shortcode-link': 'createElement',
				'mouseenter .vc_shortcode-link': 'cacheElement',
				'keyup #vc_elements_name_filter': 'handleFiltering',
				'search #vc_elements_name_filter': 'handleFiltering',
				'cut #vc_elements_name_filter': 'handleFiltering',
				'paste #vc_elements_name_filter': 'handleFiltering',
				'click [data-vc-manage-elements]': 'openPresetWindow',
				'click [data-vc-ui-element="panel-tab-control"]': 'changeTab'
			},
			changeTab: function ( e ) {
				if ( e && e.preventDefault ) {
					e.preventDefault();
				}
				var tab = $( e.currentTarget );
				if ( !tab.parent().hasClass( 'vc_active' ) ) {
					this.switchActiveTab( this.$el, tab );
					this.trigger( 'tabChange' );

					if ( this.$tabsMenu ) {
						this.$tabsMenu.vcTabsLine( 'checkDropdownContainerActive' );
					}
				}

				this.handleFiltering( e );
			},
			isOnTeasersTab: function () {
				return this.$el.find( '.vc_active [data-filter=".wpb-teaser-item"]' ).length > 0;
			},
			toggleTeasersVisibility: function ( showTeasers ) {
				$( '.wpb-content-layouts-container' ).toggle( !showTeasers );
				$( '.wpb-teasers-wrapper' ).toggle( showTeasers );
			},
			searchInTeasers: function ( searchTerm ) {
				var $teasersWrapper = $( '.wpb-teasers-wrapper' );
				var $noResultsMessage = this.$el.find( '.vc-panel-no-results-message' );

				if ( !searchTerm ) {
					$( '.wpb-teaser-item' ).show();
					$teasersWrapper.find( '.wpb-teasers-description, .wpb-teasers-grid' ).show();
					$noResultsMessage.hide();
					return;
				}

				var $visibleItems = $( '.wpb-teaser-item:containsi("' + searchTerm + '")' );
				$( '.wpb-teaser-item' ).hide();
				$visibleItems.show();

				var hasResults = $visibleItems.length > 0;
				$teasersWrapper.find( '.wpb-teasers-description, .wpb-teasers-grid' ).toggle( hasResults );
				$noResultsMessage.text( window.i18nLocale.no_addons_found ).toggle( !hasResults );
			},
			initialize: function () {
				window.vc.AddElementUIPanelBackendEditor.__super__.initialize.call( this );
				window.vc.events.on( 'vc:savePreset', this.updateAddElementPopUp.bind( this ) );
				window.vc.events.on( 'vc:deletePreset', this.removePresetFromAddElementPopUp.bind( this ) );
			},
			render: function ( model, prepend ) {
				if ( !_.isUndefined( vc.ShortcodesBuilder ) ) {
					this.builder = new vc.ShortcodesBuilder();
				}

				if ( this.$el.is( ':hidden' ) ) {
					window.vc.closeActivePanel();
				}
				window.vc.active_panel = this;
				this.prepend = _.isBoolean( prepend ) ? prepend : false;
				this.place_after_id = _.isString( prepend ) ? prepend : false;
				this.model = _.isObject( model ) ? model : false;
				this.$content = this.$el.find( '[data-vc-ui-element="panel-add-element-list"]' );
				this.$buttons = $( '[data-vc-ui-element="add-element-button"]', this.$content );

				this.buildFiltering();

				this.$el.find( '[data-vc-ui-element="panel-tab-control"]' ).eq( 0 ).click();

				this.show();

				// must be after show()
				this.$el.find( '[data-vc-ui-element="panel-tabs-controls"]' ).vcTabsLine( 'moveTabs' );

				// Hide teasers tab if no teasers available
				var $teasersTab = this.$el.find( '[data-filter=".wpb-teaser-item"]' );
				if ( $teasersTab.length && $( '.wpb-teasers-wrapper .wpb-teaser-item' ).length === 0 ) {
					$teasersTab.parent().hide();
				}

				if ( !vc.is_mobile ) {
					$( this.searchSelector ).trigger( 'focus' );
				}

				return vc.AddElementUIPanelBackendEditor.__super__.render.call( this );
			},
			buildFiltering: function () {
				var itemSelector, tag, notIn, asParent, parentSelector;

				itemSelector = '[data-vc-ui-element="add-element-button"]';
				notIn = this._getNotIn( this.model ? this.model.get( 'shortcode' ) : '' );

				$( this.searchSelector ).val( '' );
				this.$content.addClass( 'vc_filter-all' );
				this.$content.attr( 'data-vc-ui-filter', '*' );

				tag = this.model ? this.model.get( 'shortcode' ) : 'vc_column';
				asParent = tag && !_.isUndefined( vc.getMapped( tag ).as_parent ) ? vc.getMapped( tag ).as_parent : false;

				if ( _.isObject( asParent ) ) {
					parentSelector = [];
					if ( _.isString( asParent.only ) ) {
						parentSelector.push( _.reduce( asParent.only.replace( /\s/, '' ).split( ',' ),
							function ( memo, val ) {
								return memo + ( _.isEmpty( memo ) ? '' : ',' ) + '[data-element="' + val.trim() + '"]';
							},
							'' ) );
					}
					if ( _.isString( asParent.except ) ) {
						parentSelector.push( _.reduce( asParent.except.replace( /\s/, '' ).split( ',' ),
							function ( memo, val ) {
								return memo + ':not([data-element="' + val.trim() + '"])';
							},
							'' ) );
					}
					itemSelector += parentSelector.join( ',' );
				} else if ( notIn ) {
					itemSelector = notIn;
				}

				if ( false !== tag && !_.isUndefined( vc.getMapped( tag ).allowed_container_element ) ) {
					if ( false === vc.getMapped( tag ).allowed_container_element ) {
						itemSelector += ':not([data-is-container=true])';
					} else if ( _.isString( vc.getMapped( tag ).allowed_container_element ) ) {
						itemSelector += ':not([data-is-container=true]), [data-element=' + vc.getMapped( tag ).allowed_container_element + ']';
					}
				}

				this.$buttons.removeClass( 'vc_visible' ).addClass( 'vc_inappropriate' );
				$( itemSelector, this.$content ).removeClass( 'vc_inappropriate' ).addClass( 'vc_visible' );

				this.hideEmptyFilters();
			},
			hideEmptyFilters: function () {
				var _this = this;

				this.$el.find( '[data-vc-ui-element="panel-add-element-tab"].vc_active' ).removeClass( 'vc_active' );
				this.$el.find( '[data-vc-ui-element="panel-add-element-tab"]:first' ).addClass( 'vc_active' );
				this.$el.find( '[data-filter]' ).each( function () {
					var filter = $( this ).data( 'filter' );

					if ( '.wpb-teaser-item' === filter ) {
						$( this ).parent().toggle( $( '.wpb-teasers-wrapper .wpb-teaser-item' ).length > 0 );
						return;
					}

					if ( !$( filter + '.vc_visible:not(.vc_inappropriate)',
						_this.$content ).length ) {
						$( this ).parent().hide();
					} else {
						$( this ).parent().show();
					}
				});
			},
			_getNotIn: _.memoize( function ( tag ) {
				var selector;

				selector = _.reduce( vc.map, function ( memo, shortcode ) {
					var separator;

					separator = _.isEmpty( memo ) ? '' : ',';

					if ( _.isObject( shortcode.as_child ) ) {
						if ( _.isString( shortcode.as_child.only ) ) {
							if ( !_.contains( shortcode.as_child.only.replace( /\s/, '' ).split( ',' ), tag ) ) {
								memo += separator + '[data-element=' + shortcode.base + ']';
							}
						}
						if ( _.isString( shortcode.as_child.except ) ) {
							if ( _.contains( shortcode.as_child.except.replace( /\s/, '' ).split( ',' ), tag ) ) {
								memo += separator + '[data-element=' + shortcode.base + ']';
							}
						}
					} else if ( false === shortcode.as_child ) {
						memo += separator + '[data-element=' + shortcode.base + ']';
					}

					return memo;
				}, '' );

				return '[data-vc-ui-element="add-element-button"]:not(' + selector + ')';
			}),
			handleFiltering: function ( e ) {
				if ( 'cut' == e.type || 'paste' === e.type ) {
					setTimeout( function () {
						this.filterElements ( e );
					}.bind( this ), 0 );
				} else {
					if ( e ) {
						if ( e.preventDefault ) {
							e.preventDefault();
						}
						if ( e.stopPropagation ) {
							e.stopPropagation();
						}
					} else {
						e = window.event;
					}
					this.filterElements( e );
				}
			},
			filterElements: function ( e ) {
				var filterValue, $visibleElements, $control, filter, nameFilter;

				$control = $( e.currentTarget );
				filter = '[data-vc-ui-element="add-element-button"]';
				nameFilter = $( this.searchSelector ).val();

				this.$content.removeClass( 'vc_filter-all' );
				var $parent = $control.closest( '.vc_ui-tabs-line' );
				var $noResultsMessage = $( '.vc-panel-no-results-message' );

				$parent.parent().find( '[data-vc-ui-element="panel-add-element-tab"].vc_active' ).removeClass( 'vc_active' );

				if ( $control.is( '[data-filter]' ) ) {
					$control.parent().addClass( 'vc_active' );

					filterValue = $control.data( 'filter' );

					// Handle teaser elements tab
					if ( '.wpb-teaser-item' === filterValue ) {
						this.toggleTeasersVisibility( true );
						$( this.searchSelector ).val( '' );
						this.searchInTeasers( '' );
						return;
					} else {
						this.toggleTeasersVisibility( false );
					}

					filter += filterValue;

					if ( '*' === filterValue ) {
						this.$content.addClass( 'vc_filter-all' );
					} else {
						this.$content.removeClass( 'vc_filter-all' );
					}

					this.$content.attr( 'data-vc-ui-filter', filterValue.replace( '.js-category-', '' ) );

					$( this.searchSelector ).val( '' );
				} else if ( nameFilter.length ) {
					// Check if we're on the teasers tab
					if ( this.isOnTeasersTab() ) {
						this.toggleTeasersVisibility( true );
						this.searchInTeasers( nameFilter );
						return;
					} else {
						// When searching in other tabs, show main content and hide teasers
						$( '.wpb-content-layouts-container' ).show();
						$( '.wpb-teasers-wrapper' ).hide();

						filter += ':containsi("' + nameFilter + '"):not(".vc_element-deprecated")';

						this.$content.attr( 'data-vc-ui-filter', 'name:' + nameFilter );
					}
				} else if ( !nameFilter.length ) {
					// When clearing search, restore the view based on active tab
					if ( this.isOnTeasersTab() ) {
						this.toggleTeasersVisibility( true );
						this.searchInTeasers( '' );
						return;
					} else {
						this.toggleTeasersVisibility( false );
					}

					$( '[data-vc-ui-element="panel-tab-control"][data-filter="*"]' ).parent().addClass( 'vc_active' );

					this.$content
						.attr( 'data-vc-ui-filter', '*' )
						.addClass( 'vc_filter-all' );
				}

				$( '.vc_visible', this.$content ).removeClass( 'vc_visible' );
				$( filter, this.$content ).addClass( 'vc_visible' );

				// if user has pressed enter into search box and only one item is visible, simulate click
				if ( nameFilter.length ) {
					if ( 13 === ( e.keyCode || e.which ) ) {
						$visibleElements = $( '.vc_visible:not(.vc_inappropriate)', this.$content );
						if ( 1 === $visibleElements.length ) {
							$visibleElements.find( '[data-vc-clickable]' ).click();
						}
					}
				}

				// Hide section title in case there are no filtered elements in a section
				var anyVisible = false;

				this.$content.find( '.wpb-content-layouts' ).each( function () {
					var $section = $( this );
					var hasVisibleItems = $section.find( '.vc_visible' ).length > 0;

					if ( !hasVisibleItems ) {
						$section.closest( '.vc_clearfix' ).hide();
					} else {
						$section.closest( '.vc_clearfix' ).show();
						anyVisible = true;
					}
				});

				// Show error message if there are no elements in any section
				if ( !anyVisible && !this.isOnTeasersTab() ) {
					$noResultsMessage.text( window.i18nLocale.no_elements_found ).show();
				} else if ( !this.isOnTeasersTab() ) {
					$noResultsMessage.hide();
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
			 * @param {string|number} [rootId] - Root element ID.
			 * @param {boolean} [isAddElement] - Flag for add element.
			 * @returns {Object} Options object.
			 */
			buildOptions: function ( shortcode, params, parentId, preset, presetType, tag, order, rootId, isAddElement ) {
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
				if ( rootId ) {
					options.root_id = rootId;
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
			 * Handler functions for different element tags.
			 * Each handler is responsible for creating the appropriate structure.
			 */
			elementHandlers: {
				/**
				 * Handles creation of a vc_section element.
				 */
				vc_section: function ( view, tag, preset, presetType ) {
					var options = view.buildOptions( tag, null, null, preset, presetType, tag );
					view.model = vc.shortcodes.create( options );
				},
				/**
				 * Handles creation of a vc_grid_container element.
				 */
				vc_grid_container: function ( view, tag, preset, presetType ) {
					var options = view.buildOptions( 'vc_grid_container', null, null, preset, presetType, tag );
					view.model = vc.shortcodes.create( options );
					var rows = parseInt( view.model.getParam( 'rows' ) ) || 1;
					var columns = parseInt( view.model.getParam( 'columns' ) ) || 1;
					var items = rows * columns;
					for ( var i = 0; i < items; i++ ) {
						var itemOptions = {
							shortcode: 'vc_grid_container_item',
							parent_id: view.model.get( 'id' )
						};
						if ( preset && 'vc_grid_container_item' === presetType ) {
							itemOptions.preset = preset;
						}
						vc.shortcodes.create( itemOptions );
					}
				},
				/**
				 * Handles creation of a vc_flexbox_container element.
				 */
				vc_flexbox_container: function ( view, tag, preset, presetType, parentId, order, rootId ) {
					var options = view.buildOptions( 'vc_flexbox_container', null, parentId, preset, presetType, tag, order, rootId );
					view.model = view.createFlexboxContainer( options, preset, presetType );
				},
				/**
				 * Handles creation of a vc_row or vc_row_inner element depending on context.
				 */
				vc_row: function ( view, tag, preset, presetType, parentId, order, rootId ) {
					if ( parentId && view.model.get( 'shortcode' ) !== 'vc_section' ) {
						// Add row_inner
						var innerRowOptions = view.buildOptions( 'vc_row_inner', {}, parentId, null, null, 'vc_row_inner', order, rootId );
						var row = vc.shortcodes.create( innerRowOptions );
						var columnOptions = view.buildOptions( 'vc_column_inner', { width: '1/1' }, row.id, null, null, 'vc_column_inner', undefined, row.id );
						vc.shortcodes.create( columnOptions );
						view.model = row;
					} else {
						var rowOptions = view.buildOptions( 'vc_row', {}, parentId, null, null, 'vc_row', order, rootId );
						var row = vc.shortcodes.create( rowOptions );
						var columnOptions = view.buildOptions( 'vc_column', { width: '1/1' }, row.id, null, null, 'vc_column', undefined, row.id );
						vc.shortcodes.create( columnOptions );
						view.model = row;
					}
				},
				/**
				 * Default handler for generic elements.
				 */
				default: function ( view, tag, preset, presetType, parentId, order, rootId ) {
					if ( ! parentId ) {
						// Create row, column, and element
						var rowOptions = view.buildOptions( 'vc_row', {}, null, preset, presetType, 'vc_row' );
						var row = vc.shortcodes.create( rowOptions );
						var columnOptions = view.buildOptions( 'vc_column', { width: '1/1' }, row.id, preset, presetType, 'vc_column', undefined, row.id );
						var column = vc.shortcodes.create( columnOptions );
						var elementOptions = view.buildOptions( tag, null, column.id, preset, presetType, tag, undefined, row.id, true );
						view.model = vc.shortcodes.create( elementOptions );
					} else {
						var options = view.buildOptions( tag, null, parentId, preset, presetType, tag, order, rootId, true );
						view.model = vc.shortcodes.create( options );
					}
				}
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
				var order = this.prepend ? this.getFirstPositionIndex() : vc.shortcodes.getNextOrder();
				var parentId = this.model ? this.model.id : null;
				var rootId = this.model ? this.model.get( 'root_id' ) : null;

				if ( false === this.model ) {
					window.vc.storage.lock();
				}

				var handler = this.elementHandlers[tag] || this.elementHandlers.default;
				handler( this, tag, preset, presetType, parentId, order, rootId );

				this.model && ( window.vc.latestAddedElement = this.model );

				var showSettings = !( _.isBoolean( vc.getMapped( tag ).show_settings_on_create ) && false === vc.getMapped( tag ).show_settings_on_create );
				this.hide();

				if ( showSettings ) {
					this.showEditForm();
				}
			},
			getFirstPositionIndex: function () {
				window.vc.element_start_index -= 1;

				return vc.element_start_index;
			},
			show: function () {
				this.$el.addClass( 'vc_active' );
				this.trigger( 'show' );
			},
			hide: function () {
				this.$el.removeClass( 'vc_active' );
				window.vc.active_panel = false;
				this.trigger( 'hide' );
			},
			showEditForm: function () {
				window.vc.edit_element_block_view.render( this.model, true );
			},
			updateAddElementPopUp: function ( id, shortcode, title, data ) {
				// element pop up box
				var $presetShortcode = this.$el.find( '[data-element="' + shortcode + '"]:first' );
				var $newPreset = $presetShortcode.clone( true );
				window.vc_all_presets[ id ] = data;

				$newPreset.find( '[data-vc-shortcode-name]' ).text( title );
				$newPreset.find( '.vc_element-description' ).text( '' );
				$newPreset.attr( 'data-preset', id );
				$newPreset.addClass( 'js-category-_my_elements_' );
				$newPreset.insertAfter( this.$el.find( '[data-element="' + shortcode + '"]:last' ) );

				this.$el.find( '[data-filter="js-category-_my_elements_"]' ).show();

				// preset settings panel
				var $samplePreset = ( this.$body.find( '[data-vc-ui-element="panel-preset"] [data-vc-presets-list-content] .vc_ui-template:first' ) );
				var $anotherNewPreset = $samplePreset.clone( true );
				$anotherNewPreset.find( '[data-vc-ui-element="template-title"]' ).attr( 'title', title ).text( title );
				$anotherNewPreset.find( '[data-vc-ui-delete="preset-title"]' ).attr( 'data-preset', id ).attr( 'data-preset-parent', shortcode );
				$anotherNewPreset.find( '[data-vc-ui-add-preset]' ).attr( 'data-preset', id ).attr( 'id', shortcode ).attr( 'data-tag', shortcode );
				$anotherNewPreset.show();
				$anotherNewPreset.insertAfter( this.$body.find( '[data-vc-ui-element="panel-preset"] [data-vc-presets-list-content] .vc_ui-template:last' ) );
			},
			removePresetFromAddElementPopUp: function ( id ) {
				this.$el.find( '[data-preset="' + id + '"]' ).remove();
			},
			openPresetWindow: function ( e ) {
				if ( e && e.preventDefault ) {
					e.preventDefault();
				}
				window.vc.preset_panel_view.render().show();
			},
			createFlexboxContainer: function ( options, preset, presetType ) {
				if ( !options ) {
					options = {
						shortcode: 'vc_flexbox_container'
					};
				}
				var flexbox = vc.shortcodes.create( options );

				var itemOptions = {
					shortcode: 'vc_flexbox_container_item',
					parent_id: flexbox.id,
					root_id: flexbox.id
				};
				if ( preset && 'vc_flexbox_container_item' === presetType ) {
					itemOptions.preset = preset;
				}
				vc.shortcodes.create( itemOptions );
				return flexbox;
			}
		});

})( window.jQuery );
