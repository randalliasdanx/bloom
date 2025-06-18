"use client";

import React, { useState, useMemo } from 'react';
import { Volume2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '../../tts-test/components/ui/button';
import {
  ApiEndpointSelector,
  TextInput,
  AdvancedSettings,
  AudioPlayer
} from '../../tts-test/components/tts';
import VoiceLibrary from '../../tts-test/components/VoiceLibrary';
import AudioHistory from '../../tts-test/components/AudioHistory';
import StatusHeader from '../../tts-test/components/StatusHeader';
import StatusStatisticsPanel from '../../tts-test/components/StatusStatisticsPanel';
import { createTTSService } from '../../tts-test/services/tts';
import { useApiEndpoint } from '../../tts-test/hooks/useApiEndpoint';
import { useVoiceLibrary } from '../../tts-test/hooks/useVoiceLibrary';
import { useAudioHistory } from '../../tts-test/hooks/useAudioHistory';
import { useAdvancedSettings } from '../../tts-test/hooks/useAdvancedSettings';
import { useTextInput } from '../../tts-test/hooks/useTextInput';
import { useStatusMonitoring } from '../../tts-test/hooks/useStatusMonitoring';

interface TTSSectionProps {
  extractedText: string;
  onTextChange: (text: string) => void;
}

export default function TTSSection({ extractedText, onTextChange }: TTSSectionProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);

  // API endpoint management
  const { apiBaseUrl, updateApiBaseUrl } = useApiEndpoint();

  // Text input management with persistence
  const { text, updateText, clearText, hasText } = useTextInput();

  // Initialize text with extractedText
  React.useEffect(() => {
    updateText(extractedText);
  }, [extractedText]);

  // Keep parent's text in sync
  React.useEffect(() => {
    onTextChange(text);
  }, [text, onTextChange]);

  // Advanced settings management with persistence
  const {
    exaggeration,
    cfgWeight,
    temperature,
    updateExaggeration,
    updateCfgWeight,
    updateTemperature,
    resetToDefaults,
    isDefault
  } = useAdvancedSettings();

  // Voice library management
  const {
    voices,
    selectedVoice,
    setSelectedVoice,
    addVoice,
    deleteVoice,
    renameVoice,
    isLoading: voicesLoading
  } = useVoiceLibrary();

  // Audio history management
  const {
    audioHistory,
    addAudioRecord,
    deleteAudioRecord,
    renameAudioRecord,
    clearHistory,
    isLoading: historyLoading
  } = useAudioHistory();

  // Create TTS service with current API base URL
  const ttsService = useMemo(() => createTTSService(apiBaseUrl), [apiBaseUrl]);

  // Status monitoring with real-time updates
  const {
    progress,
    statistics,
    isProcessing,
    hasError: statusHasError,
    isLoadingStats
  } = useStatusMonitoring(apiBaseUrl);

  const { data: health, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['health', apiBaseUrl],
    queryFn: ttsService.getHealth,
    refetchInterval: 30000
  });

  // Fetch API info (including version) periodically
  const { data: apiInfo } = useQuery({
    queryKey: ['apiInfo', apiBaseUrl],
    queryFn: async () => {
      const response = await fetch(`${apiBaseUrl}/info`);
      if (!response.ok) throw new Error('Failed to fetch API info');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    retry: false
  });

  const generateMutation = useMutation({
    mutationFn: ttsService.generateSpeech,
    onSuccess: async (audioBlob) => {
      // Clean up previous audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      // Create new audio URL
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Save to audio history
      try {
        await addAudioRecord(
          audioBlob,
          {
            text,
            exaggeration,
            cfgWeight,
            temperature,
            voiceId: selectedVoice?.id,
            voiceName: selectedVoice?.name
          }
        );
      } catch (error) {
        console.error('Failed to save audio record:', error);
      }
    },
    onError: (error) => {
      console.error('TTS generation failed:', error);
      alert('Failed to generate speech. Please try again.');
    }
  });

  const handleGenerate = () => {
    if (!text.trim()) {
      alert('Please enter some text to convert to speech.');
      return;
    }

    generateMutation.mutate({
      input: text,
      exaggeration,
      cfg_weight: cfgWeight,
      temperature,
      voice_file: selectedVoice?.file || undefined
    });
  };

  return (
    <div className="bg-white/80 rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4 text-black" style={{ fontFamily: 'var(--font-arvo)' }}>
        Step 2: Review and Generate Audio
      </h2>

      <div className="w-full flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center justify-center gap-2 w-full">
          <button
            onClick={() => setShowStatistics(!showStatistics)}
            className="px-3 py-1 text-xs bg-black/10 hover:bg-black/20 text-black rounded-full transition-colors duration-300"
          >
            {showStatistics ? 'Hide Stats' : 'Show Stats'}
          </button>
          {/* Statistics Panel (collapsible) */}
          {showStatistics && (
            <StatusStatisticsPanel
              statistics={statistics}
              isLoading={isLoadingStats}
              hasError={statusHasError}
            />
          )}
        </div>

        <div className="max-w-2xl mx-auto gap-4 flex flex-col w-full text-black">
          {/* API Endpoint Selector */}
          <div className="">
            <ApiEndpointSelector
              apiBaseUrl={apiBaseUrl}
              onUrlChange={updateApiBaseUrl}
            />
          </div>

          {/* Text Input */}
          <TextInput
            value={text}
            onChange={updateText}
            onClear={clearText}
            hasText={hasText}
          />

          {/* Voice Library */}
          <VoiceLibrary
            voices={voices}
            selectedVoice={selectedVoice}
            onVoiceSelect={setSelectedVoice}
            onAddVoice={addVoice}
            onDeleteVoice={deleteVoice}
            onRenameVoice={renameVoice}
            isLoading={voicesLoading}
          />

          {/* Advanced Settings */}
          <AdvancedSettings
            showAdvanced={showAdvanced}
            onToggle={() => setShowAdvanced(!showAdvanced)}
            exaggeration={exaggeration}
            onExaggerationChange={updateExaggeration}
            cfgWeight={cfgWeight}
            onCfgWeightChange={updateCfgWeight}
            temperature={temperature}
            onTemperatureChange={updateTemperature}
            onResetToDefaults={resetToDefaults}
            isDefault={isDefault}
          />

          {/* Current Voice Indicator */}
          {selectedVoice && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-primary">
                <Volume2 className="w-4 h-4" />
                <span>Using voice: <strong>{selectedVoice.name}</strong></span>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!text.trim() || !selectedVoice || generateMutation.isPending}
            className="w-full py-6 text-lg font-semibold"
          >
            {generateMutation.isPending ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Volume2 className="w-5 h-5" />
                <span>Generate Speech</span>
              </div>
            )}
          </Button>

          {/* Audio Player */}
          {audioUrl && (
            <AudioPlayer
              audioUrl={audioUrl}
            />
          )}

          {/* Audio History */}
          <AudioHistory
            audioHistory={audioHistory}
            onDeleteAudioRecord={deleteAudioRecord}
            onRenameAudioRecord={renameAudioRecord}
            onClearHistory={clearHistory}
            onRestoreSettings={(settings) => {
              updateExaggeration(settings.exaggeration);
              updateCfgWeight(settings.cfgWeight);
              updateTemperature(settings.temperature);
            }}
            onRestoreText={updateText}
            isLoading={historyLoading}
          />
        </div>
      </div>
    </div>
  );
} 