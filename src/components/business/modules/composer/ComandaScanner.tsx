import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Webcam from 'react-webcam'; // Importa a biblioteca da câmara

interface ComandaScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (imageData: string) => void;
}

export const ComandaScanner: React.FC<ComandaScannerProps> = ({ isOpen, onClose, onScan }) => {
    const webcamRef = useRef<Webcam>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCapture = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setCapturedImage(imageSrc);
        }
    }, [webcamRef]);

    const handleConfirmScan = () => {
        if (capturedImage) {
            setIsProcessing(true);
            onScan(capturedImage);
            // O componente pai será responsável por fechar o modal
        }
    };
    
    const handleRetake = () => {
        setCapturedImage(null);
    };

    // Reseta o estado quando o modal é fechado
    useEffect(() => {
        if (!isOpen) {
            setCapturedImage(null);
            setIsProcessing(false);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4"
                >
                    <div className="w-full max-w-md h-[70vh] rounded-xl overflow-hidden border-4 border-dashed border-gray-600 relative">
                        {capturedImage ? (
                            <img src={capturedImage} alt="Comanda capturada" className="w-full h-full object-cover" />
                        ) : (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="w-full h-full object-cover"
                            />
                        )}
                    </div>
                    
                    <p className="text-white mt-4 text-center">
                        {capturedImage ? "Verifique a imagem antes de confirmar." : "Posicione a comanda e capture a imagem."}
                    </p>

                    <div className="absolute bottom-10 flex items-center justify-center w-full gap-12">
                        {capturedImage ? (
                            <>
                                <button onClick={handleRetake} className="p-4 bg-white bg-opacity-20 rounded-full text-white">
                                    <RefreshCw size={28} />
                                </button>
                                <button onClick={handleConfirmScan} disabled={isProcessing} className="p-6 bg-green-500 rounded-full text-white">
                                    {isProcessing ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div> : <Check size={32} />}
                                </button>
                            </>
                        ) : (
                            <button onClick={handleCapture} className="p-6 bg-white rounded-full text-orange-500">
                                <Camera size={32} />
                            </button>
                        )}
                    </div>
                     <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 rounded-full text-white">
                        <X size={24} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};