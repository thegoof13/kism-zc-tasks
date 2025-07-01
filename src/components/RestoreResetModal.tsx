import React from 'react';
import { X, RotateCcw, RefreshCw } from 'lucide-react';
import { Task } from '../types';
import { useApp } from '../contexts/AppContext';

interface RestoreResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
}

export function RestoreResetModal({ isOpen, onClose, task }: RestoreResetModalProps) {
  const { dispatch } = useApp();

  const handleRestore = () => {
    // Restore: uncheck and remove completion record
    dispatch({
      type: 'RESTORE_TASK',
      taskId: task.id,
    });
    onClose();
  };

  const handleReset = () => {
    // Reset: just uncheck, keep completion record
    dispatch({
      type: 'RESET_TASK',
      taskId: task.id,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-neutral-800 rounded-2xl shadow-xl animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Restore Task
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            How would you like to restore "{task.title}"?
          </p>

          <div className="space-y-3">
            <button
              onClick={handleRestore}
              className="w-full flex items-center space-x-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                  Restore
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Uncheck and remove all completion history
                </p>
              </div>
            </button>

            <button
              onClick={handleReset}
              className="w-full flex items-center space-x-3 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200"
            >
              <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/20 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-warning-600 dark:text-warning-400" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                  Reset
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Uncheck but keep completion history
                </p>
              </div>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}