import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import preferencesService from '../services/preferencesService';
import roomService from '../services/roomService';
import bgImage from '../assets/images/backgrounds/bg5.jpg';

const AVAILABLE_AMENITIES = [
    'WiFi',
    'Air Conditioning',
    'Projector',
    'Whiteboard',
    'Video Conferencing',
    'Smart TV',
    'Phone',
    'Flip Chart',
    'Sound System',
    'Microphone'
];

const USE_CASES = [
    { value: 'meeting', label: 'Meeting' },
    { value: 'event', label: 'Event' },
    { value: 'training', label: 'Training' },
    { value: 'co-working', label: 'Co-working' },
    { value: 'other', label: 'Other' }
];

const PreferencesPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    
    const [requiredAmenities, setRequiredAmenities] = useState([]);
    const [preferredAmenities, setPreferredAmenities] = useState([]);
    const [defaultUseCase, setDefaultUseCase] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            navigate('/login');
            return;
        }
        fetchPreferences();
    }, [navigate]);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const res = await preferencesService.getPreferences();
            if (res.ok) {
                const data = await res.json();
                setRequiredAmenities(data.requiredAmenities || []);
                setPreferredAmenities(data.preferredAmenities || []);
                setDefaultUseCase(data.defaultUseCase || '');
            }
        } catch (err) {
            console.error('Error fetching preferences:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');
            
            const res = await preferencesService.updatePreferences({
                requiredAmenities,
                preferredAmenities,
                defaultUseCase: defaultUseCase || null
            });
            
            if (res.ok) {
                setSuccess('Preferences saved successfully!');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to save preferences');
            }
        } catch (err) {
            console.error('Error saving preferences:', err);
            setError('Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const toggleAmenity = (amenity, currentList, setList) => {
        if (currentList.includes(amenity)) {
            setList(currentList.filter(a => a !== amenity));
        } else {
            setList([...currentList, amenity]);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B4F6C] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading preferences...</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="min-h-screen flex flex-col"
            style={{ 
                backgroundImage: `linear-gradient(rgba(249, 250, 251, 0.8), rgba(249, 250, 251, 0.8)), url(${bgImage})`, 
                backgroundSize: 'cover', 
                backgroundPosition: 'center', 
                backgroundAttachment: 'fixed' 
            }}
        >
            <Navbar />
            
            <main className="flex-1 py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Room Preferences</h1>
                        <p className="text-gray-600 mb-6">
                            Set your default room requirements. These will be pre-filled when making bookings.
                        </p>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                                {success}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Required Amenities
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                    These amenities must be present in any room you book
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_AMENITIES.map(amenity => (
                                        <button
                                            key={amenity}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity, requiredAmenities, setRequiredAmenities)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                requiredAmenities.includes(amenity)
                                                    ? 'bg-[#0B4F6C] text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {amenity}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Preferred Amenities
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                    Nice-to-have amenities. Rooms matching these will be ranked higher
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_AMENITIES.map(amenity => (
                                        <button
                                            key={amenity}
                                            type="button"
                                            onClick={() => toggleAmenity(amenity, preferredAmenities, setPreferredAmenities)}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                preferredAmenities.includes(amenity)
                                                    ? 'bg-[#20B2AA] text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {amenity}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Default Use Case
                                </label>
                                <p className="text-xs text-gray-500 mb-3">
                                    What do you typically use meeting rooms for?
                                </p>
                                <select
                                    value={defaultUseCase}
                                    onChange={(e) => setDefaultUseCase(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0B4F6C] focus:border-transparent"
                                >
                                    <option value="">Select a use case</option>
                                    {USE_CASES.map(useCase => (
                                        <option key={useCase.value} value={useCase.value}>
                                            {useCase.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex-1 bg-[#0B4F6C] text-white py-2 px-4 rounded-md hover:bg-[#0a3d5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Saving...' : 'Save Preferences'}
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default PreferencesPage;
