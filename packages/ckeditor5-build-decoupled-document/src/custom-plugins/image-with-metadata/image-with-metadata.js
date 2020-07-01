import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import imageIcon from './upload_image.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import DowncastHelpers from '@ckeditor/ckeditor5-engine/src/conversion/downcasthelpers';
import UpcastHelpers from '@ckeditor/ckeditor5-engine/src/conversion/upcasthelpers';
import Command from '@ckeditor/ckeditor5-core/src/command';
import editIcon from './editicon2.svg'


export default class ImageWithMetadata extends Plugin {
    init() {
        const editor = this.editor;
        let modalFunction = null;
        
        // Let the user know that the modalFunction wasn't configured. This function gets called when the icon is clicked,
        // so it needs to be defined
        if (this.editor.config.get('imageWithMetadata') == null) {
            modalFunction = () => { alert("NO Modal function was defined!");};
        } else{
            modalFunction = this.editor.config.get('imageWithMetadata').modalFunction;
        }   

        // Define a command that external code can call to add an image with metadata to the editor
        editor.commands.add('renderServerResponseAsImage', new RenderServerResponseAsImage(editor));
        editor.commands.add('modifyExistingImage', new modifyExistingImage(editor));
        
        // Define the plugin
        editor.ui.componentFactory.add( 'imageWithMetadata', locale => {
            const view = new ButtonView( locale );

            // Configure the editor to allow "asset-id" and "asset-type" attributes, as well as special handling
            // classes. The idea here is to define mappings for upcasting and downcasting (going from view to
            // model, and from model to view).
            editor.model.schema.extend( 'image', { allowAttributes: ['assetID', 'assetType', 'class'] } );
            editor.conversion.attributeToAttribute({ model: 'assetID', view: 'assetID' });
            editor.conversion.attributeToAttribute({ model: 'assetType', view: 'assetType' });
            editor.conversion.attributeToAttribute({
                model: {
                    name: 'image',
                    key: 'class',
                    values: ['sh-rh', 'sh-ld', 'sh-eo', 'sh-rs']
                },
                view: {
                    'sh-rh': {
                        name: 'figure',
                        key: 'class',
                        value: ['image', 'sh-rh']
                    }, 
                    'sh-ld': {
                        name: 'figure',
                        key: 'class',
                        value: ['image', 'sh-ld']
                    }, 
                    'sh-eo' : {
                        name: 'figure',
                        key: 'class',
                        value: ['image', 'sh-eo']
                    }, 
                    'sh-rs': {
                        name: 'figure',
                        key: 'class',
                        value: ['image', 'sh-rs']
                    }
                }
            });

            view.set( {
                label: 'Insert image',
                icon: imageIcon,
                tooltip: true
            } );

        
            // Executed when the icon is clicked on
            view.on( 'execute', () => {
                /**
                 * Here we simply call a functino that was passed into the configuration for this plugin,
                 * with the intention that it will invoke the "renderServerResponseAsImage" command.
                 * The idea here is to not have this plugin depend on angular, material, etc. Instead,
                 * we want the application to be responsible for getting the data from the user (i.e. via
                 * a modal popup). 
                 */
                modalFunction(null);
            } );

            return view;
        } );
    }
}

export class EditImageWithMetadata extends Plugin {
    init() {
        const editor = this.editor;
        let modalFunction = null;

        // Let the user know that the modalFunction wasn't configured. This function gets called when the icon is clicked,
        // so it needs to be defined
        if (this.editor.config.get('imageWithMetadata') == null) {
            modalFunction = () => { alert("NO Modal function was defined!");};
        } else{
            modalFunction = this.editor.config.get('imageWithMetadata').modalFunction;
        }   
        
        // Define the plugin
        editor.ui.componentFactory.add( 'editImageWithMetadata', locale => {
            const view = new ButtonView( locale );
            view.set( {
                label: 'Edit Image',
                icon: editIcon,
                tooltip: true
            } );

        
            // Executed when the icon is clicked on
            view.on( 'execute', () => {
                /**
                 * Here we simply call a functino that was passed into the configuration for this plugin,
                 * with the intention that it will invoke the "renderServerResponseAsImage" command.
                 * The idea here is to not have this plugin depend on angular, material, etc. Instead,
                 * we want the application to be responsible for getting the data from the user (i.e. via
                 * a modal popup). 
                 */
                const t = editor.model.document.selection.getSelectedElement();
                modalFunction(t.getAttributes());
            } );

            return view;
        } );
    }
}
// The command that consumers will invoke to add an image, with metadata, to the editor
export class RenderServerResponseAsImage extends Command {
    // Expects "url", "style", and "db"
    execute(url, style, assetID, assetType, assetSHClass) {
        
        this.editor.model.change( writer => {
            const imageElement = writer.createElement( 'image', {
                src: url,
                imageStyle: style,
                assetID: assetID,
                assetType: assetType,
                class: assetSHClass
            } );
    
            // Insert the image in the current selection location.
            this.editor.model.insertContent( imageElement, this.editor.model.document.selection );
        } );
    }
}

// The command that consumers will invoke to add an image, with metadata, to the editor
export class modifyExistingImage extends Command {
    // Expects "url", "style", and "db"
    execute(url, style, assetID, assetType, assetSHClass) {
        
        this.editor.model.change( writer => {
            const element = editor.model.document.selection.getSelectedElement();
            writer.setAttribute("src", url, element);
            writer.setAttribute("imageStyle", style, element);
            writer.setAttribute("assetID", assetID, element);
            writer.setAttribute("assetType", assetType, element);
            writer.setAttribute("class", assetSHClass, element);
        } );
    }
}
