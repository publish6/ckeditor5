/* eslint-disable no-alert */
/**
 * Author: Alex Campbell
 * Date: 2020-07-03
 * A base class that defines logic for all plugins that consist solely of a toolbar button that, when clicked, calls a user-defined
 * callback. Extend this class for any plugin that must appear in a CKEditor toolbar, but doesn't rely on modifying the editor's
 * contents in any way. A good example of this is the "classify" plugin: a button that needs to sit in the editor, but when clicked,
 * doesn't modify its actual contents
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import AssetHelper from '../asset-plugins/asset-plugin-helper';

export class GenericPlugin extends Plugin {
	constructor( editor, pluginName, displayLabel, svgIcon ) {
		super( editor );
		this.pluginName = pluginName;
		this.displayLabel = displayLabel;
		this.svgIcon = svgIcon;
	}

	getToolbarButtonCallbackFromConfig( config, pluginName ) {
		// Ensure that callbacks are defined for adding, editing, and previewing
		const editorConfig = config.get( pluginName );
		let toolbarButtonCallback = AssetHelper.getNested( editorConfig, 'toolbarButtonCallback' );
		if ( toolbarButtonCallback == null ) {
			console.error( 'editor.config.' + pluginName + '.toolbarButtonCallback is not configured properly!' );
			toolbarButtonCallback = () => {
				alert( 'No toolbarButtonCallback function was defined!' );
			};
		}
		return toolbarButtonCallback;
	}

	init() {
		const editor = this.editor;
		this.toolbarButtonCallback = this.getToolbarButtonCallbackFromConfig( editor.config, this.pluginName );

		// Define the plugin
		editor.ui.componentFactory.add( this.pluginName, locale => {
			const view = new ButtonView( locale );

			// Binds to the read only property of the editor so that it dynamically enables/disables itself
			view.bind( 'isEnabled' ).to( editor, 'isReadOnly', isReadOnly => !isReadOnly );

			// Create the button using the plugin label and the plugin icon
			const settings = {
				label: this.displayLabel,
				tooltip: true
			};

			if ( this.svgIcon != null ) {
				settings.icon = this.svgIcon;
			} else {
				settings.withText = true;
			}
			view.set( settings );

			// Executed when the icon is clicked on
			view.on( 'execute', () => {
				this.toolbarButtonCallback();
			} );

			return view;
		} );
	}
}
