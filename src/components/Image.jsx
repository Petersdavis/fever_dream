import { remapToCloudinary } from '../lib/cloudinary';

export default function Image({
  src,
  alt = '',
  cloudName,
  remap = true,
  ...props
}) {
  if (!src) return null;

  const resolvedSrc = remap ? remapToCloudinary(src, { cloudName }) : src;
console.log("remapped", resolvedSrc)
  return <img src={resolvedSrc} alt={alt} {...props} />;
}

