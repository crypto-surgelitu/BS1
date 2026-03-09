import { Star, Edit2, Trash2, Eye, EyeOff, Calendar } from 'lucide-react';

const SYSTEM_FEEDBACK_LABELS = {
    booking_process: 'Booking Process',
    ui_experience: 'UI/UX',
    room_quality: 'Room Quality',
    overall_satisfaction: 'Overall',
};

export default function ReviewCard({ 
    review, 
    isOwner = false, 
    isAdmin = false, 
    onEdit, 
    onDelete, 
    onToggleHide 
}) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className={`bg-white rounded-lg shadow-md p-5 ${review.status === 'hidden' ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
                <div>
                    <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-5 h-5 ${
                                    star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                }`}
                            />
                        ))}
                        <span className="ml-2 font-semibold text-gray-800">
                            {review.rating}/5
                        </span>
                    </div>
                    {review.room_name && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{review.room_name}</span>
                            {review.booking_date && (
                                <span className="text-gray-400">
                                    ({formatDate(review.booking_date)})
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {review.status === 'hidden' && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            Hidden
                        </span>
                    )}
                </div>
            </div>

            {review.comment && (
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                    {review.comment}
                </p>
            )}

            {review.system_feedback && Object.keys(review.system_feedback).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(review.system_feedback).map(([key, value]) => 
                        value && (
                            <span
                                key={key}
                                className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"
                            >
                                {SYSTEM_FEEDBACK_LABELS[key] || key}
                            </span>
                        )
                    )}
                </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                    {formatDate(review.created_at)}
                </span>
                <div className="flex items-center gap-2">
                    {isAdmin && onToggleHide && (
                        <button
                            onClick={() => onToggleHide(review)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            title={review.status === 'hidden' ? 'Show Review' : 'Hide Review'}
                        >
                            {review.status === 'hidden' ? (
                                <Eye className="w-4 h-4" />
                            ) : (
                                <EyeOff className="w-4 h-4" />
                            )}
                        </button>
                    )}
                    {isOwner && (
                        <>
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(review)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Edit Review"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(review)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete Review"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
