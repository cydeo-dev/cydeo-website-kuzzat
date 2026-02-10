/**
 * Grid item Shortcode View
 * This view is responsible for managing the Grid item shortcode in the WPBakery frontend editor.
 * It extends the InlineShortcodeViewContainerWithParent class to handle parent-child relationships.
 */

( function () {
	'use strict';
	window.InlineShortcodeView_vc_grid_container_item = window.InlineShortcodeViewContainerWithParent.extend({
		controls_selector: '#vc_controls-template-vc_container_item',
		destroy: function ( e ) {
			var parentId = this.model.get( 'parent_id' );
			window.InlineShortcodeView_vc_grid_container_item.__super__.destroy.call( this, e );
			if ( !vc.shortcodes.where({ parent_id: parentId }).length ) {
				vc.shortcodes.get( parentId ).destroy();
			}
		}
	});
})();
