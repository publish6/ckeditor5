// Functions used by multiple files
import { isWidget, toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';
import { enablePlaceholder } from '@ckeditor/ckeditor5-engine/src/view/placeholder';
import first from '@ckeditor/ckeditor5-utils/src/first';

export function getSelectedAudioWidget( selection ) {
	const viewElement = selection.getSelectedElement();

	if ( viewElement && isAudioWidget( viewElement ) ) {
		return viewElement;
	}

	return null;
}

export function isAudioWidget( viewElement ) {
	return !!viewElement.getCustomProperty( 'audio' ) && isWidget( viewElement );
}


// Converts a figure representing a audio to a CKEditor audio model
export function viewFigureToModel() {
	return dispatcher => {
		// Fired when a figure is inserted
		dispatcher.on( 'element:figure', converter );
	};

	function converter( evt, data, conversionApi ) {
		// Do not convert if this is not a "audio" figure.
		if ( !conversionApi.consumable.test( data.viewItem, { name: true, classes: 'audio' } ) ) {
			return;
		}

		// Find a audio element inside the figure element.
		const viewAudio = getViewAudioFromWidget( data.viewItem );

		// Do not convert if audio element is absent, is missing src attribute or was already converted.
		if ( !viewAudio || !viewAudio.hasAttribute( 'src' ) || !conversionApi.consumable.test( viewAudio, { name: true } ) ) {
			return;
		}

		// Convert view viewAudio to model audio.
		const conversionResult = conversionApi.convertItem( viewAudio, data.modelCursor );

		// Get viewAudio element from conversion result.
		const modelAudio = first( conversionResult.modelRange.getItems() );

		// When audio wasn't successfully converted then finish conversion.
		if ( !modelAudio ) {
			return;
		}

		// Convert rest of the figure element's children as an audio children.
		conversionApi.convertChildren( data.viewItem, conversionApi.writer.createPositionAt( modelAudio, 0 ) );

		// Set audio range as conversion result.
		data.modelRange = conversionResult.modelRange;

		// Continue conversion where audio conversion ends.
		data.modelCursor = conversionResult.modelCursor;
	}
}

// Creates an empty audio view representation, consisting of a figure that contains a "audio" element
export function  createAudioViewElement(writer) {
    const figureElement = writer.createContainerElement('figure', {class: "html5audio"});
    const audioElement = writer.createContainerElement('audio', {disablePictureInPicture: true, alt: "", controls: 'controls'});
    writer.insert(writer.createPositionAt(figureElement, 0), audioElement);

    return figureElement; 
}

export function toAudioWidget( viewElement, writer, label ) {
	writer.setCustomProperty( 'audio', true, viewElement );
	return toWidget( viewElement, writer, { label: label } );
}

export function convertMapIteratorToMap(data) {
    const map = {};
    for (let item of data) {
      map[item[0]] = item[1];
    }
    return map;
  }

export function modelToViewAttributeConverter( attributeKey ) {
	return dispatcher => {
		dispatcher.on( `attribute:${ attributeKey }:audio`, (evt, data, conversionApi)  => {
            if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
                return;
            }
    
            const viewWriter = conversionApi.writer;
            const figure = conversionApi.mapper.toViewElement( data.item );
            const vid = getViewAudioFromWidget( figure );
    
            viewWriter.setAttribute( data.attributeKey, data.attributeNewValue || '', vid );
        });
	};
}

export function isAudio( modelElement ) {
	return !!modelElement && modelElement.is( 'element', 'audio' );
}

export function getViewAudioFromWidget( figureView ) {
	const figureChildren = [];

	for ( const figureChild of figureView.getChildren() ) {
		figureChildren.push( figureChild );

		if ( figureChild.is( 'element' ) ) {
			figureChildren.push( ...figureChild.getChildren() );
		}
	}

	return figureChildren.find( viewChild => viewChild.is( 'element', 'audio' ) );
}

export function captionElementCreator( view, placeholderText ) {
	return writer => {
		const editable = writer.createEditableElement( 'figcaption' );
		writer.setCustomProperty( 'audioCaption', true, editable );

		enablePlaceholder( {
			view,
			element: editable,
			text: placeholderText
		} );

		return toWidgetEditable( editable, writer );
	};
}

export function isCaption( viewElement ) {
	return !!viewElement.getCustomProperty( 'audioCaption' );
}

export function getCaptionFromAudio( imageModelElement ) {
	for ( const node of imageModelElement.getChildren() ) {
		if ( !!node && node.is( 'element', 'caption' ) ) {
			return node;
		}
	}

	return null;
}

export function matchAudioCaption( element ) {
	const parent = element.parent;

	// Convert only captions for audios.
	if ( element.name == 'figcaption' && parent && parent.name == 'figure' && parent.hasClass( 'html5audio' ) ) {
		return { name: true };
	}

	return null;
}