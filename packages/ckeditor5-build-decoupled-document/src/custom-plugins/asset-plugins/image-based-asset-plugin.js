/**
 * Author: Alex Campbell
 * Date: 2020-07-03
 * A base class that defines variables and logic that applies to any asset plugin that is "image-based", or assets that are rendered as images
 * in HTML (images, image link to PDFs, HTML5 interactives, etc). At a minimum, this plugin will allow users to add image-based assets to the editor.
 * It will also allow users to click on an asset, which will bring up toolbar buttons to edit or preview the asset. The exact logic that occurs
 * when any of these buttons are clicked is defined by external applications (i.e. our "press" app). This is so that external applications can
 * use their own designs and code to define HOW the user interacts with the plugin (i.e. UI/UX, form validation, usage of frameworks like Angular, etc).
 * 
 * This plugin should NOT be instantiated directly. Instead, subclasses of this plugin should be created and used
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import editIcon from './icons/editicon.svg'
import previewIcon from './icons/previewicon.svg'
import Command from '@ckeditor/ckeditor5-core/src/command';
import { AssetPluginHelper } from './asset-plugin-helper';
export const ASSET_ID_PROPERTY_NAME = AssetPluginHelper.getAssetIdPropertyName();
export const ASSET_TYPE_PROPERTY_NAME = AssetPluginHelper.getAssetTypePropertyName();
export const ASSET_SH_RH_CLASS = AssetPluginHelper.getAssetSpecialHandlingRH();
export const ASSET_SH_RS_CLASS = AssetPluginHelper.getAssetSpecialHandlingRS();
export const ASSET_SH_LD_CLASS = AssetPluginHelper.getAssetSpecialHandlingLD();
export const ASSET_SH_EO_CLASS = AssetPluginHelper.getAssetSpecialHandlingEO();

export class ImageBasedAssetPlugin extends Plugin {
    constructor(editor, pluginName, displayLabel, svgIcon, assetType) {
        super(editor);
        this.pluginName = pluginName;
        this.displayLabel = displayLabel;
        this.svgIcon = svgIcon;
        this.assetType = assetType;
    }
    init() {
        const editor = this.editor;

        // Use the configuration of the editor to define what happens when the plugin is clicked. This allows applications using this plugin
        // to define exactly what happens when a plugin is clicked on, rather than hard-coding that logic here. For example, if a user wants to show
        // an angular modal popup to show a form (i.e. for image upload), then they can do that, and then call a plugin command with form data.
        this.toolbarButtonCallback = AssetPluginHelper.getToolbarButtonCallbackFromConfig(editor.config, this.pluginName);

        // Define a command that external code can call to add an image with metadata to the editor, or edit an existing one
        this.editor.commands.add('addNewImageBasedAsset', new AddNewImage(this.editor));
        this.editor.commands.add('editImageBasedAsset', new EditImage(this.editor));
        
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
                this.toolbarButtonCallback();
            } );

            return view;
        } );
    }
}

/**
 * A command that should be invoked by external applications for adding an image to the editor
 */
class AddNewImage extends Command {
    execute(url, style, assetID, assetType, assetSHClass) {
        // Create an image model element, and assign it the metadata that was passed in. Note that ALL changes to the model
        // need to be made through the model.change((writer) => {...}) pattern
        this.editor.model.change( writer => {
            const newData = {
                src: url,
                imageStyle: style,
                class: assetSHClass
            };
            newData[ASSET_ID_PROPERTY_NAME] = assetID;
            newData[ASSET_TYPE_PROPERTY_NAME] = assetType;
            const imageElement = writer.createElement( 'image', newData );
    
            // Insert the image in the current selection location.
            this.editor.model.insertContent( imageElement, this.editor.model.document.selection );
        } );
    }
}

export class EditImageBasedAssetPlugin extends Plugin 
{
    init() {
        const editor = this.editor;
        this.editButtonCallback = AssetPluginHelper.getEditButtonCallbackFromConfig(editor.config, "editImageBasedAsset");
        AssetPluginHelper.createComponent(editor, "editImageBasedAsset", "Edit Asset", editIcon, () => {
            const t = editor.model.document.selection.getSelectedElement();
            this.editButtonCallback(t.getAttributes());
        });
    }
}


/**
 * A command that should be invoked by external applications for editing the currently-selected image
 */
class EditImage extends Command {
    execute(url, style, assetID, assetType, assetSHClass) {
        this.editor.model.change( writer => {
            const element = editor.model.document.selection.getSelectedElement();
            writer.setAttribute("src", url, element);
            writer.setAttribute("imageStyle", style, element);
            writer.setAttribute(ASSET_ID_PROPERTY_NAME, assetID, element);
            writer.setAttribute(ASSET_TYPE_PROPERTY_NAME, assetType, element);
            writer.setAttribute("class", assetSHClass, element);
        } );
    }
}


export class PreviewImageBasedAssetPlugin extends Plugin 
{
    init() {
        const editor = this.editor;
        this.previewButtonCallback = AssetPluginHelper.getPreviewButtonCallbackFromConfig(editor.config, "previewImageBasedAsset");
        AssetPluginHelper.createComponent(editor, "previewImageBasedAsset", "Preview Asset", previewIcon, () => {
            const t = editor.model.document.selection.getSelectedElement();
            this.previewButtonCallback(t.getAttributes());
        });
    }
}