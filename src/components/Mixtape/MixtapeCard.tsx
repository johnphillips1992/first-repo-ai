import React from 'react';
import { Link } from 'react-router-dom';
import { Mixtape } from '../../types';

interface MixtapeCardProps {
  mixtape: Mixtape;
  onDelete?: (id: string) => void;
}

const MixtapeCard: React.FC<MixtapeCardProps> = ({ mixtape, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition transform hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/mixtapes/${mixtape.id}`}>
        <div className="relative h-48 bg-gray-200">
          {mixtape.coverImage ? (
            <img 
              src={mixtape.coverImage} 
              alt={mixtape.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xl font-bold p-4 text-center">
              {mixtape.title}
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 truncate">
          <Link to={`/mixtapes/${mixtape.id}`} className="hover:text-blue-600">
            {mixtape.title}
          </Link>
        </h3>
        
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{mixtape.description}</p>
        
        <div className="mt-2 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {mixtape.tracks.length} {mixtape.tracks.length === 1 ? 'track' : 'tracks'}
          </span>
          
          <span className="text-xs text-gray-500">
            {new Date(mixtape.createdAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="mt-4 flex justify-between">
          <Link 
            to={`/mixtapes/${mixtape.id}`}
            className="text-blue-600 hover:underline text-sm"
          >
            Play Mixtape
          </Link>
          
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm('Are you sure you want to delete this mixtape?')) {
                  onDelete(mixtape.id);
                }
              }}
              className="text-red-600 hover:underline text-sm"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MixtapeCard;