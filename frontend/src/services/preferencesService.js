import { authenticatedFetch } from './api';

const preferencesService = {
    async getPreferences() {
        return await authenticatedFetch('/preferences');
    },

    async updatePreferences(data) {
        return await authenticatedFetch('/preferences', {
            method: 'PUT',
            body: data,
        });
    },

    async getRoomsWithFilters(date, requiredAmenities = [], preferredAmenities = []) {
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (requiredAmenities.length > 0) params.append('required', requiredAmenities.join(','));
        if (preferredAmenities.length > 0) params.append('preferred', preferredAmenities.join(','));
        
        const queryString = params.toString();
        const url = `/rooms${queryString ? '?' + queryString : ''}`;
        return await authenticatedFetch(url);
    }
};

export default preferencesService;
