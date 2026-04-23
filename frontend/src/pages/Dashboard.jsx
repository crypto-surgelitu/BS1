import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, DoorOpen, Bookmark, X, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import BookingModal from '../components/modals/BookingModal';
import Footer from '../components/layout/Footer';
import roomService from '../services/roomService';
import bookingService from '../services/bookingService';
import socketService from '../services/socketService';
import RoomCard from '../components/rooms/RoomCard';
import bgImage from '../assets/images/backgrounds/bg4.jpg';

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [modalType, setModalType] = useState('booking');
    const [rooms, setRooms] = useState([]);
    const [userBookings, setUserBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [currentView, setCurrentView] = useState('available');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelLoading, setCancelLoading] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [cancelSuccess, setCancelSuccess] = useState('');

    useEffect(() => {
        const viewParam = searchParams.get('view');
        if (viewParam === 'booked' || viewParam === 'reserved') {
            setCurrentView(viewParam);
        }
    }, [searchParams]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        
        try {
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            // Always fetch rooms (public endpoint)
            const roomsRes = await roomService.getRooms(selectedDate);
            if (roomsRes.ok) {
                const roomsData = await roomsRes.json();
                setRooms(roomsData);
            }

            // Try to fetch user bookings if user exists
            // Skip if no valid auth (401 responses are handled gracefully)
            if (user) {
                try {
                    const bookingsRes = await bookingService.getUserBookings(user.id);
                    // Only update bookings on successful response
                    if (bookingsRes.status === 200) {
                        const bookingsData = await bookingsRes.json();
                        setUserBookings(bookingsData);
                    }
                    // Silently ignore 401/other errors - don't break the UI
                } catch (e) {
                    // Ignore network/other errors
                }
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        socketService.connect(
            () => { },
            () => { }
        );

        const handleRoomCreated = (newRoom) => {
            setRooms(prev => {
                if (prev.some(r => r.id === newRoom.id)) return prev;
                return [...prev, newRoom];
            });
        };

        const handleRoomDeleted = ({ id }) => {
            setRooms(prev => prev.filter(r => r.id !== id));
        };

        socketService.onRoomCreated(handleRoomCreated);
        socketService.onRoomDeleted(handleRoomDeleted);

        return () => {
            socketService.offRoomCreated(handleRoomCreated);
            socketService.offRoomDeleted(handleRoomDeleted);
        };
    }, []);

    const handleNavigate = (viewId) => {
        if (viewId === 'reviews') {
            navigate('/my-reviews');
        } else if (viewId === 'home' || viewId === 'available') {
            setCurrentView('available');
        } else {
            setCurrentView(viewId);
        }
        setIsSidebarOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        navigate('/login');
    };

    const openModal = (room, type) => {
        setSelectedRoom(room);
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleBookingSuccess = (bookingType) => {
        // Navigate to the appropriate view based on booking type
        if (bookingType === 'reservation') {
            setCurrentView('reserved');
        } else {
            setCurrentView('booked');
        }
        
        // Refresh data with a small delay
        setTimeout(() => {
            try {
                fetchData();
            } catch (e) {
                console.error('Error in handleBookingSuccess:', e);
            }
        }, 100);
    };

    const openCancelModal = (booking) => {
        console.log('Opening cancel modal for booking:', booking);
        if (!booking || !booking.id) {
            console.error('Invalid booking data:', booking);
            return;
        }

        setSelectedBooking(booking);
        setCancelReason('');
        setCancelError('');
        setCancelSuccess('');
        setIsCancelModalOpen(true);
    };

    const closeCancelModal = () => {
        setIsCancelModalOpen(false);
        setSelectedBooking(null);
        setCancelReason('');
        setCancelError('');
        setCancelSuccess('');
    };

    const handleCancelBooking = async () => {
        if (!selectedBooking) {
            setCancelError('System error: No booking selected');
            return;
        }

        const reason = cancelReason || '';
        if (!reason.trim()) {
            setCancelError('Please provide a cancellation reason');
            return;
        }
        
        setCancelLoading(true);
        setCancelError('');

        try {
            console.log('Cancelling booking:', selectedBooking.id, 'with reason:', reason);
            const response = await bookingService.cancelBooking(selectedBooking.id, reason);

            if (response.status === 401) {
                setCancelError('Session expired. Please login again.');
                setCancelLoading(false);
                return;
            }

            if (response.ok) {
                setCancelSuccess('Booking cancelled successfully');
                setUserBookings(prev =>
                    prev.map(booking =>
                        booking.id === selectedBooking.id
                            ? { ...booking, status: 'cancelled', cancellation_reason: reason }
                            : booking
                    )
                );
                
                setTimeout(() => {
                    closeCancelModal();
                    fetchData().catch(err => console.error('Failed to refresh data after cancellation:', err));
                }, 600);
            } else {
                const errorText = await response.text();
                let data;
                try {
                    data = JSON.parse(errorText);
                } catch (e) {
                    data = { error: errorText };
                }
                console.error('Cancel booking error response:', data);
                setCancelError(data.error || `Failed to cancel booking (${response.status})`);
            }
        } catch (err) {
            console.error('Cancel booking exception:', err);
            setCancelError('Network error. Please try again.');
        } finally {
            setCancelLoading(false);
        }
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = (room.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            room.amenities?.some(amenity => amenity?.toLowerCase()?.includes(searchTerm.toLowerCase()));
        // For available view, only show rooms that can be booked
        if (currentView === 'available') {
            return matchesSearch && room.status === 'Available';
        }
        return matchesSearch;
    });

    const filteredBookings = userBookings.filter(booking => {
        const matchesSearch = (booking.room_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        if (currentView === 'reserved') return matchesSearch && booking.type === 'reservation' && booking.status !== 'cancelled';
        if (currentView === 'booked') return matchesSearch && booking.type === 'booking' && booking.status !== 'cancelled';
        return true;
    });

    const getPageTitle = () => {
        switch (currentView) {
            case 'reserved': return 'Reserved Rooms';
            case 'booked': return 'Booked Rooms';
            default: return 'Available Rooms';
        }
    };

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
            <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                currentView={currentView}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
            />

            <BookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                room={selectedRoom}
                type={modalType}
                onSuccess={handleBookingSuccess}
            />

            {isCancelModalOpen && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeCancelModal}
                    />

                    <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="mb-6 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Cancel Booking</h2>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Are you sure you want to cancel this booking?
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeCancelModal}
                                    disabled={cancelLoading}
                                    className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {selectedBooking?.room_name || 'Unknown Room'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {selectedBooking?.booking_date || 'Unknown Date'} | {selectedBooking?.start_time || '?'} - {selectedBooking?.end_time || '?'}
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="cancelReason" className="mb-2 block text-sm font-semibold text-gray-700">
                                        Cancellation Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="cancelReason"
                                        rows={4}
                                        className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:ring-red-500"
                                        placeholder="Please provide a reason for cancellation..."
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        maxLength={500}
                                    />
                                    <p className="mt-2 text-xs text-gray-400">{cancelReason?.length || 0}/500 characters</p>
                                </div>

                                {cancelError && (
                                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                        <span>{cancelError}</span>
                                    </div>
                                )}

                                {cancelSuccess && (
                                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-600">
                                        {cancelSuccess}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={closeCancelModal}
                                disabled={cancelLoading}
                                className="inline-flex w-full justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                Back
                            </button>
                            <button
                                type="button"
                                data-testid="confirm-cancel-btn"
                                onClick={() => {
                                    console.log('Confirm cancel button clicked');
                                    handleCancelBooking();
                                }}
                                disabled={cancelLoading || cancelSuccess}
                                className="inline-flex w-full justify-center rounded-xl border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                {cancelLoading ? 'Cancelling...' : cancelSuccess ? 'Cancelled!' : 'Confirm Cancellation'}
                            </button>
                        </div>
                </div>
            </div>
            )}

            {/* legacy cancel modal removed
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeCancelModal}
                    />

                    <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <span className="text-xl">⚠️</span>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">Cancel Booking</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 mb-4">
                                                Are you sure you want to cancel this booking?
                                            </p>

                                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                <p className="text-sm font-medium text-gray-900">{selectedBooking?.room_name || 'Unknown Room'}</p>
                                                <p className="text-sm text-gray-500">
                                                    {selectedBooking?.booking_date || 'Unknown Date'} |
                                                    {selectedBooking?.start_time || '?'} - {selectedBooking?.end_time || '?'}
                                                </p>
                                            </div>

                                            <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-1">
                                                Cancellation Reason <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                id="cancelReason"
                                                rows={3}
                                                className="shadow-sm focus:ring-red-500 focus:border-red-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                                                placeholder="Please provide a reason for cancellation..."
                                                value={cancelReason}
                                                onChange={(e) => setCancelReason(e.target.value)}
                                                maxLength={500}
                                            />
                                            <p className="text-xs text-gray-400 mt-1">{cancelReason?.length || 0}/500 characters</p>
                                        </div>

                                        {cancelError && (
                                            <p className="text-sm text-red-600 mt-2">{cancelError}</p>
                                        )}
                                        {cancelSuccess && (
                                            <p className="text-sm text-green-600 mt-2">{cancelSuccess}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    data-testid="confirm-cancel-btn"
                                    onClick={() => {
                                        console.log('Confirm cancel button clicked');
                                        handleCancelBooking();
                                    }}
                                    disabled={cancelLoading || cancelSuccess}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {cancelLoading ? 'Cancelling...' : cancelSuccess ? 'Cancelled!' : 'Confirm Cancellation'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeCancelModal}
                                    disabled={cancelLoading}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            */}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                            {currentView === 'available' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500 font-medium">For Date:</span>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="text-sm border-none bg-transparent font-bold text-blue-600 focus:ring-0 cursor-pointer"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="relative w-full sm:w-96">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Search by room name, amenities, capacity..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-500">Loading...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100">
                            <p className="text-red-600 mb-4">{error}</p>
                            <button onClick={fetchData} className="text-blue-600 font-bold hover:underline">
                                Try Again
                            </button>
                        </div>
                    ) : currentView !== 'available' ? (
                        filteredBookings.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No {currentView === 'reserved' ? 'reservations' : 'bookings'} found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredBookings.map((booking) => (
                                    <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{booking.room_name}</h3>
                                                <p className="text-sm text-gray-500">{booking.space}</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                                            <p className="flex items-center gap-2">
                                                <span className="font-medium">Date:</span> {booking.booking_date}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="font-medium">Time:</span> {booking.start_time} - {booking.end_time}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <span className="font-medium">Type:</span> {booking.type}
                                            </p>
                                        </div>

                                        {booking.status !== 'cancelled' && (
                                            <button
                                                type="button"
                                                id={`cancel-btn-${booking.id}`}
                                                title="Cancel this booking"
                                                onClick={() => openCancelModal(booking)}
                                                className="w-full mt-2 flex items-center justify-center px-4 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )
                    ) : filteredRooms.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No rooms found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredRooms.map((room) => (
                                <RoomCard key={room.id} room={room} onOpenModal={openModal} />
                            ))}
                        </div>
                    )}
                </main>

            <Footer />
        </div>
    );
};

export default Dashboard;
