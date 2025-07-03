import React, { useState } from 'react';
import { X, Lock, User, Users } from 'lucide-react';
import { UserProfile } from '../types';
import { PasswordModal } from './PasswordModal';

interface ProfileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: UserProfile[];
  onSelectProfile: (profileId: string) => void;
}

export function ProfileSelectionModal({ 
  isOpen, 
  onClose, 
  profiles, 
  onSelectProfile 
}: ProfileSelectionModalProps) {
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  const handleProfileClick = (profile: UserProfile) => {
    if (profile.pin) {
      setSelectedProfile(profile);
      setShowPinModal(true);
    } else {
      onSelectProfile(profile.id);
      onClose();
    }
  };

  const handlePinSuccess = () => {
    if (selectedProfile) {
      onSelectProfile(selectedProfile.id);
      setShowPinModal(false);
      setSelectedProfile(null);
      onClose();
    }
  };

  const handlePinClose = () => {
    setShowPinModal(false);
    setSelectedProfile(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in">
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Select Profile
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="p-6">
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-6">
              Choose a profile to continue using ZenTasks
            </p>

            <div className="space-y-3">
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileClick(profile)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-lg font-medium">
                      {profile.avatar}
                    </div>
                    <div className="text-left">
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                        {profile.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          {profile.isTaskCompetitor ? 'Task Competitor' : 'Regular User'}
                        </p>
                        {profile.pin && (
                          <div className="flex items-center space-x-1 px-2 py-1 bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400 text-xs rounded-full">
                            <Lock className="w-3 h-3" />
                            <span>PIN Protected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {profile.pin && (
                      <Lock className="w-4 h-4 text-warning-500" />
                    )}
                    <User className="w-4 h-4 text-neutral-400 group-hover:text-primary-500" />
                  </div>
                </button>
              ))}
            </div>

            {profiles.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-16 h-16 mx-auto mb-4 text-neutral-300 dark:text-neutral-600" />
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  No Profiles Available
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Please contact an administrator to create profiles.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      <PasswordModal
        isOpen={showPinModal}
        onClose={handlePinClose}
        onSuccess={handlePinSuccess}
        title={`Enter PIN for ${selectedProfile?.name}`}
        description={`This profile is protected with a PIN. Enter the correct PIN to access ${selectedProfile?.name}'s tasks.`}
        placeholder="Enter PIN..."
        expectedPassword={selectedProfile?.pin}
      />
    </>
  );
}