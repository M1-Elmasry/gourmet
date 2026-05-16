import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function uploadImage(buffer: Buffer, publicId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { public_id: publicId, resource_type: 'image', folder: 'checkin' },
        (err, result) => {
          if (err || !result) return reject(err || new Error('Upload failed'))
          resolve(result.secure_url)
        },
      )
      .end(buffer)
  })
}

export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)
  return match ? match[1] : null
}

export async function deleteImages(urls: string[]): Promise<number> {
  const publicIds = urls.map(publicIdFromUrl).filter((id): id is string => !!id)
  if (publicIds.length === 0) return 0
  const result = await cloudinary.api.delete_resources(publicIds)
  return Object.keys(result.deleted || {}).length
}
