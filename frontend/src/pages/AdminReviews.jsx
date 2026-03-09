import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ReviewCard from '../components/reviews/ReviewCard';
import reviewService from '../services/reviewService';
import { Star, BarChart3, Filter, RefreshCw } from 'lucide-react';

export default function AdminReviews() {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ status: '', minRating: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id || user.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reviewsRes, analyticsRes] = await Promise.all([
                reviewService.getAllReviews(filter),
                reviewService.getAnalytics()
            ]);

            if (reviewsRes.ok) {
                const data = await reviewsRes.json();
                setReviews(data.data || []);
            }

            if (analyticsRes.ok) {
                const data = await analyticsRes.json();
                setAnalytics(data.data);
            }
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filter]);

    const handleToggleHide = async (review) => {
        try {
            const res = review.status === 'hidden' 
                ? await reviewService.unhideReview(review.id)
                : await reviewService.hideReview(review.id);
            
            if (res.ok) {
                setReviews(reviews.map(r => 
                    r.id === review.id 
                        ? { ...r, status: r.status === 'hidden' ? 'published' : 'hidden' }
                        : r
                ));
            }
        } catch (err) {
            setError('Failed to update review');
        }
    };

    const renderStars = (count) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                className={`w-4 h-4 ${
                    i < count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
            />
        ));
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            
            <main className="flex-1 container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
                            <p className="text-gray-600 mt-1">Manage user reviews and feedback</p>
                        </div>
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {analytics && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    <span className="text-gray-600">Average Rating</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {parseFloat(analytics.averageRating || 0).toFixed(1)}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <BarChart3 className="w-5 h-5 text-blue-500" />
                                    <span className="text-gray-600">Total Reviews</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {analytics.totalReviews || 0}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-green-500 text-xl">✓</span>
                                    <span className="text-gray-600">Published</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {analytics.publishedCount || 0}
                                </p>
                            </div>

                            <div className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-gray-500 text-xl">∅</span>
                                    <span className="text-gray-600">Hidden</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {analytics.hiddenCount || 0}
                                </p>
                            </div>
                        </div>
                    )}

                    {analytics?.distribution && analytics.distribution.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map((rating) => {
                                    const dist = analytics.distribution.find(d => d.rating === rating);
                                    const count = dist?.count || 0;
                                    const percentage = analytics.totalReviews > 0 
                                        ? (count / analytics.totalReviews * 100).toFixed(0) 
                                        : 0;
                                    
                                    return (
                                        <div key={rating} className="flex items-center gap-3">
                                            <span className="w-8 text-gray-600">{rating}</span>
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="bg-yellow-400 h-2 rounded-full transition-all"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="w-12 text-right text-gray-600 text-sm">
                                                {count} ({percentage}%)
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-600">Filters:</span>
                            </div>
                            <select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Status</option>
                                <option value="published">Published</option>
                                <option value="hidden">Hidden</option>
                            </select>

                            <select
                                value={filter.minRating}
                                onChange={(e) => setFilter({ ...filter, minRating: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Ratings</option>
                                <option value="5">5 Stars</option>
                                <option value="4">4+ Stars</option>
                                <option value="3">3+ Stars</option>
                                <option value="2">2+ Stars</option>
                                <option value="1">1+ Stars</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-12 text-center">
                            <p className="text-gray-500">
                                No reviews found
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <ReviewCard
                                    key={review.id}
                                    review={review}
                                    isAdmin={true}
                                    onToggleHide={handleToggleHide}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
