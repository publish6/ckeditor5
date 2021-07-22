import { GenericPlugin } from '../generic-plugins/generic-plugin';
import Highlight from '@ckeditor/ckeditor5-highlight/src/highlight';
import FontColor from '@ckeditor/ckeditor5-font/src/fontcolor';
import FontBackgroundColor from '@ckeditor/ckeditor5-font/src/fontbackgroundcolor';

// God, this is such a stupid way to prevent editing the document, but apparently is the only way to
// do it: https://ckeditor.com/docs/ckeditor5/11.1.1/features/collaboration/comment-only-mode.html?docId=efcadb1b1aa3b85573557c0227f473ab7
export class HighlightOnly extends GenericPlugin {
    constructor(editor) {
        super(editor, "highlightonly", "HighlightOnly", null);
    }

    static get pluginName() {
      return 'HighlightOnly';
    }

    init() {
      const commandsToKeep = [
        'highlight',
        'fontColor',
        'fontBackgroundColor',
    ];

      // Disallows changing text directly, but allows certain plugins
      for (const commandName of this.editor.commands.names()) {
        if (commandsToKeep.includes(commandName)) {
          console.log("NOT DISABLING "+commandName);
          continue;
        }
        const command = this.editor.commands.get(commandName);
        console.log("DISABLING "+commandName);
        console.log(commandsToKeep);
        command.on( 'change:isEnabled', evt => {
            command.isEnabled = false;
            evt.stop();
          }, { priority: 'highest' } );
    
        command.isEnabled = false;
      }
      const viewDocument = this.editor.editing.view.document;

      // Prevent cutting and pasting. These actions happen during certain events.
      viewDocument.on( 'cut', evt => evt.stop(), { priority: 'highest' } );
      viewDocument.on( 'clipboardInput', evt => evt.stop(), { priority: 'highest' } );

      // Prevent doing any changes on Delete key.
      viewDocument.on( 'delete', evt => evt.stop(), { priority: 'highest' } );
      console.log("Disabling ALL TEXT");
    }
}
