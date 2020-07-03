import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import imageIcon from './icons/upload_image.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import Command from '@ckeditor/ckeditor5-core/src/command';
import editIcon from './icons/editicon.svg'
import AssetUploadPlugin, { ASSET_ID_PROPERTY_NAME, ASSET_TYPE_PROPERTY_NAME } from './asset-plugin';

export class ImageWithMetadataPlugin extends AssetUploadPlugin {
    constructor(editor) {
        super(editor, "imageWithMetadata", "Upload Image", imageIcon, "image");
    }

    
    init() {
        super.init();

        // Define a command that external code can call to add an image with metadata to the editor, or edit an existing one
        this.editor.commands.add('addNewImageWithMetadataToEditor', new addNewImageToEditor(this.editor));
        this.editor.commands.add('editImageWithMetadata', new editImage(this.editor));
    }
}

export class EditImageWithMetadataPlugin extends Plugin {

    parseAssetPluginConfig() {
        // If the plugin callback wasn't defined, warn the user that this is the case when the plugin is clicked.
        if (this.editor.config.get('asset') == null || this.editor.config.get('asset')[this.pluginName] == null ||
        this.editor.config.get('asset')[this.pluginName]["editWasClickedCallback"] == null) {
            this.editWasClickedCallback = (data) => { alert("editor.config.asset."+this.pluginName+".editWasClickedCallback is not defined! You must define this if you want this plugin to be clicked on!");};
        } else{
            this.editWasClickedCallback = this.editor.config.get('asset')[this.pluginName]["editWasClickedCallback"];
        }   
    }

    
    init() {
        const editor = this.editor;
        this.parseAssetPluginConfig();
        
        // Define the plugin
        editor.ui.componentFactory.add( 'editImageWithMetadata', locale => {
            const view = new ButtonView( locale );
            view.set( {
                label: 'Edit Image',
                icon: editIcon,
                tooltip: true
            } );

        
            // Executed when the icon is clicked on. We grab the attributes of the selected element and pass them to the edit callback (so the callback knows
            // what was clicked on, and how that element is configured)
            view.on( 'execute', () => {
                const t = editor.model.document.selection.getSelectedElement();
                editWasClickedCallback(t.getAttributes());
            } );

            return view;
        } );
    }
}

/**
 * A command that should be invoked by external applications for adding an image to the editor
 */
export class addNewImageToEditor extends Command {
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

/**
 * A command that should be invoked by external applications for editing the currently-selected image
 */
export class editImage extends Command {
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
