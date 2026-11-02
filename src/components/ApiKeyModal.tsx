/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { testOpenWeatherMapKey, saveOwmApiKey, getSavedOwmApiKey } from '../services/weatherService';
import { X, KeyRound, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onKeyUpdated }) => {
  const [apiKey, setApiKey] = useState<string>(getSavedOwmApiKey());
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen) return null;

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setStatusMessage({ text: 'Please enter an OpenWeatherMap API key to test.', type: 'error' });
      return;
    }
    setIsTesting(true);
    setStatusMessage(null);

    const res = await testOpenWeatherMapKey(apiKey.trim());
    setIsTesting(false);

    if (res.success) {
      setStatusMessage({ text: res.message, type: 'success' });
    } else {
      setStatusMessage({ text: res.message, type: 'error' });
    }
  };

  const handleSave = () => {
    saveOwmApiKey(apiKey.trim());
    setStatusMessage({ text: 'API key saved! Refreshing live forecast feed...', type: 'success' });
    setTimeout(() => {
      onKeyUpdated();
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setApiKey('');
    saveOwmApiKey('');
    setStatusMessage({ text: 'Custom key removed. Reverting to live Open-Meteo provider.', type: 'info' });
    setTimeout(() => {
      onKeyUpdated();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 select-none backdrop-blur-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/20 flex items-center justify-center text-sky-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-display">
                OpenWeatherMap Integration
              </h2>
              <span className="text-xs text-slate-400">Configure custom API credentials</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close API Key Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            By default, Aetheria operates out of the box using our reliable live meteorological feed. If you have an{' '}
            <span className="text-sky-400 font-medium">OpenWeatherMap</span> account, enter your API key below to query directly from your personal quota.
          </p>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              OpenWeatherMap API Key
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="e.g. 8a3f81c9b20743b12984e..."
              className="w-full px-3.5 py-2.5 bg-slate-950 text-slate-100 placeholder-slate-500 border border-slate-700 rounded-xl focus:outline-none focus:border-sky-400 font-mono text-xs"
            />
          </div>

          {/* Verification Status Banner */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-red-950/40 border-red-500/40 text-red-300'
                  : 'bg-sky-950/40 border-sky-500/40 text-sky-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
              )}
              <span className="text-xs leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleTestKey}
              disabled={isTesting}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 font-medium transition-colors disabled:opacity-50"
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" /> : null}
              <span>Test Key</span>
            </button>

            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl shadow transition-colors"
            >
              Save Credentials
            </button>

            {apiKey && (
              <button
                onClick={handleClear}
                className="px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
                title="Remove Key"
              >
                Clear
              </button>
            )}
          </div>

          <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80">
            * Note: Newly generated OpenWeatherMap keys typically require 10 to 120 minutes to activate on their servers. If you encounter a 401 error, our automatic fallback will continue delivering real-time forecasts seamlessly.
          </div>
        </div>
      </div>
    </div>
  );
};
