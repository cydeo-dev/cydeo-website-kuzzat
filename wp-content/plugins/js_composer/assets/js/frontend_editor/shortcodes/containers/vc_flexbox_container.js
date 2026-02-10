/**
 * Flexbox container Shortcode View
 * This view is responsible for managing the flexbox container shortcode in the WPBakery frontend editor.
 * It extends the InlineShortcodeViewContainer class and overrides methods to handle grid items dynamically.
 */

( function ( $ ) {
	'use strict';
	var vc = window.vc || {};

	window.InlineShortcodeView_vc_flexbox_container = window.InlineShortcodeViewContainer.extend({
		item_tag: 'vc_flexbox_container_item',
		builder: false,
		shortcodeCache: {},
		/**
		 * Initializes the flexbox container view.
		 * Binds the necessary events and sets up the view.
		 * @param params
		 */
		initialize: function ( params ) {
			_.bindAll( this, 'addElement', 'addItem' );
			window.InlineShortcodeView_vc_flexbox_container.__super__.initialize.call( this, params );
		},
		/**
		 * Overrides the default method, to remove the default controls.
		 * Controls will come from the flexbox item controls' template.
		 *
		 * @return {Window.InlineShortcodeView_vc_flexbox_container}
		 */
		addControls: function () {
			this.$controls = $( '<div class="no-controls"></div>' );
			this.$controls.appendTo( this.$el );

			return this;
		},
		/**
		 * Adds a new flexbox item to the container by calling the addItem.
		 * This method is called when the user clicks the "Add new Flexbox Item" button in the Flexbox container controls.
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
		 * Adds a new flexbox item to the container.
		 * It creates a new flexbox item shortcode and renders it.
		 */
		addItem: function () {
			vc.builder.create({
				shortcode: this.item_tag,
				parent_id: this.model.get( 'id' )
			}).render();
		}
	});

})( window.jQuery );
