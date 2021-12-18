import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import imageIcon from './style/documentLink.svg';

export default class DocumentLink extends Plugin {
	init() {
		const editor = this.editor;

		editor.ui.componentFactory.add( 'documentLink', locale => {
			const view = new ButtonView(locale);

			// Binds to the read only property of the editor so that it dynamically enables/disables itself
			view.bind( 'isEnabled' ).to( editor, 'isReadOnly', isReadOnly => !isReadOnly );

			view.set( {
				label: 'Add Document Link',
				icon: imageIcon,
				tooltip: true
			} );

			view.on( 'execute', () => {
				editor.execute('link', 'http://example.com');
			} );

			return view;
		} );
	}
}
