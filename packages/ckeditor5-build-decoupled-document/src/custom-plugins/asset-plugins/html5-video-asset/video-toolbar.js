import WidgetToolbarRepository from '@ckeditor/ckeditor5-widget/src/widgettoolbarrepository';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { getSelectedVideoWidget, viewFigureToModel, createVideoViewElement, toVideoWidget, modelToViewAttributeConverter, getViewVideoFromWidget } from './video-utils';

export default class VideoToolbar extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ WidgetToolbarRepository ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'VideoToolbar';
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		const editor = this.editor;
		const t = editor.t;
		const widgetToolbarRepository = editor.plugins.get( WidgetToolbarRepository );

		widgetToolbarRepository.register( 'video', {
			ariaLabel: t( 'Video toolbar' ),
			items: editor.config.get( 'video.toolbar' ) || [],
			getRelatedElement: getSelectedVideoWidget
		} );
	}
}