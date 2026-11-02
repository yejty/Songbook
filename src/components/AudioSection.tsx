import React, { useState, useRef, useEffect } from 'react';
import { AudioRecord } from '../types';
import { saveAudioBlob, getAudioBlob, deleteAudioBlob } from '../services/db';
import { useI18n } from '../services/i18n';
import { Mic, Square, Play, Pause, Trash2, Upload, Volume2, RotateCcw, Repeat } from 'lucide-react';

interface AudioSectionProps {
  songId: string;
  audioRecords: AudioRecord[];
  onUpdateRecords: (records: AudioRecord[]) => void;
  readOnly?: boolean;
}

export const AudioSection: React.FC<AudioSectionProps> = ({
  songId,
  audioRecords,
  onUpdateRecords,
  readOnly = false,
}) => {
  const { lang, t } = useI18n();
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
    };
  }, []);

  // Sync playback speed and loop mode to audio element
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackSpeed;
      audioElementRef.current.loop = isLooping;
    }
  }, [playbackSpeed, isLooping]);

  // Start Live Microphone Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordId = `audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        
        // Save to IndexedDB
        await saveAudioBlob(recordId, audioBlob);

        const newRecord: AudioRecord = {
          id: recordId,
          name: `${lang === 'sk' ? 'Nahrávka' : 'Take'} #${audioRecords.length + 1} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          date: new Date().toLocaleDateString(),
          durationSeconds: recordSeconds,
          mimeType: 'audio/webm',
        };

        onUpdateRecords([...audioRecords, newRecord]);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      alert(lang === 'sk' ? 'Prístup k mikrofónu bol odmietnutý alebo nie je dostupný.' : 'Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // Upload external audio file (e.g. MP3, WAV, backing track)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const recordId = `audio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await saveAudioBlob(recordId, file);

    const newRecord: AudioRecord = {
      id: recordId,
      name: file.name.replace(/\.[^/.]+$/, ''),
      date: new Date().toLocaleDateString(),
      durationSeconds: 0,
      mimeType: file.type || 'audio/mpeg',
    };

    onUpdateRecords([...audioRecords, newRecord]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Play audio record from IndexedDB
  const playRecord = async (record: AudioRecord) => {
    if (activeRecordId === record.id && isPlaying) {
      audioElementRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (activeRecordId === record.id && !isPlaying && audioElementRef.current) {
      audioElementRef.current.play();
      setIsPlaying(true);
      return;
    }

    // Load Blob from IndexedDB
    const blob = await getAudioBlob(record.id);
    if (!blob) {
      alert(lang === 'sk' ? 'Zvukový súbor sa nepodarilo nájsť.' : 'Audio file not found in storage.');
      return;
    }

    const blobUrl = URL.createObjectURL(blob);

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(blobUrl);
    audioElementRef.current = audio;
    audio.playbackRate = playbackSpeed;
    audio.loop = isLooping;

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    audio.onended = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    audio.play();
    setActiveRecordId(record.id);
    setIsPlaying(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const deleteRecord = async (id: string) => {
    if (confirm(lang === 'sk' ? 'Naozaj zmazať túto zvukovú nahrávku?' : 'Delete this audio recording?')) {
      if (activeRecordId === id && audioElementRef.current) {
        audioElementRef.current.pause();
        setActiveRecordId(null);
        setIsPlaying(false);
      }
      await deleteAudioBlob(id);
      onUpdateRecords(audioRecords.filter((r) => r.id !== id));
    }
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 md:p-6 shadow-xl backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              {t.audioRecordings}
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                {audioRecords.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'sk'
                ? 'Hlasový záznamník skúšok a sprievodné podklady (100% offline v pamäti)'
                : 'Rehearsal recordings & backing tracks (stored 100% offline in IndexedDB)'}
            </p>
          </div>
        </div>

        {/* Recording / Upload Action buttons */}
        {!readOnly && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="Nahrať audio súbor (MP3, WAV, M4A)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{lang === 'sk' ? 'Pridať audio' : 'Upload Audio'}</span>
            </button>

            {isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/40 transition active:scale-95 cursor-pointer animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{formatSeconds(recordSeconds)} - {t.stopRecording}</span>
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-900/30 transition active:scale-95 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{t.recordAudio}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Active Audio Player Deck */}
      {activeRecordId && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-amber-300">
                {audioRecords.find((r) => r.id === activeRecordId)?.name}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              {/* Speed Controller */}
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400">{t.speed}:</span>
                {[0.75, 1.0, 1.25].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                      playbackSpeed === spd
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              {/* Loop Toggle */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`p-1 rounded-md transition cursor-pointer ${
                  isLooping ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                }`}
                title={lang === 'sk' ? 'Opakovať v slučke' : 'Loop playback'}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Time & Progress scrubber */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                {formatSeconds(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-[11px] font-mono text-slate-400 w-10">
                {formatSeconds(duration)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Audio Records List */}
      <div className="mt-4 space-y-2">
        {audioRecords.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
            <p>{lang === 'sk' ? 'Žiadne zvukové stopy. Nahrajte mikrofónom prvý nápad alebo podklad.' : 'No audio tracks. Record a rehearsal take with your microphone or upload audio.'}</p>
          </div>
        ) : (
          audioRecords.map((rec) => {
            const isThisActive = activeRecordId === rec.id;
            return (
              <div
                key={rec.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition ${
                  isThisActive
                    ? 'bg-slate-950 border-amber-500/40 text-slate-100 shadow'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => playRecord(rec)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer ${
                      isThisActive && isPlaying
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                    }`}
                  >
                    {isThisActive && isPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div>
                    <h5 className="text-xs font-semibold text-slate-200">{rec.name}</h5>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{rec.date}</span>
                      {rec.durationSeconds > 0 && <span>• {formatSeconds(rec.durationSeconds)}</span>}
                    </div>
                  </div>
                </div>

                {!readOnly && (
                  <button
                    onClick={() => deleteRecord(rec.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Zmazať nahrávku"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
