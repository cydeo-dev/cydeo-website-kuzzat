/**
 * We use this cache in editor to keep edit element panel ajax request data.
 */

( function () {
	'use strict';

	window.vc.HelperEditorElementsAjaxCache = {
		setEditPanelEditorElementAjaxCache: function ( modelId, data ) {
			if ( !window.vc.EditElementEditorAjaxCache ) {
				window.vc.EditElementEditorAjaxCache = {};
			}

			window.vc.EditElementEditorAjaxCache[modelId] = data;
		},
		removeEditPanelEditorElementAjaxCache: function ( modelId ) {
			if ( window.vc.EditElementEditorAjaxCache && window.vc.EditElementEditorAjaxCache[modelId]) {
				delete window.vc.EditElementEditorAjaxCache[modelId];
			}
		},
		isEditPanelEditorElementAjaxCached: function ( modelId ) {
			return window.vc.EditElementEditorAjaxCache && window.vc.EditElementEditorAjaxCache[modelId];
		},
		// check it isEditPanelEditorElementAjaxCached before using
		getEditPanelEditorElementAjaxCache: function ( modelId ) {
			return window.vc.EditElementEditorAjaxCache[modelId];
		}
	};
})();
