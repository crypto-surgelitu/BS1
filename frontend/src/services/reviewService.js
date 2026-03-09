import { authenticatedFetch } from './api';

const reviewService = {
    async createReview(data) {
        return await authenticatedFetch('/api/reviews', {
            method: 'POST',
            body: data,
        });
    },

    async getMyReviews() {
        return await authenticatedFetch('/api/reviews/my-reviews');
    },

    async getReview(id) {
        return await authenticatedFetch(`/api/reviews/${id}`);
    },

    async updateReview(id, data) {
        return await authenticatedFetch(`/api/reviews/${id}`, {
            method: 'PUT',
            body: data,
        });
    },

    async deleteReview(id) {
        return await authenticatedFetch(`/api/reviews/${id}`, {
            method: 'DELETE',
        });
    },

    async getAllReviews(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        const url = `/api/reviews/admin/reviews${params ? `?${params}` : ''}`;
        return await authenticatedFetch(url);
    },

    async hideReview(id) {
        return await authenticatedFetch(`/api/reviews/admin/reviews/${id}/hide`, {
            method: 'PUT',
        });
    },

    async unhideReview(id) {
        return await authenticatedFetch(`/api/reviews/admin/reviews/${id}/unhide`, {
            method: 'PUT',
        });
    },

    async getAnalytics() {
        return await authenticatedFetch('/api/reviews/admin/reviews/analytics');
    },
};

export default reviewService;
