import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import imageIcon from './upload_image.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import DowncastHelpers from '@ckeditor/ckeditor5-engine/src/conversion/downcasthelpers';
import UpcastHelpers from '@ckeditor/ckeditor5-engine/src/conversion/upcasthelpers';
import Command from '@ckeditor/ckeditor5-core/src/command';


export default class ImageWithMetadata extends Plugin {
    init() {
        const editor = this.editor;
        let modalFunction = null;
        if (this.editor.config.get('imageWithMetadata') == null) {
            alert("No configuration for the ImageWithMetadata Plugin was found! Things may not work!");
        } else{
            modalFunction = this.editor.config.get('imageWithMetadata').modalFunction;
        }   
        editor.commands.add('renderServerResponseAsImage', new RenderServerResponseAsImage(editor));
        editor.ui.componentFactory.add( 'imageWithMetadata', locale => {
            const view = new ButtonView( locale );

            // Configure the editor to allow "asset-id" and "asset-type" attributes. We need to configure the "downcast",
            // or model to view, and ALSO the "upcast", or view to model
            editor.model.schema.extend( 'image', { allowAttributes: ['asset-id', 'asset-type'] } );
            editor.conversion.for( 'downcast' ).attributeToAttribute( {
                model: 'asset-id',
                view: 'asset-id',
                converterPriority: 'low'
            } );
            editor.conversion.for( 'downcast' ).attributeToAttribute( {
                model: 'asset-type',
                view: 'asset-type',
                converterPriority: 'low'
            } );
            editor.conversion.for( 'upcast' ).attributeToAttribute( {
                view: {
                    name: 'figure',
                    key: 'asset-id'
                },
                model: 'asset-id',
                converterPriority: 'low'
            } );
            editor.conversion.for( 'upcast' ).attributeToAttribute( {
                view: {
                    name: 'figure',
                    key: 'asset-type'
                },
                model: 'asset-type',
                converterPriority: 'low'
            } );

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
                modalFunction();
            } );

            return view;
        } );
    }
}

export class RenderServerResponseAsImage extends Command {
    // Expects "url", "style", and "db"
    execute(url, style, assetID, assetType) {
        
        this.editor.model.change( writer => {
            const imageElement = writer.createElement( 'image', {
                src: url,
                imageStyle: style,
                "asset-id": assetID,
                "asset-type": assetType
            } );
    
            // Insert the image in the current selection location.
            this.editor.model.insertContent( imageElement, this.editor.model.document.selection );
        } );
    }
}