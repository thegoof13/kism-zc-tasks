import React, { useState } from 'react';
import { X, Lock, User, Users, Eye } from 'lucide-react';
import { UserProfile } from '../types';
import { PasswordModal } from './PasswordModal';
import { useApp } from '../contexts/AppContext';

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
  const { dispatch } = useApp();
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isViewOnlySelection, setIsViewOnlySelection] = useState(false);

  const handleProfileClick = (profile: UserProfile, viewOnly: boolean = false) => {
    if (profile.pin && !viewOnly) {
      setSelectedProfile(profile);
      setIsViewOnlySelection(false);
      setShowPinModal(true);
    } else {
      // Enable view only mode if selected
      if (viewOnly) {
        dispatch({
          type: 'UPDATE_SETTINGS',
          updates: { viewOnlyMode: true }
        });
      } else {
        dispatch({
          type: 'UPDATE_SETTINGS',
          updates: { viewOnlyMode: false }
        });
      }
      
      onSelectProfile(profile.id);
      onClose();
    }
  };

  const handleViewOnlyClick = (profile: UserProfile) => {
    setIsViewOnlySelection(true);
    handleProfileClick(profile, true);
  };

  const handlePinSuccess = () => {
    if (selectedProfile) {
      // Normal access - disable view only mode
      dispatch({
        type: 'UPDATE_SETTINGS',
        updates: { viewOnlyMode: false }
      });
      
      onSelectProfile(selectedProfile.id);
      setShowPinModal(false);
      setSelectedProfile(null);
      onClose();
    }
  };

  const handlePinClose = () => {
    setShowPinModal(false);
    setSelectedProfile(null);
    setIsViewOnlySelection(false);
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
                <div key={profile.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                  {/* Main Profile Button */}
                  <button
                    onClick={() => handleProfileClick(profile)}
                    className="w-full flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200 group"
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

                  {/* View Only Button - Only show for PIN protected profiles */}
                  {profile.pin && (
                    <div className="border-t border-neutral-200 dark:border-neutral-700">
                      <button
                        onClick={() => handleViewOnlyClick(profile)}
                        className="w-full flex items-center justify-center space-x-2 p-3 bg-neutral-50 dark:bg-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors duration-200 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-medium">View Only</span>
                      </button>
                    </div>
                  )}
                </div>
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

            {/* View Only Mode Info */}
            <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    View Only Mode
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Access PIN-protected profiles in read-only mode. You can view tasks but cannot check, edit, or delete anything.
                  </p>
                </div>
              </div>
            </div>
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