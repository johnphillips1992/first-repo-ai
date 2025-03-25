import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMixtape } from '../hooks/useMixtape';
import { useAuth } from '../hooks/useAuth';
import MixtapeCard from '../components/Mixtape/MixtapeCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { publicMixtapes, userMixtapes, loading, error } = useMixtape();
  const [selectedTab, setSelectedTab] = useState<'featured' | 'your'>('featured');

  const displayedMixtapes = selectedTab === 'featured' 
    ? publicMixtapes 
    : userMixtapes;

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <section className="mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Welcome to Mixtape Memory Box</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create, share, and listen to digital mixtapes. Relive the nostalgic 
            experience of handcrafted playlists with a modern twist.
          </p>
          {user ? (
            <Link
              to="/create"
              className="mt-6 inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-full hover:from-purple-700 hover:to-blue-600 shadow-lg"
            >
              Create Your Mixtape
            </Link>
          ) : (
            <Link
              to="/register"
              className="mt-6 inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold rounded-full hover:from-purple-700 hover:to-blue-600 shadow-lg"
            >
              Get Started
            </Link>
          )}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Discover Mixtapes</h2>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`px-4 py-2 rounded-md ${
                selectedTab === 'featured'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-600'
              }`}
              onClick={() => setSelectedTab('featured')}
            >
              Featured
            </button>
            
            {user && (
              <button
                className={`px-4 py-2 rounded-md ${
                  selectedTab === 'your'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600'
                }`}
                onClick={() => setSelectedTab('your')}
              >
                Your Mixtapes
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {displayedMixtapes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500 mb-4">
              {selectedTab === 'featured'
                ? 'No featured mixtapes available yet.'
                : 'You haven\'t created any mixtapes yet.'}
            </p>
            {selectedTab === 'your' && (
              <Link
                to="/create"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Your First Mixtape
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedMixtapes.map(mixtape => (
              <MixtapeCard
                key={mixtape.id}
                mixtape={mixtape}
                onDelete={selectedTab === 'your' ? undefined : undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;