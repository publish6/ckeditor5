import { GenericPlugin } from './generic-plugin'

export class ClassifyPlugin extends GenericPlugin {
    constructor(editor) {
        super(editor, "classify", "Classify", null);
    }
}