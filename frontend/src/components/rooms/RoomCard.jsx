import React from 'react';
import { Users, DoorOpen, Bookmark } from 'lucide-react';
import trainingHall from '../../assets/rooms/training-hall.jpg';
import creativeSpace from '../../assets/rooms/creative-space.jpg';
import roomPlaceholder from '../../assets/ui/room-placeholder.webp';

const RoomCard = ({ room, onOpenModal }) => {
    // Map room names/slugs to imported images
    const getRoomImage = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('training hall')) return trainingHall;
        if (lowerName.includes('creative space')) return creativeSpace;
        return roomPlaceholder;
    };

    const imageSrc = getRoomImage(room.name);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Room Thumbnail */}
            <div className="relative h-48 w-full overflow-hidden">
                <img 
                    src={imageSrc} 
                    alt={room.name} 
                    className="w-full h-full object-cover rounded-t-xl transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                        e.target.src = roomPlaceholder;
                    }}
                />
                <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        room.status === 'Available' ? 'bg-green-100 text-green-800' :
                        room.status === 'Reserved' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {room.status}
                    </span>
                </div>
            </div>

            <div className="p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{room.name}</h3>
                    <p className="text-sm text-gray-500">{room.space}</p>
                </div>

                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Capacity: {room.capacity} people</span>
                </div>

                <div className="mb-6">
                    <p className="text-sm font-medium text-gray-900 mb-2">Amenities:</p>
                    <div className="flex flex-wrap gap-2">
                        {room.amenities?.map((amenity) => (
                            <span key={amenity} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                {amenity}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => onOpenModal(room, 'booking')}
                        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={room.status !== 'Available'}
                    >
                        <DoorOpen className="w-4 h-4 mr-2" />
                        {room.status === 'Available' ? 'Book Room' : room.status}
                    </button>
                    <button
                        onClick={() => onOpenModal(room, 'reservation')}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                        <Bookmark className="w-4 h-4 mr-2" />
                        Reserve for Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoomCard;
