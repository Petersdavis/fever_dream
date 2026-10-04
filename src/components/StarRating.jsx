export default function StarRating({ rating = 5, max = 5, size = 16, className = '' }) {
  const stars = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div
      className={`star-rating ${className}`}
      aria-label={`${rating} out of ${max} stars`}
      role="img"
    >
      {stars.map((star) => (
        <svg
          key={star}
          className={`star-icon ${star <= rating ? 'filled' : 'empty'}`}
          viewBox="0 0 24 24"
          width={size}
          height={size}
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          />
        </svg>
      ))}
    </div>
  );
}
