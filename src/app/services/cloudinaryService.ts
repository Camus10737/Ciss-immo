import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

class CloudinaryService {
  constructor() {

    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadRecu(buffer: Buffer, fileName: string): Promise<UploadApiResponse> {
    try {
      return new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {


              resource_type: 'auto', 
              upload_preset: 'recus_preset',
              folder: 'recus',
              public_id: `${Date.now()}-${fileName}`,
              filename: fileName,
              access_mode: 'public' 
            },
            (error: UploadApiErrorResponse | null | undefined, result: UploadApiResponse | undefined) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                return reject(error);
              }
              if (!result) {
                return reject(new Error('Upload failed - no result'));
              }
              console.log('Reçu upload successful:', result);
              resolve(result);
            }
          )
          .end(buffer);
      });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }
}

export const cloudinaryService = new CloudinaryService();