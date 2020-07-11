import imageIcon from './style/upload_image.svg';
import { ImageBasedAssetPlugin } from '../image-based-asset-plugin'

export class ImageWithMetadataPlugin extends ImageBasedAssetPlugin {
    constructor(editor) {
        super(editor, "imageWithMetadata", "Upload Image", imageIcon, "image");
    }
}