import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import imageIcon from './removeMarkings.svg';

export default class RemoveMarkings extends Plugin {
	init() {
		const editor = this.editor;

		editor.ui.componentFactory.add( 'removeMarkings', locale => {
			const view = new ButtonView(locale);
			view.set( {
				label: 'Remove Markings',
				icon: imageIcon,
				tooltip: true
			} );

			// Binds to the read only property of the editor so that it dynamically enables/disables itself
			view.bind( 'isEnabled' ).to( editor, 'isReadOnly', isReadOnly => !isReadOnly );

			view.on( 'execute', () => {
				const data = editor.getData();
				const newString = data.replace( /\(.+?\/\/.+?\)|\(.{1}\)/g, '' );
				editor.setData( newString );
			} );

			return view;
		} );
	}
}
