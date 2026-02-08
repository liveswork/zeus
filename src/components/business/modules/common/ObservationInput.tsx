import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Extend Window type to include webkitSpeechRecognition
declare global {
    // Declare SpeechRecognition type for TypeScript
    interface SpeechRecognition extends EventTarget {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        start(): void;
        stop(): void;
        abort(): void;
        onaudioend?: (ev: Event) => any;
        onaudiostart?: (ev: Event) => any;
        onend?: (ev: Event) => any;
        onerror?: (ev: any) => any;
        onnomatch?: (ev: Event) => any;
        onresult?: (ev: any) => any;
        onsoundend?: (ev: Event) => any;
        onsoundstart?: (ev: Event) => any;
        onspeechend?: (ev: Event) => any;
        onspeechstart?: (ev: Event) => any;
        onstart?: (ev: Event) => any;
    }
    interface Window {
        webkitSpeechRecognition?: {
            new (): SpeechRecognition;
        };
    }
}

// --- HOOK DE SÍNTESE DE VOZ ---
const useSpeechSynthesis = () => {
    const [bestVoice, setBestVoice] = useState<SpeechSynthesisVoice | null>(null);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Find Portuguese voices (pt-BR or pt-PT)
                const ptVoices = voices.filter(voice => 
                    voice.lang.startsWith('pt-BR') || voice.lang.startsWith('pt-PT')
                );
                
                const preferredVoice =
                    ptVoices.find(v => v.name.includes('Google')) ||
                    ptVoices.find(v => v.localService) ||
                    ptVoices[0];
                setBestVoice(preferredVoice || null);
            }
        };
        
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // Correções de pronúncia
    const pronunciationFixes: { [key: string]: string } = {
        'pizza': 'pítsa',
        'calabresa': 'calabreza',
        'muçarela': 'mussarela',
        'mussarela': 'mussarela',
        'Coca': 'Coca Kola',
        'Coca-Cola': 'Coca Kola',
        'Guaraná': 'Guaranáh',
        'refrigerante': 'refrigerante',
        'borda': 'borda',
        'recheada': 'recheada'
    };

    const speak = useCallback((text: string) => {
        if ('speechSynthesis' in window && bestVoice) {
            window.speechSynthesis.cancel();
            
            let correctedText = text;
            Object.entries(pronunciationFixes).forEach(([word, fix]) => {
                const regex = new RegExp(`\\b${word}\\b`, 'gi');
                correctedText = correctedText.replace(regex, fix);
            });
            
            const utterance = new SpeechSynthesisUtterance(correctedText);
            utterance.voice = bestVoice;
            utterance.lang = 'pt-BR';
            utterance.rate = 1.1;
            utterance.pitch = 1;
            
            window.speechSynthesis.speak(utterance);
        } else if (!bestVoice) {
            console.warn("Nenhuma voz disponível para síntese de fala");
        }
    }, [bestVoice]);

    return speak;
};

// --- HOOK DE RECONHECIMENTO DE VOZ ---
const useSpeechRecognition = (onResult: (result: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const speak = useSpeechSynthesis();

    useEffect(() => {
        // Verifique se o navegador suporta reconhecimento de fala
        const SpeechRecognition =
            (window as typeof window & {
                SpeechRecognition?: typeof window.webkitSpeechRecognition;
                webkitSpeechRecognition?: typeof window.webkitSpeechRecognition;
            }).SpeechRecognition ||
            (window as typeof window & {
                SpeechRecognition?: typeof window.webkitSpeechRecognition;
                webkitSpeechRecognition?: typeof window.webkitSpeechRecognition;
            }).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("A API de reconhecimento de fala não é compatível com este navegador");
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        
        recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript;
            onResult(transcript);
        };
        
        recognitionRef.current.onstart = () => setIsListening(true);
        
        recognitionRef.current.onend = () => {
            setIsListening(false);
        };
        
        recognitionRef.current.onerror = (event: any) => {
            console.error("Erro no reconhecimento de voz:", event.error);
            if (event.error === 'no-speech') {
                speak("Não ouvi nada. Por favor, tente novamente.");
            } else {
                speak("Desculpe, tive um problema para entender.");
            }
            setIsListening(false);
        };

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [onResult, speak]);

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) {
            speak("Recurso de voz não disponível neste navegador.");
            return;
        }
        
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            // Pare qualquer instância anterior
            recognitionRef.current.stop();
            
            // Dê tempo para que a parada seja concluída antes de começar novamente
            setTimeout(() => {
                try {
                    speak("Estou ouvindo.");
                    // Pequeno atraso antes de iniciar o reconhecimento para evitar capturar o TTS
                    setTimeout(() => recognitionRef.current.start(), 500);
                } catch (error) {
                    console.error("Erro ao iniciar o reconhecimento de fala:", error);
                    setIsListening(false);
                }
            }, 100);
        }
    }, [isListening, speak]);

    return { isListening, toggleListening };
};

// --- FUNÇÃO DE PARSE ---
const normalizeText = (text: string) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const numberWords: { [key: string]: number } = {
    'um': 1, 'uma': 1, '1': 1,
    'dois': 2, 'duas': 2, '2': 2,
    'tres': 3, 'três': 3, '3': 3,
    'quatro': 4, '4': 4,
    'cinco': 5, '5': 5,
    'seis': 6, '6': 6,
    'sete': 7, '7': 7,
    'oito': 8, '8': 8,
    'nove': 9, '9': 9,
    'dez': 10, '10': 10
};

const parseMultiCommand = (transcript: string, products: any[]) => {
    const lowerTranscript = normalizeText(transcript);
    console.log("Processing transcript:", transcript);

    // 1. Detecção de Intenção de Combinação
    const combinationKeywords = ['metade', 'meia', 'meio a meio', 'meio'];
    const isCombined = combinationKeywords.some(keyword => lowerTranscript.includes(keyword));

    if (isCombined) {
        const parts = lowerTranscript.split(new RegExp(combinationKeywords.join('|'), 'g')).filter(p => p.trim());
        if (parts.length < 2) {
            return { error: "Entendi que é uma pizza meio a meio, mas não consegui identificar os dois sabores." };
        }

        const flavors = parts.slice(0, 2).map(part => {
            const chunkWords = new Set(part.trim().split(/\s+/).filter(word => word.length > 2)); // Ignore small words
            let bestMatch = { product: null as any, score: 0 };
            
            products.forEach(product => {
                if (product.category === 'Pizzas') {
                    const productNameNormalized = normalizeText(product.name);
                    const productWords = new Set(productNameNormalized.split(/\s+/));
                    
                    let score = 0;
                    chunkWords.forEach(word => {
                        if (productWords.has(word)) score++;
                    });
                    
                    // Bonus if all product words are found in the transcript
                    if (score > 0 && score === productWords.size) {
                        score *= 2;
                    }
                    
                    if (score > bestMatch.score) {
                        bestMatch = { product, score };
                    }
                }
            });
            
            return bestMatch.score > 0 ? bestMatch.product : null;
        });

        if (flavors.some(f => f === null)) {
            return { error: "Não consegui encontrar um dos sabores da pizza meio a meio." };
        }

        const [half1, half2] = flavors;
        
        // Lógica de negócio: o preço é o da metade mais cara
        const finalPrice = Math.max(half1.salePrice, half2.salePrice);
        
        const combinedProduct = {
            isCombined: true,
            id: `combined-${half1.id}-${half2.id}`,
            name: `Pizza Meio a Meio: ${half1.name} / ${half2.name}`,
            salePrice: finalPrice,
            costPrice: (half1.costPrice + half2.costPrice) / 2,
            halves: [half1, half2],
        };

        return { commands: [{ product: combinedProduct, quantity: 1, observation: '' }] };
    }

    // Se não for combinado, usa a lógica de múltiplos itens
    const commands = [];
    const chunks = lowerTranscript.split(/, | e | mais /).filter(chunk => chunk.trim());

    for (const chunk of chunks) {
        if (!chunk.trim()) continue;
        let quantity = 1;
        let processedChunk = chunk.trim();

        // Check for quantity at the beginning
        const words = processedChunk.split(/\s+/);
        const possibleQuantity = words[0];
        
        if (numberWords[possibleQuantity] !== undefined) {
            quantity = numberWords[possibleQuantity];
            processedChunk = words.slice(1).join(' '); // Remove quantity from the chunk
        } else {
            // Check for digits
            const digitMatch = processedChunk.match(/^(\d+)\s/);
            if (digitMatch) {
                quantity = parseInt(digitMatch[1], 10);
                processedChunk = processedChunk.replace(digitMatch[0], '');
            }
        }

        const chunkWords = new Set(processedChunk.split(/\s+/).filter(word => word.length > 2));
        let bestMatch = { product: null as any, score: 0 };
        
        products.forEach(product => {
            const productNameNormalized = normalizeText(product.name);
            const productWords = new Set(productNameNormalized.split(/\s+/));
            
            let score = 0;
            chunkWords.forEach(word => {
                if (productWords.has(word)) score++;
            });
            
            // Bonus if all product words are found in the transcript
            if (score > 0 && score === productWords.size) {
                score *= 2;
            }
            
            if (score > bestMatch.score) {
                bestMatch = { product, score };
            }
        });

        if (bestMatch.product) {
            const observationKeywords = ['sem', 'com', 'adicional', 'borda', 'retirar', 'extra', 'tirar'];
            let observation = '';
            
            for (const keyword of observationKeywords) {
                if (processedChunk.includes(keyword)) {
                    observation = processedChunk.substring(processedChunk.indexOf(keyword)).trim();
                    break;
                }
            }
            
            commands.push({ 
                product: bestMatch.product, 
                quantity, 
                observation: observation || '' 
            });
        }
    }

    if (commands.length === 0) {
        return { error: "Não consegui identificar nenhum produto no seu comando." };
    }
    
    return { commands };
};

// --- COMPONENTE PRINCIPAL ---
interface NexusScribeAIProps {
    products: any[];
    onMultiCommand: (commands: { product: any, quantity: number, observation: string }[]) => void;
}

export const NexusScribeAI: React.FC<NexusScribeAIProps> = ({ products, onMultiCommand }) => {
    const speak = useSpeechSynthesis();
    const [lastTranscript, setLastTranscript] = useState('');

    const handleSpeechResult = useCallback((transcript: string) => {
        // Avoid processing the same transcript multiple times
        if (transcript === lastTranscript) return;
        
        setLastTranscript(transcript);
        console.log("Voice input:", transcript);
        
        const result = parseMultiCommand(transcript, products);
        
        if (result.error) {
            speak(result.error);
        } else if (result.commands && result.commands.length > 0) {
            onMultiCommand(result.commands);
            
            const itemsList = result.commands.map(cmd => {
                let text = `${cmd.quantity} ${cmd.product.name}`;
                if (cmd.observation) {
                    text += ` (${cmd.observation})`;
                }
                return text;
            });
            
            let confirmation = 'Ok. Adicionando ';
            if (itemsList.length === 1) {
                confirmation += itemsList[0];
            } else if (itemsList.length > 1) {
                const lastItem = itemsList.pop();
                confirmation += itemsList.join(', ') + ' e ' + lastItem;
            }
            
            speak(confirmation);
        }
    }, [speak, onMultiCommand, products, lastTranscript]);

    const { isListening, toggleListening } = useSpeechRecognition(handleSpeechResult);

    return (
        <div className="bg-white p-3 rounded-xl shadow-sm text-center">
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Nexus Scribe AI™</h4>
            <p className="text-xs text-gray-500 mb-3">Toque no microfone e fale o seu pedido.</p>
            <button
                onClick={toggleListening}
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening 
                        ? 'bg-red-500 text-white animate-pulse shadow-2xl' 
                        : 'bg-orange-500 text-white shadow-lg hover:bg-orange-600'
                }`}
                aria-label={isListening ? "Parar de ouvir" : "Iniciar reconhecimento de voz"}
            >
                {isListening ? <MicOff size={32} /> : <Mic size={36} />}
            </button>
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-center gap-2 mt-3 text-sm text-red-600"
                    >
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                        <span className="font-semibold">Ouvindo...</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};