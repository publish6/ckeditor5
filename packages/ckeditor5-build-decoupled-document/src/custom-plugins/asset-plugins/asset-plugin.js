/**
 * Author: Alex Campbell
 * Date: 2020-07-03
 * A base class that defines variables and logic that applies to all of the asset plugins (video upload, image upload, etc)
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

/* NOTE: all of these asset names are entirely lowercase. I've found that things don't quite work right (specifically upcasts) 
         if uppercase letters are used (camel case).
*/
export const ASSET_ID_PROPERTY_NAME = "assetid";
export const ASSET_TYPE_PROPERTY_NAME = "assettype";
export const ASSET_SH_RH_CLASS = "asset-sh-rh";
export const ASSET_SH_RS_CLASS = "asset-sh-rs";
export const ASSET_SH_LD_CLASS = "asset-sh-ld";
export const ASSET_SH_EO_CLASS = "asset-sh-eo";

export default class AssetUploadPlugin extends Plugin {
    /**
     * Sets the required variables for all asset plugins
     * @param {string} pluginName the programmatic name for the plugin
     * @param {string} displayLabel the label displayed when the user hovers over the plugin button
     * @param {*} svgIcon the icon of the plugin (in svg format)
     * @param {Function} pluginButtonOnlickFunction a function that will be executed when the plugin is clicked
     * @param {string} assetType the type of asset
     */
    constructor(editor, pluginName, displayLabel, svgIcon, assetType) {
        super(editor);
        this.pluginName = pluginName;
        this.displayLabel = displayLabel;
        this.svgIcon = svgIcon;
        this.assetType = assetType;
    }

    parseAssetPluginConfig() {
        // If the plugin callback wasn't defined, warn the user that this is the case when the plugin is clicked.
        if (this.editor.config.get('asset') == null || this.editor.config.get('asset')[this.pluginName] == null ||
        this.editor.config.get('asset')[this.pluginName]["pluginWasClickedCallback"] == null) {
            this.pluginWasClickedFunction = () => { alert("editor.config.asset."+this.pluginName+".pluginWasClickedCallback is not defined! You must define this if you want this plugin to be clicked on!");};
        } else{
            this.pluginWasClickedFunction = this.editor.config.get('asset')[this.pluginName]["pluginWasClickedCallback"];
        }   
    }

    init() {
        const editor = this.editor;

        // Use the configuration of the editor to define what happens when the plugin is clicked. This allows applications using this plugin
        // to define exactly what happens when a plugin is clicked on, rather than hard-coding that logic here. For example, if a user wants to show
        // an angular modal popup to show a form (i.e. for image upload), then they can do that, and then call a plugin command with form data.
        this.parseAssetPluginConfig();
        
        // Define the plugin
        editor.ui.componentFactory.add( this.pluginName, locale => {
            const view = new ButtonView( locale );

            // Configure the editor to allow "asset-id" and "asset-type" attributes, as well as special handling
            // classes. The idea here is to define mappings for upcasting and downcasting (going from view to
            // model, and from model to view).
            editor.model.schema.extend( 'image', { allowAttributes: [ASSET_ID_PROPERTY_NAME, ASSET_TYPE_PROPERTY_NAME, 'class'] } );
            editor.conversion.attributeToAttribute({ model: ASSET_TYPE_PROPERTY_NAME, view: ASSET_TYPE_PROPERTY_NAME });
            editor.conversion.attributeToAttribute({ model: ASSET_ID_PROPERTY_NAME, view: ASSET_ID_PROPERTY_NAME });
            editor.conversion.attributeToAttribute({
                model: {
                    name: 'image',
                    key: 'class',
                    values: [ASSET_SH_RH_CLASS, ASSET_SH_RS_CLASS, ASSET_SH_EO_CLASS, ASSET_SH_LD_CLASS]
                },
                view: {
                    'asset-sh-rh': {
                        name: 'figure',
                        key: 'class',
                        value: ['image', ASSET_SH_RH_CLASS]
                    }, 
                    'asset-sh-ld': {
                        name: 'figure',
                        key: 'class',
                        value: ['image', ASSET_SH_LD_CLASS]
                    }, 
                    'asset-sh-eo' : {
                        name: 'figure',
                        key: 'class',
                        value: ['image', ASSET_SH_EO_CLASS]
                    }, 
                    'asset-sh-rs': {
                        name: 'figure',
                        key: 'class',
                        value: ['image', ASSET_SH_RS_CLASS]
                    }
                }
            });

            // Create the button using the plugin label and the plugin icon
            view.set( {
                label: this.displayLabel,
                icon: this.svgIcon,
                tooltip: true
            } );

        
            // Executed when the icon is clicked on
            view.on( 'execute', () => {
                this.pluginWasClickedFunction();
            } );

            return view;
        } );
    }
}