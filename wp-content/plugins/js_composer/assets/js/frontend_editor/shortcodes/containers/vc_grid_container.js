/**
 * Grid container Shortcode View
 * This view is responsible for managing the grid container shortcode in the WPBakery frontend editor.
 * It extends the InlineShortcodeViewContainer class and overrides methods to handle grid items dynamically.
 */

( function ( $ ) {
	'use strict';
	var vc = window.vc || {};

	window.InlineShortcodeView_vc_grid_container = window.InlineShortcodeViewContainer.extend({
		item_tag: 'vc_grid_container_item',
		builder: false,
		shortcodeCache: {},
		/**
		 * Initializes the grid container view.
		 * Binds the necessary events and sets up the view.
		 * @param params
		 */
		initialize: function ( params ) {
			_.bindAll( this, 'addElement', 'addItem', 'calculateGridParams' );
			window.InlineShortcodeView_vc_grid_container.__super__.initialize.call( this, params );
			vc.events.on( 'editElementPanel:saved', this.calculateGridParams );
			vc.events.on( 'shortcodes:paste', this.calculateGridParams );
			vc.events.on( 'shortcodes:destroy', this.calculateGridParams );
		},
		/**
		 * Overrides the default method, to remove the default controls.
		 * Controls will come from the grid item controls' template.
		 *
		 * @return {Window.InlineShortcodeView_vc_grid_container}
		 */
		addControls: function () {
			this.$controls = $( '<div class="no-controls"></div>' );
			this.$controls.appendTo( this.$el );

			return this;
		},
		beforeUpdate: function ( model ) {
			this.handleGridItems( model );
		},
		/**
		 * Handles the number of grid items based on the model's parameters (rows * columns).
		 * The method gets called from the parent InlineShortcodeView, on change:params event.
		 *
		 * @param {vc.shortcode} model - The model representing the grid container.
		 */
		handleGridItems: function ( model ) {
			if ( !model ) {
				return;
			}
			var modelId = model.get( 'id' );
			var params = model.get( 'params' );
			var rows = params.rows || 1;
			var columns = params.columns || 1;
			var itemsLength = rows * columns;
			var gridItems = this.shortcodeCache[modelId];
			if ( !gridItems ) {
				gridItems = vc.shortcodes.where({ parent_id: modelId });
				this.shortcodeCache[modelId] = gridItems;
			}
			if ( !this.builder ) {
				this.builder = new vc.ShortcodesBuilder();
			}

			if ( gridItems.length < itemsLength ) {
				// Add missing grid items
				for ( var i = gridItems.length; i < itemsLength; i++ ) {
					this.builder.create({
						shortcode: this.item_tag,
						parent_id: modelId,
						order: vc.shortcodes.nextOrder(),
						params: {}
					});
				}
				this.builder.render();
				this.shortcodeCache[modelId] = vc.shortcodes.where({ parent_id: modelId });
			} else if ( gridItems.length > itemsLength ) {
				// Remove extra grid items (from the end)
				var itemsToRemove = gridItems.slice( itemsLength );
				_.each( itemsToRemove, function ( item ) {
					item.destroy();
				});
				this.shortcodeCache[modelId] = vc.shortcodes.where({ parent_id: modelId });
			}
		},
		/**
		 * Adds a new grid item to the container by calling the addItem.
		 * This method is called when the user clicks the "Add new Grid Item" button in the Grid container controls.
		 * This method gets called from the InlineShortcodeViewContainerWithParent view addSibling method.
		 *
		 * @param {Event} e - The event object.
		 */
		addElement: function ( e ) {
			if ( e && e.preventDefault ) {
				e.preventDefault();
			}
			this.addItem();
		},
		/**
		 * Adds a new grid item to the container.
		 * It creates a new grid item shortcode and renders it.
		 */
		addItem: function () {
			vc.builder.create({
				shortcode: this.item_tag,
				parent_id: this.model.get( 'id' )
			}).render();
		},
		/**
		 * Calculates the grid parameters based on the current grid items.
		 * This method is called when a new grid item is added, removed, or when the shortcode is pasted.
		 * It updates the number of rows based on the current grid items and columns
		 * @param {object} model
		 */
		calculateGridParams: function ( model ) {
			var shortcodeTag = model.get( 'shortcode' );
			if ( shortcodeTag === this.item_tag ) {
				var params = this.model.get( 'params' ) || {};
				var modelId = this.model.get( 'id' );
				var gridItems = vc.shortcodes.where({ parent_id: modelId });
				var cols = this.model.getParam( 'columns' ) || 1;

				// Always set the rows to the model, each time need to re-calculate
				// the number of rows based on the current grid items and columns.
				var newRows = Math.ceil( gridItems.length / cols ).toString();
				params.rows = newRows;
				this.model.save({ params: params }, { silent: true });
				this.model.set( 'rows', newRows );

				// Remove cached edit element panel for this model
				// This is to ensure that the edit element panel is rebuilt with the new parameters.
				if ( vc.EditElementPanelCache && vc.EditElementPanelCache[modelId]) {
					delete vc.EditElementPanelCache[modelId];
				}

				// Re-render the edit element block view if it is currently active,
				// to reflect the changes in the grid container.
				if ( vc.active_panel.model && vc.active_panel.model.get( 'id' ) === this.model.get( 'id' ) ) {
					vc.edit_element_block_view.render( this.model );
				}
			}
		}
	});

})( window.jQuery );
