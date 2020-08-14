/**
 * Author: Alex Campbell
 * Date: 2020-07-03
 * A base class that defines logic for all plugins that consist solely of a toolbar button that, when clicked, calls a user-defined callback.
 * Extend this class for any plugin that must appear in a CKEditor toolbar, but doesn't rely on modifying the editor's contents in any way
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import AssetHelper from '../asset-plugins/asset-plugin-helper';

export class GenericPlugin extends Plugin {
    constructor(editor, pluginName, displayLabel, svgIcon) {
        super(editor);
        this.pluginName = pluginName;
        this.displayLabel = displayLabel;
        this.svgIcon = svgIcon;
    }

    getToolbarButtonCallbackFromConfig(config, pluginName) {
        // Ensure that callbacks are defined for adding, editing, and previewing
        const editorConfig = config.get(pluginName);
        let toolbarButtonCallback = AssetHelper.getNested(editorConfig, "toolbarButtonCallback");
        if (toolbarButtonCallback == null) {
            console.error("editor.config."+pluginName+".toolbarButtonCallback is not configured properly! This plugin likely won't work as expecteed!");
            toolbarButtonCallback = () => { alert("No toolbarButtonCallback function was defined!"); }
        } 
        return toolbarButtonCallback;
    }

    init() {
        const editor = this.editor;
        this.toolbarButtonCallback = this.getToolbarButtonCallbackFromConfig(editor.config, this.pluginName);;
        
        // Define the plugin
        editor.ui.componentFactory.add( this.pluginName, locale => {
            const view = new ButtonView( locale );

            // Create the button using the plugin label and the plugin icon
            const settings = {
                label: this.displayLabel,
                tooltip: true
            };

            if (this.svgIcon !=  null) {
                settings['icon'] = this.svgIcon;
            } else {
                settings['withText'] = true;
            }
            view.set( settings );
            console.warn(settings);
        
            // Executed when the icon is clicked on
            view.on( 'execute', () => {
                this.toolbarButtonCallback();
            } );

            return view;
        } );
    }
}