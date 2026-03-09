import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import reviewService from '../../services/reviewService';

const SYSTEM_FEEDBACK_OPTIONS = [
    { key: 'booking_process', label: 'Booking Process' },
    { key: 'ui_experience', label: 'UI/UX Experience' },
    { key: 'room_quality', label: 'Room Quality' },
    { key: 'overall_satisfaction', label: 'Overall Satisfaction' },
];

export default function ReviewForm({ existingReview, onSuccess, onCancel }) {
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [comment, setComment] = useState(existingReview?.comment || '');
    const [systemFeedback, setSystemFeedback] = useState(
        existingReview?.system_feedback || {}
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFeedbackToggle = (key) => {
        setSystemFeedback(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (rating === 0) {
            setError('Please select a rating');
            return;
        }

        setLoading(true);
        try {
            const data = {
                rating,
                comment,
                systemFeedback,
                bookingId: existingReview?.booking_id || null
            };

            let response;
            if (existingReview) {
                response = await reviewService.updateReview(existingReview.id, data);
            } else {
                response = await reviewService.createReview(data);
            }

            if (response.ok) {
                onSuccess?.();
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to submit review');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">
                {existingReview ? 'Edit Your Review' : 'Leave a Review'}
            </h3>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                </label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                        >
                            <Star
                                className={`w-8 h-8 transition-colors ${
                                    star <= rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                }`}
                            />
                        </button>
                    ))}
                </div>
                <span className="text-sm text-gray-500 mt-1">
                    {rating === 0 ? 'Click to rate' : `${rating} star${rating > 1 ? 's' : ''}`}
                </span>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Feedback (Optional)
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with us..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                    maxLength={1000}
                />
            </div>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    What would you like to feedback on? (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {SYSTEM_FEEDBACK_OPTIONS.map((option) => (
                        <label
                            key={option.key}
                            className="flex items-center gap-2 cursor-pointer p-2 border rounded-md hover:bg-gray-50"
                        >
                            <input
                                type="checkbox"
                                checked={!!systemFeedback[option.key]}
                                onChange={() => handleFeedbackToggle(option.key)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 justify-end">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading || rating === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Send className="w-4 h-4" />
                    {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
                </button>
            </div>
        </form>
    );
}
