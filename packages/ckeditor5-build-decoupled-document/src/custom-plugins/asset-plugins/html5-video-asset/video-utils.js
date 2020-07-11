// Functions used by multiple files
import { findOptimalInsertionPosition, isWidget, toWidget } from '@ckeditor/ckeditor5-widget/src/utils';

export function getSelectedVideoWidget( selection ) {
	const viewElement = selection.getSelectedElement();

	if ( viewElement && isVideoWidget( viewElement ) ) {
		return viewElement;
	}

	return null;
}

export function isVideoWidget( viewElement ) {
	return !!viewElement.getCustomProperty( 'video' ) && isWidget( viewElement );
}

export function viewFigureToModel() {
	return dispatcher => {
		dispatcher.on( 'element:figure', converter );
	};

	function converter( evt, data, conversionApi ) {
		// Do not convert if this is not a "video" figure.
		if ( !conversionApi.consumable.test( data.viewItem, { name: true, classes: 'video' } ) ) {
			return;
		}

		// Find a video element inside the figure element.
		const viewVideo = getViewVideoFromWidget( data.viewItem );

		// Do not convert if video element is absent, is missing src attribute or was already converted.
		if ( !viewVideo || !viewVideo.hasAttribute( 'src' ) || !conversionApi.consumable.test( viewVideo, { name: true } ) ) {
			return;
		}

		// Convert view viewVideo to model video.
		const conversionResult = conversionApi.convertItem( viewVideo, data.modelCursor );

		// Get viewVideo element from conversion result.
		const modelVideo = first( conversionResult.modelRange.getItems() );

		// When video wasn't successfully converted then finish conversion.
		if ( !modelVideo ) {
			return;
		}

		// Convert rest of the figure element's children as an video children.
		conversionApi.convertChildren( data.viewItem, conversionApi.writer.createPositionAt( modelVideo, 0 ) );

		// Set video range as conversion result.
		data.modelRange = conversionResult.modelRange;

		// Continue conversion where video conversion ends.
		data.modelCursor = conversionResult.modelCursor;
	}
}

export function  createVideoViewElement(writer) {
    const figureElement = writer.createContainerElement('figure', {class: "html5video"});
    const videoElement = writer.createContainerElement('video');
    writer.insert(writer.createPositionAt(figureElement, 0), videoElement);

    return figureElement; 
}

export function toVideoWidget( viewElement, writer, label ) {
	writer.setCustomProperty( 'video', true, viewElement );
	return toWidget( viewElement, writer, { label: label } );
}

export function modelToViewAttributeConverter( attributeKey ) {
	return dispatcher => {
		dispatcher.on( `attribute:${ attributeKey }:video`, (evt, data, conversionApi)  => {
            if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
                return;
            }
    
            const viewWriter = conversionApi.writer;
            const figure = conversionApi.mapper.toViewElement( data.item );
            const vid = getViewVideoFromWidget( figure );
    
            viewWriter.setAttribute( data.attributeKey, data.attributeNewValue || '', vid );
        });
	};
}
export function getViewVideoFromWidget( figureView ) {
	const figureChildren = [];

	for ( const figureChild of figureView.getChildren() ) {
		figureChildren.push( figureChild );

		if ( figureChild.is( 'element' ) ) {
			figureChildren.push( ...figureChild.getChildren() );
		}
	}

	return figureChildren.find( viewChild => viewChild.is( 'video' ) );
}