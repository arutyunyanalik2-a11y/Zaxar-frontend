import React, { useState, useRef, useEffect } from 'react';
import { askAssistant } from "./assistant";
import { GoPaperAirplane } from "react-icons/go";
import {
    FaMicrophone, FaStop, FaBars, FaTimes,
    FaPlus, FaRegCommentAlt, FaTrashAlt,
    FaRegCopy, FaCheck,
    FaRegThumbsUp, FaThumbsUp, FaRegThumbsDown, FaThumbsDown,
    FaVolumeUp, FaVolumeMute, FaPaperclip,
    FaCog,
    FaPlay, FaPause, FaMusic, FaImage, FaDownload
} from "react-icons/fa";
import './style.css';
import zaxar from './Image/zaxar.png';
// import { Link } from "react-router-dom";

export default function Chat() {
    const [input, setInput] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [playingId, setPlayingId] = useState(null);

    // Состояния для файлов
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Состояния: Режим генерации и индикатор генерации изображения
    const [isImageMode, setIsImageMode] = useState(false);
    const [isImageGenerating, setIsImageGenerating] = useState(false);

    // Состояния: Настройки, тема и меню вложений
    const [theme, setTheme] = useState(() => localStorage.getItem('zaxar_theme') || 'dark');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

    const attachMenuRef = useRef(null);

    const [chats, setChats] = useState(() => {
        const savedChats = localStorage.getItem('zahar_ai_sessions');
        if (savedChats) {
            const parsed = JSON.parse(savedChats);
            if (parsed.length > 0) return parsed;
        }
        return [{
            id: Date.now().toString(),
            title: 'Новый диалог',
            messages: [{ id: 'welcome', sender: 'ai', text: 'Привет! Я Захар, твой личный ИИ-помощник. Чем могу помочь?', audioUrl: null, feedback: null }]
        }];
    });

    const [activeChatId, setActiveChatId] = useState(chats[0]?.id);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    const audioRef = useRef(null);

    // Закрытие меню вложений при клике вне его области
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
                setIsAttachMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        localStorage.setItem('zaxar_theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('zahar_ai_sessions', JSON.stringify(chats));
    }, [chats]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats, activeChatId, isLoading, isImageGenerating]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (audioRef.current) audioRef.current.pause();
        };
    }, []);

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
    const messages = activeChat?.messages || [];

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const toggleVoice = (audioUrl, id) => {
        if (!audioUrl) {
            alert("Для этого сообщения аудио недоступно.");
            return;
        }

        if (playingId === id) {
            if (audioRef.current) audioRef.current.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) audioRef.current.pause();
            const uniqueAudioUrl = `${audioUrl}?t=${Date.now()}`;
            const audio = new Audio(uniqueAudioUrl);
            audioRef.current = audio;

            audio.onended = () => setPlayingId(null);
            audio.onerror = () => {
                alert("Не удалось загрузить аудиофайл.");
                setPlayingId(null);
            };

            audio.play()
                .then(() => setPlayingId(id))
                .catch(err => console.error("Ошибка проигрывания:", err));
        }
    };

    const handleCopy = (text, id) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 1500);
            });
    };


    const handleDownloadImage = async (imageData, fileName = 'zaxar-image.png') => {
        try {
            // Если это data URL (base64) — качаем напрямую
            if (imageData.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = imageData;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // Если это обычная ссылка (URL) — сначала получаем blob
            const response = await fetch(imageData);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Ошибка скачивания изображения:', err);
            alert('Не удалось скачать изображение.');
        }
    };

    const handleFeedback = (msgId, type) => {
        setChats(prev => prev.map(chat => {
            if (chat.id === activeChatId) {
                const updatedMessages = chat.messages.map(msg => {
                    if (msg.id === msgId) {
                        return { ...msg, feedback: msg.feedback === type ? null : type };
                    }
                    return msg;
                });
                return { ...chat, messages: updatedMessages };
            }
            return chat;
        }));
    };

    const createNewChat = () => {
        const newChat = {
            id: Date.now().toString(),
            title: 'Новый диалог',
            messages: [{ id: 'welcome', sender: 'ai', text: 'Привет! Я Захар, твой личный ИИ-помощник. Слушаю тебя.', audioUrl: null, feedback: null }]
        };
        setChats(prev => [newChat, ...prev]);
        setActiveChatId(newChat.id);
        if (window.innerWidth <= 768) setIsSidebarOpen(false);
    };

    const deleteChat = (e, id) => {
        e.stopPropagation();
        setChats(prev => {
            const updated = prev.filter(c => c.id !== id);
            if (updated.length === 0) {
                const newChat = {
                    id: Date.now().toString(),
                    title: 'Новый диалог',
                    messages: [{ id: 'welcome', sender: 'ai', text: 'Привет! Я Захар. Чем могу помочь?', audioUrl: null, feedback: null }]
                };
                setActiveChatId(newChat.id);
                return [newChat];
            }
            if (id === activeChatId) setActiveChatId(updated[0].id);
            return updated;
        });
    };

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current.stop();
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Твой браузер не поддерживает голосовой ввод.");
            return;
        }

        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.lang = 'ru-RU';
            recognition.continuous = false;
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                setInput(prev => prev + (prev.length > 0 ? " " : "") + transcript);
            };
            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);
            recognitionRef.current = recognition;
        }
        try { recognitionRef.current.start(); } catch (e) { console.error(e); }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSend = async () => {
        if ((!input.trim() && !selectedFile) || isLoading || isImageGenerating) return;
        if (isListening) recognitionRef.current.stop();

        const userText = input.trim();
        setInput('');

        const userMessage = {
            id: Date.now() + '-user',
            sender: 'user',
            text: userText,
            image: filePreview,
            feedback: null
        };

        clearFile();

        setChats(prev => prev.map(chat => {
            if (chat.id === activeChatId) {
                const isFirstMessage = chat.messages.length === 1;
                const titleText = userText || "Картинка";
                const newTitle = isFirstMessage ? titleText.slice(0, 22) + (titleText.length > 22 ? '...' : '') : chat.title;
                return { ...chat, title: newTitle, messages: [...chat.messages, userMessage] };
            }
            return chat;
        }));

        if (isImageMode) {
            setIsImageGenerating(true);
            setIsImageMode(false);

            try {
                const response = await fetch("https://zaxar-backend.onrender.com/api/generate-image", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: userText })
                });

                const data = await response.json();

                if (data.image) {
                    const aiMessage = {
                        id: Date.now() + '-img',
                        sender: 'ai',
                        text: `Изображение по запросу: "${userText}"`,
                        image: data.image,
                        feedback: null
                    };

                    setChats(prev => prev.map(chat =>
                        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, aiMessage] } : chat
                    ));
                } else {
                    const errorMessage = { id: Date.now() + '-err', sender: 'ai', text: "Не удалось сгенерировать изображение: " + (data.error || "Внутренняя ошибка сервера"), audioUrl: null, feedback: null };
                    setChats(prev => prev.map(chat =>
                        chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
                    ));
                }
            } catch (error) {
                console.error("Ошибка сети:", error);
                const errorMessage = { id: Date.now() + '-err', sender: 'ai', text: "Ошибка подключения к серверу генерации изображений.", audioUrl: null, feedback: null };
                setChats(prev => prev.map(chat =>
                    chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
                ));
            } finally {
                setIsImageGenerating(false);
            }

        } else {
            setIsLoading(true);
            try {
                const currentChat = chats.find(c => c.id === activeChatId) || chats[0];
                const chatHistory = [...currentChat.messages, userMessage].map(msg => ({
                    role: msg.sender === 'ai' ? 'assistant' : 'user',
                    content: msg.text,
                    image: msg.image
                }));

                const aiData = await askAssistant(chatHistory);
                const aiMessage = {
                    id: Date.now() + '-ai',
                    sender: 'ai',
                    text: aiData.answer,
                    audioUrl: aiData.audio_url,
                    feedback: null
                };

                setChats(prev => prev.map(chat =>
                    chat.id === activeChatId ? { ...chat, messages: [...chat.messages, aiMessage] } : chat
                ));
            } catch (error) {
                const errorMessage = { id: Date.now() + '-err', sender: 'ai', text: "Произошла ошибка при получении ответа от текстовой модели.", audioUrl: null, feedback: null };
                setChats(prev => prev.map(chat =>
                    chat.id === activeChatId ? { ...chat, messages: [...chat.messages, errorMessage] } : chat
                ));
            } finally {
                setIsLoading(false);
            }
        }
    };

    const [isMusicPlaying, setIsMusicPlaying] = useState(false);
    const [musicFileName, setMusicFileName] = useState('');
    const [musicUrl, setMusicUrl] = useState(null);

    const musicRef = useRef(null);
    const audioInputRef = useRef(null);

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (musicUrl) {
            URL.revokeObjectURL(musicUrl);
        }

        const newUrl = URL.createObjectURL(file);
        setMusicUrl(newUrl);
        setMusicFileName(file.name);
        setIsMusicPlaying(true);
    };

    useEffect(() => {
        if (musicUrl) {
            if (!musicRef.current) {
                musicRef.current = new Audio(musicUrl);
                musicRef.current.loop = true;
                musicRef.current.volume = 0.4;
            } else {
                musicRef.current.src = musicUrl;
            }

            if (isMusicPlaying) {
                musicRef.current.play().catch(err => console.error("Ошибка автозапуска:", err));
            }
        }
    }, [musicUrl]);

    useEffect(() => {
        if (!musicRef.current) return;

        if (isMusicPlaying) {
            musicRef.current.play().catch(err => console.error("Ошибка воспроизведения:", err));
        } else {
            musicRef.current.pause();
        }
    }, [isMusicPlaying]);

    return (
        <>
            <div className={`chat-wrapper ${isSidebarOpen ? 'sidebar-expanded' : 'sidebar-collapsed'} theme-${theme}`}>
                {isSettingsOpen && (
                    <div className="settings-overlay" onClick={() => setIsSettingsOpen(false)}>
                        <div className="settings-modal" onClick={e => e.stopPropagation()}>
                            <div className="settings-header">
                                <h3>Настройки интерфейса</h3>
                                <button className="modal-close-btn" onClick={() => setIsSettingsOpen(false)}>
                                    <FaTimes size={16} />
                                </button>
                            </div>
                            <div className="settings-body">
                                <div className="setting-row">
                                    <span className="setting-label">Тема оформления:</span>
                                    <div className="theme-options-container">
                                        <button
                                            className={`theme-picker-btn light-pick ${theme === 'light' ? 'active-theme' : ''}`}
                                            onClick={() => setTheme('light')}
                                        >
                                            Светлая
                                        </button>
                                        <button
                                            className={`theme-picker-btn dark-pick ${theme === 'dark' ? 'active-theme' : ''}`}
                                            onClick={() => setTheme('dark')}
                                        >
                                            Тёмная
                                        </button>
                                    </div>
                                </div>

                                <hr className="settings-divider" />

                                <div className="setting-row">
                                    <span className="setting-label">Фоновая музыка:</span>

                                    <input
                                        type="file"
                                        accept="audio/*"
                                        ref={audioInputRef}
                                        style={{ display: 'none' }}
                                        onChange={handleAudioUpload}
                                    />

                                    <div className="music-block-control" style={{ flexDirection: 'column', gap: '12px', alignItems: 'stretch' }}>
                                        <button
                                            className="theme-picker-btn"
                                            onClick={() => audioInputRef.current.click()}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                                        >
                                            <FaMusic size={12} />
                                            {musicFileName ? "Выбрать другой файл" : "Загрузить трек с устройства"}
                                        </button>

                                        {musicUrl && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
                                                <button
                                                    className={`music-action-btn ${isMusicPlaying ? 'music-playing' : ''}`}
                                                    onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                                                >
                                                    {isMusicPlaying ? <FaPause size={12} /> : <FaPlay size={12} />}
                                                    <span>{isMusicPlaying ? "Пауза" : "Играть"}</span>
                                                </button>

                                                <div className={`css-equalizer ${isMusicPlaying ? 'active' : ''}`}>
                                                    <span className="eq-bar bar-1"></span>
                                                    <span className="eq-bar bar-2"></span>
                                                    <span className="eq-bar bar-3"></span>
                                                    <span className="eq-bar bar-4"></span>
                                                    <span className="eq-bar bar-5"></span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {musicFileName && (
                                        <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', wordBreak: 'break-all', display: 'block' }}>
                                            🎵 {musicFileName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <aside className="chat-sidebar">
                    <div className="sidebar-header">
                        <button className="new-chat-btn" onClick={createNewChat}>
                            <FaPlus size={14} />
                            <span>Новый чат</span>
                        </button>
                        <button className="close-menu-btn" onClick={() => setIsSidebarOpen(false)}>
                            <FaTimes size={18} />
                        </button>
                    </div>

                    <div className="sidebar-history-title">История диалогов</div>
                    <nav className="sidebar-menu">
                        {chats.map(chat => (
                            <div key={chat.id} className={`history-item ${chat.id === activeChatId ? 'active' : ''}`} onClick={() => setActiveChatId(chat.id)}>
                                <FaRegCommentAlt className="history-icon" />
                                <span className="history-text">{chat.title}</span>
                                <button className="delete-chat-btn" onClick={(e) => deleteChat(e, chat.id)} title="Удалить чат">
                                    <FaTrashAlt size={12} />
                                </button>
                            </div>
                        ))}
                    </nav>
                </aside>

                <div className="chat-box">
                    <div className='chat-header'>
                        <div className="header-left-zone">
                            {!isSidebarOpen && (
                                <button className="menu-toggle-btn" onClick={() => setIsSidebarOpen(true)}>
                                    <FaBars size={20} />
                                </button>
                            )}
                            <img className='avatar-status' src={zaxar} alt="Захар" />
                            <div className="header-titles">
                                <h2>Захар</h2>
                                <span className="ai-subtitle">ИИ-ассистент Voxel Rivo</span>
                            </div>
                        </div>
                        <div className="header-right-zone">
                            <button className="header-settings-btn" onClick={() => setIsSettingsOpen(true)} title="Настройки">
                                <FaCog size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="chat-messages-area">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`message-row ${msg.sender}`}>
                                <div className="message-bubble">
                                    {msg.image && (
                                        <div className="image-wrapper" style={{ position: 'relative' }}>
                                            <img src={msg.image} alt="Сгенерированное или вложенное" className="message-attached-img" />
                                            {msg.sender === 'ai' && (
                                                <button
                                                    className="download-img-btn"
                                                    onClick={() => handleDownloadImage(msg.image, `zaxar-${msg.id}.png`)}
                                                    title="Скачать изображение"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '8px',
                                                        right: '8px',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        padding: '8px',
                                                        cursor: 'pointer',
                                                        color: '#fff',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <FaDownload size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {msg.text && <p>{msg.text}</p>}

                                    <div className="message-actions-bar">
                                        {msg.sender === 'ai' && (
                                            <>
                                                <button
                                                    className={`action-msg-btn voice-btn ${playingId === msg.id ? 'active-voice' : ''}`}
                                                    onClick={() => toggleVoice(msg.audioUrl, msg.id)}
                                                    disabled={!msg.audioUrl}
                                                    title={playingId === msg.id ? "Остановить" : "Прослушать голос"}
                                                >
                                                    {playingId === msg.id ? <FaVolumeMute size={13} color="#eab308" /> : <FaVolumeUp size={13} />}
                                                </button>

                                                <button className={`action-msg-btn ${msg.feedback === 'like' ? 'active-like' : ''}`} onClick={() => handleFeedback(msg.id, 'like')} title="Полезный ответ">
                                                    {msg.feedback === 'like' ? <FaThumbsUp size={11} /> : <FaRegThumbsUp size={11} />}
                                                </button>
                                                <button className={`action-msg-btn ${msg.feedback === 'dislike' ? 'active-dislike' : ''}`} onClick={() => handleFeedback(msg.id, 'dislike')} title="Плохой ответ">
                                                    {msg.feedback === 'dislike' ? <FaThumbsDown size={11} /> : <FaRegThumbsDown size={11} />}
                                                </button>
                                            </>
                                        )}
                                        <button className="action-msg-btn copy-btn" onClick={() => handleCopy(msg.text, msg.id)} title="Копировать текст">
                                            {copiedId === msg.id ? <FaCheck size={11} color="#22c55e" /> : <FaRegCopy size={11} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Индикатор стандартной загрузки */}
                        {isLoading && (
                            <div className="message-row ai">
                                <img className='dumAI' src={zaxar} alt="" />
                                <span className='dumSpan'>пожалуйста подождите, думаю...</span>
                            </div>
                        )}

                        {/* Анимированный лоадер при генерации картинки */}
                        {isImageGenerating && (
                            <div className="message-row ai">
                                <div className="message-bubble image-generation-bubble">
                                    <div className="image-skeleton-loader">
                                        <div className="shimmer-effect"></div>
                                        <div className="scan-line"></div>
                                        <div className="skeleton-glow"></div>
                                        <div className="skeleton-content">
                                            <FaImage className="skeleton-icon" size={32} />
                                            <span className="generating-text">
                                                Рисую<span className="dots"><span>.</span><span>.</span><span>.</span></span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                        <p className='pzax'>Захар — это искусственный интеллект, и ему свойственно ошибаться. Проверяйте важные данные.</p>
                    </div>

                    <div className="input-container-wrapper">
                        {filePreview && (
                            <div className="file-preview-box">
                                {selectedFile?.type.startsWith('image/') ? (
                                    <img src={filePreview} alt="Превью" className="preview-img-thumb" />
                                ) : (
                                    <span className="preview-file-name">{selectedFile?.name}</span>
                                )}
                                <button onClick={clearFile} className="remove-file-btn"><FaTimes size={12} /></button>
                            </div>
                        )}

                        <div className="chat-input-area">
                            <div className="attachment-container" ref={attachMenuRef} style={{ position: 'relative', display: 'flex' }}>
                                <button
                                    className="attach-btn"
                                    onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                                    title="Вложения"
                                >
                                    <FaPlus size={16} style={{
                                        transform: isAttachMenuOpen ? 'rotate(45deg)' : 'none',
                                        transition: 'transform 0.2s ease'
                                    }} />
                                </button>

                                {isAttachMenuOpen && (
                                    <div className="attach-dropdown-menu" style={{
                                        position: 'absolute',
                                        bottom: 'calc(100% + 15px)',
                                        left: '0',
                                        backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                                        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                        zIndex: 100,
                                        minWidth: '220px'
                                    }}>
                                        <button
                                            onClick={() => {
                                                fileInputRef.current.click();
                                                setIsAttachMenuOpen(false);
                                            }}
                                            style={{
                                                padding: '10px 12px', textAlign: 'left', background: 'transparent',
                                                border: 'none', color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                                                cursor: 'pointer', borderRadius: '8px', fontSize: '14px',
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = theme === 'dark' ? '#334155' : '#f1f5f9'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            Добавить фото
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsImageMode(!isImageMode);
                                                setIsAttachMenuOpen(false);
                                            }}
                                            style={{
                                                padding: '10px 12px', textAlign: 'left', background: 'transparent',
                                                border: 'none', color: isImageMode ? '#ef4444' : (theme === 'dark' ? '#f1f5f9' : '#0f172a'),
                                                cursor: 'pointer', borderRadius: '8px', fontSize: '14px',
                                                transition: 'background 0.2s',
                                                fontWeight: isImageMode ? 'bold' : 'normal'
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = theme === 'dark' ? '#334155' : '#f1f5f9'}
                                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            {isImageMode ? "Отменить генерацию" : "Сгенерировать изображение"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                                accept="image/*"
                            />

                            <textarea
                                className="chat-field"
                                value={input}
                                placeholder={isImageMode ? "Опишите, что нужно нарисовать..." : "Введите сообщение..."}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                            />

                            {/* <div className="input-actions-right"> */}
                            <button onClick={toggleListening} disabled={isLoading} className={`mic-btn ${isListening ? 'listening' : ''}`}>
                                {isListening ? <FaStop size={16} /> : <FaMicrophone size={16} />}
                            </button>

                            <button className="send-btn" onClick={handleSend} disabled={isLoading || (!input.trim() && !selectedFile)}>
                                <GoPaperAirplane size={18} />
                            </button>
                            {/* </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}