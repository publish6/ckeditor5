import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import imageIcon from './upload_image.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import DowncastHelpers from '@ckeditor/ckeditor5-engine/src/conversion/downcasthelpers';
import UpcastHelpers from '@ckeditor/ckeditor5-engine/src/conversion/upcasthelpers';


export default class ImageWithMetadata extends Plugin {
    init() {
        const editor = this.editor;

        editor.ui.componentFactory.add( 'imageWithMetadata', locale => {
            const view = new ButtonView( locale );

            editor.model.schema.extend( 'image', { allowAttributes: 'blah' } );
            editor.conversion.for( 'downcast' ).attributeToAttribute( {
                model: 'blah',
                view: 'blah',
                converterPriority: 'low'
            } );
    
            const fuckyou = editor.conversion.for( 'upcast' );
            console.log(fuckyou);
            editor.conversion.for( 'upcast' ).attributeToAttribute( {
                view: {
                    name: 'img',
                    key: 'blah'
                },
                model: 'blah',
                converterPriority: 'low'
            } );

            view.set( {
                label: 'Insert image',
                icon: imageIcon,
                tooltip: true
            } );

            

            // Callback executed once the image is clicked.
            view.on( 'execute', () => {
                const imageUrl = prompt( 'Image URL' );

                editor.model.change( writer => {
                    const imageElement = writer.createElement( 'image', {
                        src: imageUrl,
                        blah: "OK",
                        alt: "FICL"
                    } );

                    // Insert the image in the current selection location.
                    editor.model.insertContent( imageElement, editor.model.document.selection );
                } );
            } );

            return view;
        } );
    }
}