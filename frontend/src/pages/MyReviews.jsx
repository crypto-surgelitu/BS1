import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewCard from '../components/reviews/ReviewCard';
import reviewService from '../services/reviewService';
import { Star, Plus, MessageSquare } from 'lucide-react';

export default function MyReviews() {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingReview, setEditingReview] = useState(null);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            navigate('/login');
            return;
        }
        fetchReviews();
    }, [navigate]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const res = await reviewService.getMyReviews();
            if (res.ok) {
                const data = await res.json();
                setReviews(data.data || []);
            } else {
                setError('Failed to load reviews');
            }
        } catch (err) {
            setError('An error occurred while loading reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (review) => {
        setEditingReview(review);
        setShowForm(true);
    };

    const handleDelete = async (review) => {
        try {
            const res = await reviewService.deleteReview(review.id);
            if (res.ok) {
                setReviews(reviews.filter(r => r.id !== review.id));
                setDeleteConfirm(null);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to delete review');
            }
        } catch (err) {
            setError('Failed to delete review');
        }
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingReview(null);
        fetchReviews();
    };

    const getAverageRating = () => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        return (sum / reviews.length).toFixed(1);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            
            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
                            <p className="text-gray-600 mt-1">View and manage your reviews</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingReview(null);
                                setShowForm(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Write Review
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {showForm && (
                        <div className="mb-8">
                            <ReviewForm
                                existingReview={editingReview}
                                onSuccess={handleFormSuccess}
                                onCancel={() => {
                                    setShowForm(false);
                                    setEditingReview(null);
                                }}
                            />
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                No Reviews Yet
                            </h3>
                            <p className="text-gray-500 mb-4">
                                Share your experience by writing a review
                            </p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Write Your First Review
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                                        <span className="text-2xl font-bold text-gray-900">
                                            {getAverageRating()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">
                                            Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <ReviewCard
                                        key={review.id}
                                        review={review}
                                        isOwner={true}
                                        onEdit={handleEdit}
                                        onDelete={(r) => setDeleteConfirm(r)}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <Footer />

            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-2">Delete Review?</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete this review? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
